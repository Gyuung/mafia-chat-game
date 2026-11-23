import { createHash } from "node:crypto";
import { buildDialogueContext, MAX_MESSAGE_CHARS } from "../../components/mafia/dialogue/context";
import type { createDialogueCoordinator } from "../../components/mafia/dialogue/coordinator";
import type { GameState } from "../../components/mafia/engine/types";
import type { InternalMessage } from "../../components/mafia/engine/view";

export type DialogueGameAccess = {
  gameId: string;
  state: GameState;
  messages: readonly InternalMessage[];
  coordinator: Pick<ReturnType<typeof createDialogueCoordinator>, "request">;
};

type Options = {
  origin: string;
  fallback: string;
  authenticate(request: Request): Promise<{ playerId: string } | null>;
  loadGame(gameId: string): Promise<DialogueGameAccess | null>;
};

type Command = {
  gameId: string;
  requestId: string;
  speakerId: string;
  kind: "discussion" | "interrogation";
  expectedRound: number;
  expectedPhase: "day" | "vote";
  question?: string;
};

const MAX_BODY_BYTES = 4096;
const FIELDS = new Set(["gameId", "requestId", "speakerId", "kind", "expectedRound", "expectedPhase", "question"]);
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/u;

function id(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 128
    && value.trim() === value && !CONTROL_CHARS.test(value);
}

function command(value: unknown): Command | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (Object.keys(data).some((key) => !FIELDS.has(key)) || !id(data.gameId) || !id(data.requestId) || !id(data.speakerId)
    || !Number.isSafeInteger(data.expectedRound) || (data.expectedRound as number) < 1
    || (data.expectedPhase !== "day" && data.expectedPhase !== "vote")) return null;
  if (data.kind !== "discussion" && data.kind !== "interrogation") return null;
  if (data.kind === "interrogation") {
    if (typeof data.question !== "string" || !data.question.trim() || data.question.length > MAX_MESSAGE_CHARS) return null;
  } else if (Object.hasOwn(data, "question")) return null;
  return {
    gameId: data.gameId, requestId: data.requestId, speakerId: data.speakerId, kind: data.kind,
    expectedRound: data.expectedRound as number, expectedPhase: data.expectedPhase,
    ...(data.kind === "interrogation" ? { question: (data.question as string).trim() } : {}),
  };
}

class BodyError extends Error {
  constructor(readonly status: 400 | 413) { super("요청 본문을 처리할 수 없습니다."); }
}

async function body(request: Request): Promise<unknown> {
  const length = request.headers.get("content-length");
  if (length !== null && (!/^\d+$/u.test(length) || Number(length) > MAX_BODY_BYTES)) throw new BodyError(413);
  const reader = request.body?.getReader();
  if (!reader) throw new BodyError(400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  const onAbort = () => { void reader.cancel().catch(() => {}); };
  request.signal.addEventListener("abort", onAbort, { once: true });
  try {
    while (true) {
      request.signal.throwIfAborted();
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new BodyError(413); }
      chunks.push(chunk.value);
    }
  } finally {
    request.signal.removeEventListener("abort", onAbort);
    reader.releaseLock();
  }
  request.signal.throwIfAborted();
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new BodyError(400); }
}

function response(status: number, data: unknown, allow?: string) {
  return Response.json(data, { status, headers: {
    "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...(allow ? { Allow: allow } : {}),
  } });
}

function access(game: DialogueGameAccess | null, playerId: string, input: Command): number | null {
  const actor = game?.state.players.find((player) => player.id === playerId && player.human);
  if (!game || game.gameId !== input.gameId || !actor) return 404;
  if (!actor.alive) return 403;
  if (game.state.winner !== null || game.state.round !== input.expectedRound || game.state.phase !== input.expectedPhase) return 409;
  return null;
}

// 실제 인증과 영속 게임 조회를 구현한 호출자가 연결하며, 공개 라우트는 여기서 만들지 않습니다.
export function createDialogueRequestHandler(options: Options) {
  const { origin, fallback, authenticate, loadGame } = options;
  const url = new URL(origin);
  if (!["http:", "https:"].includes(url.protocol) || url.origin !== origin
    || !fallback.trim() || fallback.length > 280) throw new RangeError("대사 요청 처리 설정을 확인하세요.");

  return async function handle(request: Request): Promise<Response> {
    if (request.method !== "POST") return response(405, { error: "method-not-allowed" }, "POST");
    if (request.headers.get("origin") !== origin || new URL(request.url).origin !== origin) return response(403, { error: "forbidden" });
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      return response(415, { error: "unsupported-media-type" });
    }
    try {
      request.signal.throwIfAborted();
      const session = await authenticate(request);
      if (!session || !id(session.playerId)) return response(401, { error: "unauthorized" });
      const playerId = session.playerId;
      const input = command(await body(request));
      if (!input) return response(400, { error: "invalid-request" });
      const game = await loadGame(input.gameId);
      request.signal.throwIfAborted();
      const denied = access(game, playerId, input);
      if (denied !== null || !game) return response(denied ?? 404, { error: "unavailable" });
      const context = buildDialogueContext(game.state, game.messages, {
        gameId: input.gameId, speakerId: input.speakerId, kind: input.kind,
        ...(input.question ? { question: { actorId: playerId, text: input.question } } : {}),
      });
      if (!context) return response(400, { error: "invalid-request" });
      // 인증된 참가자별로 ID를 분리해 다른 사람의 같은 이름 요청과 충돌하지 않게 합니다.
      const requestId = createHash("sha256").update(JSON.stringify([input.gameId, playerId, input.requestId])).digest("hex");
      const result = await game.coordinator.request({ requestId, context, fallback });
      request.signal.throwIfAborted();
      // 대기 중 퇴장·탈락·단계 변경을 응답 직전에도 검사합니다.
      const [latestSession, latestGame] = await Promise.all([authenticate(request), loadGame(input.gameId)]);
      request.signal.throwIfAborted();
      if (latestSession?.playerId !== playerId) return response(401, { error: "unauthorized" });
      const latestDenied = access(latestGame, playerId, input);
      if (latestDenied !== null) return response(latestDenied, { error: "unavailable" });
      if (result.status === "discarded") {
        const status = result.reason === "capacity" ? 429 : result.reason === "disposed" ? 410
          : result.reason === "invalid-request" ? 400 : 409;
        return response(status, { error: "unavailable" });
      }
      // HTTP 재전송은 claim을 소비하지 않습니다. 단일 화면 반영은 후속 이벤트 저장·UI 책임입니다.
      return response(200, { requestId: input.requestId, text: result.text, source: result.source });
    } catch (error) {
      if (request.signal.aborted) return response(408, { error: "request-aborted" });
      if (error instanceof BodyError) return response(error.status, { error: "invalid-request" });
      return response(500, { error: "internal-error" });
    }
  };
}
