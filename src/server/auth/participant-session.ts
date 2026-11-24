import { createHash, randomBytes } from "node:crypto";

export type ParticipantSession = Readonly<{
  playerId: string;
  issuedAt: number;
  expiresAt: number;
}>;

// insert는 해시 고유 제약으로 기존 세션 덮어쓰기를 거절해야 합니다.
export type ParticipantSessionStore = {
  insert(tokenHash: string, session: ParticipantSession): Promise<void>;
  find(tokenHash: string): Promise<ParticipantSession | null>;
  delete(tokenHash: string): Promise<void>;
};

type Options = {
  origin: string;
  store: ParticipantSessionStore;
  ttlSeconds?: number;
  now?: () => number;
};

const MAX_TTL_SECONDS = 86400;
const TOKEN = /^[A-Za-z0-9_-]{43}$/u;

function validPlayerId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 128
    && value.trim() === value && !/[\u0000-\u001f\u007f]/u.test(value);
}

function hash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createParticipantSessions(options: Options) {
  const { origin, store, ttlSeconds = 7200, now = Date.now } = options;
  const url = new URL(origin);
  const secure = url.protocol === "https:";
  if (url.origin !== origin || (!secure && !(url.protocol === "http:" && url.hostname === "localhost"))
    || !Number.isSafeInteger(ttlSeconds) || ttlSeconds < 1 || ttlSeconds > MAX_TTL_SECONDS) {
    throw new RangeError("참가자 세션 설정을 확인하세요.");
  }
  const cookieName = secure ? "__Host-mafia-session" : "mafia-local-session";
  const attributes = `Path=/; HttpOnly; SameSite=Strict${secure ? "; Secure" : ""}`;

  function clock() {
    const value = now();
    if (!Number.isSafeInteger(value) || value < 0 || !Number.isSafeInteger(value + ttlSeconds * 1000)) {
      throw new RangeError("세션 시간을 확인하세요.");
    }
    return value;
  }

  function readToken(request: Request): string | null {
    if (new URL(request.url).origin !== origin) return null;
    const cookie = request.headers.get("cookie");
    if (!cookie || cookie.length > 8192) return null;
    const values = cookie.split(";").map((part) => part.trim()).filter((part) => part.split("=", 1)[0] === cookieName);
    if (values.length !== 1) return null;
    const token = values[0].slice(cookieName.length + 1);
    if (!values[0].startsWith(`${cookieName}=`) || !TOKEN.test(token)
      || Buffer.from(token, "base64url").toString("base64url") !== token) return null;
    return token;
  }

  return {
    cookieName,
    // 클라이언트 입력이 아니라 입장 처리에서 확정한 참가자 ID를 전달합니다.
    async issue(playerId: string): Promise<string> {
      if (!validPlayerId(playerId)) throw new RangeError("참가자 ID를 확인하세요.");
      const issuedAt = clock();
      const token = randomBytes(32).toString("base64url");
      await store.insert(hash(token), Object.freeze({ playerId, issuedAt, expiresAt: issuedAt + ttlSeconds * 1000 }));
      return `${cookieName}=${token}; ${attributes}; Max-Age=${ttlSeconds}`;
    },
    async authenticate(request: Request): Promise<{ playerId: string } | null> {
      const token = readToken(request);
      if (!token) return null;
      const session = await store.find(hash(token));
      const time = clock();
      if (!session || !validPlayerId(session.playerId) || !Number.isSafeInteger(session.issuedAt)
        || !Number.isSafeInteger(session.expiresAt) || session.issuedAt < 0 || session.issuedAt > time
        || session.expiresAt <= time || session.expiresAt <= session.issuedAt
        || session.expiresAt - session.issuedAt > ttlSeconds * 1000) return null;
      return { playerId: session.playerId };
    },
    async revoke(request: Request): Promise<string> {
      const token = readToken(request);
      if (token) await store.delete(hash(token));
      return `${cookieName}=; ${attributes}; Max-Age=0`;
    },
  };
}
