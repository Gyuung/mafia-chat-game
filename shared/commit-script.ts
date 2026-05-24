import { execFile, spawn, execSync } from "child_process";
import { mkdtemp, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// Windows에서 한글 깨짐 방지를 위해 터미널 인코딩을 UTF-8로 설정
if (process.platform === "win32") {
  try {
    const system32 = process.env.SystemRoot 
      ? join(process.env.SystemRoot, "System32") 
      : "C:\\Windows\\System32";
    execSync(`"${join(system32, "chcp.com")}" 65001`, { stdio: "ignore" });
  } catch {
    // 무시
  }
}

type CommitPlan = {
  commits: Array<{
    message: string;
    files: string[];
  }>;
};

const AI_ENGINE = process.env.AI_ENGINE || "codex";
const AI_MODEL = process.env.AI_MODEL || process.env.CODEX_MODEL;
const COMMIT_PLAN = process.env.COMMIT_PLAN;
const MAX_DIFF_CHARS = 60_000;
const commitTypes = [
  "✨ feat - 새로운 기능 추가",
  "🐛 fix - 버그 수정",
  "📝 docs - 문서 수정 및 추가",
  "🔧 modify - 코드 간단 수정",
  "🎨 style - 코드 의미에 영향이 없는 스타일 변경",
  "♻️ refactor - 코드 리팩토링",
  "🧹 chore - 빌드, 패키지, 설정, 기타 작업",
].join("\n");

async function git(args: string[]) {
  return execFileAsync("git", args, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20,
  });
}

async function isIgnored(file: string) {
  try {
    await git(["check-ignore", "-q", "--", file]);
    return true;
  } catch (error) {
    const exitCode = (error as { code?: number }).code;
    if (exitCode === 1) {
      return false;
    }

    throw error;
  }
}

function splitNullSeparated(stdout: string) {
  return stdout
    .split("\0")
    .map((file) => file.trim())
    .filter(Boolean);
}

async function hasHeadCommit() {
  try {
    await git(["rev-parse", "--verify", "HEAD"]);
    return true;
  } catch {
    return false;
  }
}

async function getChangedFiles() {
  const files = new Set<string>();

  if (await hasHeadCommit()) {
    const { stdout } = await git(["diff", "--name-only", "-z", "HEAD", "--"]);
    splitNullSeparated(stdout).forEach((file) => files.add(file));
  } else {
    const { stdout } = await git(["ls-files", "-z"]);
    splitNullSeparated(stdout).forEach((file) => files.add(file));
  }

  const { stdout } = await git(["ls-files", "--others", "--exclude-standard", "-z"]);
  splitNullSeparated(stdout).forEach((file) => files.add(file));

  return [...files].sort((a, b) => a.localeCompare(b));
}

async function getUntrackedFiles(files: string[]) {
  const fileSet = new Set(files);
  const { stdout } = await git(["ls-files", "--others", "--exclude-standard", "-z"]);
  return splitNullSeparated(stdout).filter((file) => fileSet.has(file));
}

async function getDiffForAi(files: string[]) {
  const diffParts: string[] = [];

  const { stdout: trackedDiff } = await git(["diff", "--no-ext-diff", "--", ...files]);
  if (trackedDiff.trim()) {
    diffParts.push(trackedDiff);
  }

  const { stdout: stagedDiff } = await git(["diff", "--cached", "--no-ext-diff", "--", ...files]);
  if (stagedDiff.trim()) {
    diffParts.push(stagedDiff);
  }

  const untrackedFiles = await getUntrackedFiles(files);
  for (const file of untrackedFiles) {
    try {
      const content = await readFile(file, "utf8");
      if (content.trim()) {
        diffParts.push(`New file: ${file}\n\n${content}`);
      }
    } catch (error) {
      diffParts.push(`New or binary file: ${file}\n\n${String(error)}`);
    }
  }

  const diff = diffParts.join("\n");
  return diff.length > MAX_DIFF_CHARS
    ? `${diff.slice(0, MAX_DIFF_CHARS)}\n\n[diff truncated for AI analysis]`
    : diff;
}

