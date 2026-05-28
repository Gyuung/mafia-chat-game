import { execFile, spawn, execSync } from "child_process";
import { mkdtemp, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

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

const AI_ENGINE = process.env.AI_ENGINE;
const AI_MODEL = process.env.AI_MODEL || process.env.CODEX_MODEL;
const COMMIT_PLAN = process.env.COMMIT_PLAN;
const MAX_DIFF_CHARS = 60_000;

const ARGS = process.argv.slice(2);
const IS_WATCH = ARGS.includes("--watch") || ARGS.includes("-w");
const IS_PUSH = ARGS.includes("--push") || ARGS.includes("-p");

const commitTypes = [
  "✨ feat - 새로운 기능 추가",
  "🐛 fix - 버그 수정",
  "📝 docs - 문서 수정 및 추가",
  "🔧 modify - 코드 간단 수정",
  "🎨 style - 코드 의미에 영향이 없는 스타일 변경",
  "♻️ refactor - 코드 리팩토링",
  "🧹 chore - 빌드, 패키지, 설정, 기타 작업",
].join("\n");

let cachedGitPath: string | null = null;

async function git(args: string[]): Promise<{ stdout: string; stderr: string }> {
  const options = {
    encoding: "utf8" as const,
    maxBuffer: 1024 * 1024 * 20,
    shell: process.platform === "win32",
  };

  const run = async (cmd: string, useShell: boolean) => {
    const command = useShell && cmd.includes(" ") ? `"${cmd}"` : cmd;
    // Windows에서 shell: true 사용 시 인자에 공백이 있으면 제대로 쿼팅되지 않는 경우가 있음
    const processedArgs = process.platform === "win32" && useShell
      ? args.map(arg => arg.includes(" ") || arg.includes(":") ? `"${arg}"` : arg)
      : args;
    return await execFileAsync(command, processedArgs, { ...options, shell: useShell });
  };

  if (cachedGitPath) {
    return await run(cachedGitPath, true);
  }

  try {
    return await run("git", true);
  } catch (originalError) {
    if (process.platform === "win32") {
      const commonPaths = [
        "C:\\Program Files\\Git\\bin\\git.exe",
        "C:\\Program Files\\Git\\cmd\\git.exe",
        "C:\\Program Files (x86)\\Git\\bin\\git.exe",
      ];

      for (const gitPath of commonPaths) {
        try {
          const result = await run(gitPath, false);
          cachedGitPath = gitPath;
          return result;
        } catch {
          continue;
        }
      }
    }
    throw originalError;
  }
}

async function isIgnored(file: string) {
  try {
    await git(["check-ignore", "-q", "--", file]);
    return true;
  } catch {
    return false;
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
  const [headExists, untrackedFilesOutput] = await Promise.all([
    hasHeadCommit(),
    git(["ls-files", "--others", "--exclude-standard", "-z"])
  ]);

  const files = new Set<string>();

  if (headExists) {
    const { stdout } = await git(["diff", "--name-only", "-z", "HEAD", "--"]);
    splitNullSeparated(stdout).forEach((file) => files.add(file));
  } else {
    const { stdout } = await git(["ls-files", "-z"]);
    splitNullSeparated(stdout).forEach((file) => files.add(file));
  }

  splitNullSeparated(untrackedFilesOutput.stdout).forEach((file) => files.add(file));

  return [...files]
    .filter(file => !file.startsWith(".git/") && !file.includes("node_modules/"))
    .sort((a, b) => a.localeCompare(b));
}

async function getUntrackedFiles(files: string[]) {
  const fileSet = new Set(files);
  const { stdout } = await git(["ls-files", "--others", "--exclude-standard", "-z"]);
  return splitNullSeparated(stdout).filter((file) => fileSet.has(file));
}

async function getDiffForAi(files: string[]) {
  const [trackedDiffRes, stagedDiffRes, untrackedFiles] = await Promise.all([
    git(["diff", "--no-ext-diff", "--", ...files]),
    git(["diff", "--cached", "--no-ext-diff", "--", ...files]),
    getUntrackedFiles(files)
  ]);

  const diffParts: string[] = [];

  if (trackedDiffRes.stdout.trim()) {
    diffParts.push(trackedDiffRes.stdout);
  }

  if (stagedDiffRes.stdout.trim()) {
    diffParts.push(stagedDiffRes.stdout);
  }

  const fileContents = await Promise.all(
    untrackedFiles.map(async (file) => {
      try {
        const content = await readFile(file, "utf8");
        return content.trim() ? `New file: ${file}\n\n${content}` : null;
      } catch (error) {
        return `New or binary file: ${file}\n\n${String(error)}`;
      }
    })
  );

  fileContents.forEach(content => {
    if (content) diffParts.push(content);
  });

  const diff = diffParts.join("\n");
  return diff.length > MAX_DIFF_CHARS
    ? `${diff.slice(0, MAX_DIFF_CHARS)}\n\n[diff truncated for AI analysis]`
    : diff;
}

async function detectAiEngine(): Promise<string> {
  if (AI_ENGINE) return AI_ENGINE;

  const checkCommand = async (cmd: string) => {
    try {
      const fullCmd = process.platform === "win32" ? `${cmd}.cmd` : cmd;
      await execFileAsync(fullCmd, ["--version"], { shell: process.platform === "win32" });
      return true;
    } catch {
      try {
        await execFileAsync(cmd, ["--version"], { shell: process.platform === "win32" });
        return true;
      } catch {
        return false;
      }
    }
  };

  const engines = ["gemini", "codex", "claude", "ollama", "gpt"];
  for (const engine of engines) {
    if (await checkCommand(engine)) return engine;
  }

  return "gemini";
}

async function runAi(prompt: string) {
  const engine = await detectAiEngine();
  
  if (engine === "codex") {
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
      const run = async (c: string) => {
        return await new Promise<void>((resolve, reject) => {
          const child = spawn(c, args, {
            stdio: ["pipe", "inherit", "inherit"],
            shell: process.platform === "win32",
          });
          child.on("error", reject);
          child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`${c} exited with ${code}`)));
          child.stdin.end(prompt);
        });
      };

      try {
        await run(codexCommand);
      } catch {
        await run("codex");
      }

      return await readFile(outputFile, "utf8");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  } else {
    const cmd = process.platform === "win32" ? `${engine}.cmd` : engine;
    // -p 플래그 대신 stdin으로만 프롬프트를 전달해보기
    const args = ["-o", "json", "-p", "-"];
    if (AI_MODEL) {
      args.push("-m", AI_MODEL);
    }

    const run = async (c: string) => {
      return await new Promise<string>((resolve, reject) => {
        const child = spawn(c, args, {
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
          reject(new Error(`${c} exited with code ${code}`));
        });

        child.stdin.write(prompt, "utf8");
        child.stdin.end();
      });
    };

    try {
      return await run(cmd);
    } catch {
      return await run(engine);
    }
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

async function runCommitOnce() {
  const files = await getChangedFiles();

  if (files.length === 0) {
    return false;
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

  if (IS_PUSH) {
    console.log("Pushing to origin...");
    await git(["push"]);
  }

  return true;
}

async function runCommitScript() {
  if (IS_WATCH) {
    console.log("Watching for changes (ignoring .git and node_modules)...");
    const { watch } = await import("fs");
    let isRunning = false;
    let timeout: NodeJS.Timeout | null = null;

    const handleChange = async (filename: string | null) => {
      if (!filename) return;
      if (filename.startsWith(".git") || filename.includes("node_modules") || filename === "package-lock.json") return;

      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(async () => {
        if (isRunning) return;
        isRunning = true;
        try {
          const committed = await runCommitOnce();
          if (committed) {
            console.log("Auto-committed changes.");
          }
        } catch (error) {
          console.error("Auto-commit failed:", error instanceof Error ? error.message : String(error));
        } finally {
          isRunning = false;
        }
      }, 3000);
    };

    watch(process.cwd(), { recursive: true }, (event, filename) => {
      handleChange(filename).catch(console.error);
    });

    await runCommitOnce().catch(() => {});
    await new Promise(() => {});
  } else {
    const committed = await runCommitOnce();
    if (!committed) {
      console.log("No changes to commit.");
    }
  }
}

runCommitScript().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Commit script failed:", message);
  process.exitCode = 1;
});
