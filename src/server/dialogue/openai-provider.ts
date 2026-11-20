import { createHash } from "node:crypto";
import { createMeteredDialogueProvider } from "./metered-provider";
import type { DialogueProvider } from "../../components/mafia/dialogue/types";

type Options = Pick<Parameters<typeof createMeteredDialogueProvider>[0], "gameId" | "budget" | "isCurrent"> & {
  apiKey?: string;
  model?: string;
  fetchImpl?: typeof fetch;
};

const MAX_RESPONSE_BYTES = 32_768;
const FORMAT = {
  type: "json_schema", name: "npc_dialogue", strict: true,
  schema: { type: "object", properties: { text: { type: "string" } }, required: ["text"], additionalProperties: false },
};

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

async function readJson(response: Response, signal: AbortSignal): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("응답 본문이 없습니다.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      signal.throwIfAborted();
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error("응답 크기가 상한을 초과했습니다.");
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  signal.throwIfAborted();
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

function dialogueOutput(value: unknown): unknown {
  const response = record(value);
  if (response?.status !== "completed" || response.error != null || response.incomplete_details != null
    || !Array.isArray(response.output)) throw new Error("완료된 대사 응답이 아닙니다.");
  const messages = response.output.filter((item: unknown) => record(item)?.type === "message");
  if (response.output.some((item: unknown) => !["message", "reasoning"].includes(String(record(item)?.type)))
    || messages.length !== 1) throw new Error("대사 메시지 형식이 올바르지 않습니다.");
  const message = record(messages[0]);
  if (message?.role !== "assistant" || message.status !== "completed" || !Array.isArray(message.content)
    || message.content.length !== 1) throw new Error("대사 메시지가 완료되지 않았습니다.");
  const content = record(message.content[0]);
  if (content?.type !== "output_text" || typeof content.text !== "string") throw new Error("대사 텍스트가 없습니다.");
  // 길이·역할 공개·추가 필드는 공통 조정기가 다시 검사합니다.
  return JSON.parse(content.text);
}

// 서버 환경 변수의 키·모델을 명시적으로 전달합니다. 키가 없으면 네트워크 없이 비활성화합니다.
export function createOpenAiDialogueProvider(options: Options): DialogueProvider | undefined {
  const apiKey = options.apiKey?.trim();
  if (!apiKey) return undefined;
  const model = options.model?.trim();
  if (/[\r\n]/u.test(apiKey) || !model || model.length > 128 || !/^[a-zA-Z0-9._:-]+$/u.test(model)) {
    throw new RangeError("서버의 OpenAI 키·모델 설정을 확인하세요.");
  }
  const transport = options.fetchImpl ?? fetch;
  // 인증 헤더는 고정된 공식 호스트에만 전송하며 리디렉션과 자동 재시도를 허용하지 않습니다.
  async function post(path: "" | "/input_tokens", body: unknown, signal: AbortSignal): Promise<unknown> {
    try {
      signal.throwIfAborted();
      const response = await transport(`https://api.openai.com/v1/responses${path}`, {
        method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body), signal, cache: "no-store", redirect: "error",
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error("요청에 실패했습니다.");
      }
      return await readJson(response, signal);
    } catch {
      // 서버에서도 공급자의 원본 오류나 키를 예외에 포함하지 않습니다.
      throw new Error("OpenAI 대사 요청을 처리하지 못했습니다.");
    }
  }

  return createMeteredDialogueProvider({
    gameId: options.gameId, budget: options.budget, isCurrent: options.isCurrent,
    providerKey: createHash("sha256").update(JSON.stringify({ model, protocol: "openai-responses-dialogue-v1", format: FORMAT })).digest("hex"),
    async prepare(input, { signal }) {
      const body = {
        model, instructions: input.instructions,
        input: [{ role: "user", content: [{ type: "input_text", text: JSON.stringify({ context: input.context, maxOutputChars: input.maxOutputChars }) }] }],
        text: { format: structuredClone(FORMAT) },
      };
      const counted = record(await post("/input_tokens", body, signal));
      if (counted?.object !== "response.input_tokens" || typeof counted.input_tokens !== "number"
        || !Number.isSafeInteger(counted.input_tokens) || counted.input_tokens < 1) {
        throw new Error("입력 토큰 응답이 올바르지 않습니다.");
      }
      return {
        inputTokens: counted.input_tokens,
        async invoke({ signal: invokeSignal, maxOutputTokens }) {
          const response = await post("", { ...body, max_output_tokens: maxOutputTokens, store: false, stream: false }, invokeSignal);
          try {
            return dialogueOutput(response);
          } catch {
            throw new Error("OpenAI 대사 응답이 올바르지 않습니다.");
          }
        },
      };
    },
  });
}