async function runAi(prompt: string) {
  if (AI_ENGINE === "codex") {
    const tempDir = await mkdtemp(join(tmpdir(), "ai-commit-"));
    const outputFile = join(tempDir, "commit-plan.json");
    const codexCommand = process.platform === "win32" ? "codex.cmd" : "codex";
    const args = [
      "exec",
      "--cd",
      process.cwd(),
      "--sandbox",
      "read-only",
      "--output-last-message",
      outputFile,
      "-",
    ];

    if (AI_MODEL) {
      args.splice(1, 0, "--model", AI_MODEL);
    }

    try {
      await new Promise<void>((resolve, reject) => {
        const child = spawn(codexCommand, args, {
          stdio: ["pipe", "inherit", "inherit"],
          shell: process.platform === "win32",
        });

        child.on("error", reject);
        child.on("close", (code) => {
          if (code === 0) {
            resolve();
            return;
          }

          reject(new Error(`codex exec exited with code ${code}`));
        });

        child.stdin.end(prompt);
      });

      return await readFile(outputFile, "utf8");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  } else {
    const geminiCommand = process.platform === "win32" ? "gemini.cmd" : "gemini";
    // 프롬프트를 인자로 전달하면 Windows에서 인코딩 문제가 발생하므로 stdin으로 전달
    const args = ["-o", "json", "-p", "Create git commits based on the provided instructions and diff:"];
    if (AI_MODEL) {
      args.push("-m", AI_MODEL);
    }

    return await new Promise<string>((resolve, reject) => {
      const child = spawn(geminiCommand, args, {
        stdio: ["pipe", "pipe", "inherit"],
        shell: process.platform === "win32",
      });

      let stdout = "";
      child.stdout.on("data", (data: Buffer) => {
        stdout += data.toString("utf8");
      });

      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) {
          resolve(stdout);
          return;
        }
        reject(new Error(`gemini exited with code ${code}`));
      });

      child.stdin.write(prompt, "utf8");
      child.stdin.end();
    });
  }
}

function extractJson(content: string) {
  const jsonStart = content.indexOf("{");
  const jsonEnd = content.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
    throw new Error(`AI response did not include JSON: ${content}`);
  }

  return content.slice(jsonStart, jsonEnd + 1);
}

function assertValidPlan(plan: CommitPlan, changedFiles: string[]) {
  const changedFileSet = new Set(changedFiles);
  const plannedFiles = new Set<string>();

  if (!Array.isArray(plan.commits) || plan.commits.length === 0) {
    throw new Error("AI did not return any commits.");
  }

  for (const commit of plan.commits) {
    if (!commit.message?.trim()) {
      throw new Error("AI returned a commit without a message.");
    }

    if (!Array.isArray(commit.files) || commit.files.length === 0) {
      throw new Error(`AI returned commit "${commit.message}" without files.`);
    }

    for (const file of commit.files) {
      if (!changedFileSet.has(file)) {
        throw new Error(`AI returned an unknown file: ${file}`);
      }

      if (plannedFiles.has(file)) {
        throw new Error(`AI assigned the same file more than once: ${file}`);
      }

      plannedFiles.add(file);
    }
  }

  const missingFiles = changedFiles.filter((file) => !plannedFiles.has(file));
  if (missingFiles.length > 0) {
    throw new Error(`AI did not assign these files: ${missingFiles.join(", ")}`);
  }
}

async function createAiCommitPlan(files: string[], diff: string): Promise<CommitPlan> {
  if (COMMIT_PLAN) {
    const plan = JSON.parse(COMMIT_PLAN) as CommitPlan;
    assertValidPlan(plan, files);
    return plan;
  }

  const prompt = [
    "You are an expert software engineer creating atomic git commits.",
    "Analyze the changed files and diff, then split the work into logical commits.",
    "Do not edit files. Do not run git commands. Only return the requested JSON.",
    "Rules:",
    "- Every changed file must appear in exactly one commit.",
    "- Use Korean commit messages.",
    "- Use this commit message style: emoji type(scope): message.",
    "- Scope is optional. Use it only when it makes the commit clearer.",
    "- Choose the emoji/type from this list only:",
    commitTypes,
    "- Prefer small, meaningful commits by task intent, not by folder only.",
    "- Do not invent files that are not in the changed file list.",
    '- Return JSON only, with this shape: {"commits":[{"message":"✨ feat(scope): message","files":["path"]}]}',
    "",
    `Changed files:\n${files.map((file) => `- ${file}`).join("\n")}`,
    "",
    `Diff:\n${diff || "[No textual diff available]"}`,
  ].join("\n");

  const content = await runAi(prompt);
  const plan = JSON.parse(extractJson(content)) as CommitPlan;
  assertValidPlan(plan, files);
  return plan;
}

async function commitPlannedChange(message: string, files: string[]) {
  const addableFiles: string[] = [];
  for (const file of files) {
    if (!(await isIgnored(file))) {
      addableFiles.push(file);
    }
  }

  if (addableFiles.length > 0) {
    await git(["add", "--all", "--", ...addableFiles]);
  }

  await git(["commit", "-m", message]);
  console.log(`Committed ${files.length} file(s): ${message}`);
}

async function runCommitScript() {
  const files = await getChangedFiles();

  if (files.length === 0) {
    console.log("No changes to commit.");
    return;
  }

  const diff = await getDiffForAi(files);
  const plan = await createAiCommitPlan(files, diff);

  const { stdout: stagedFilesOutput } = await git([
    "diff",
    "--cached",
    "--name-only",
    "-z",
    "--",
    ...files,
  ]);
  const stagedFiles = splitNullSeparated(stagedFilesOutput);
  if (stagedFiles.length > 0) {
    await git(["restore", "--staged", "--", ...stagedFiles]);
  }

  console.log(`AI planned ${plan.commits.length} commit(s).`);
  for (const commit of plan.commits) {
    await commitPlannedChange(commit.message, commit.files);
  }
}

runCommitScript().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Auto commit failed:", message);
  process.exitCode = 1;
});
