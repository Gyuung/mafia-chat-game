import type { ParticipantSession, ParticipantSessionStore } from "./participant-session";

// 커밋된 기본 DB에 매번 질의해야 하며, 읽기 복제본·장기 트랜잭션·캐시를 연결하지 않습니다.
export type SessionQuery = (sql: string, values: (string | number)[]) => Promise<{ rows: Record<string, unknown>[] }>;

const TABLE = "public.mafia_participant_sessions";
const HASH = /^[a-f0-9]{64}$/u;

function validHash(value: string) {
  if (!HASH.test(value)) throw new RangeError("세션 해시를 확인하세요.");
}

function validSession(session: ParticipantSession) {
  return typeof session.playerId === "string" && session.playerId.length > 0 && session.playerId.length <= 128
    && session.playerId.trim() === session.playerId && !/[\u0000-\u001f\u007f]/u.test(session.playerId)
    && Number.isSafeInteger(session.issuedAt) && session.issuedAt >= 0
    && Number.isSafeInteger(session.expiresAt) && session.expiresAt > session.issuedAt
    && session.expiresAt - session.issuedAt <= 86400000;
}

// bigint를 문자열로 반환하는 드라이버도 정밀도 손실 없이 처리합니다.
function milliseconds(value: unknown): number {
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  if (typeof value === "string" && /^(0|[1-9][0-9]*)$/u.test(value)) {
    const number = Number(value);
    if (Number.isSafeInteger(number)) return number;
  }
  throw new Error("세션 저장소 응답을 확인하세요.");
}

export function createPostgresSessionStore(query: SessionQuery): ParticipantSessionStore {
  return {
    async insert(tokenHash, session) {
      validHash(tokenHash);
      if (!validSession(session)) throw new RangeError("세션 저장 값을 확인하세요.");
      // 중복 키는 DB에서 거절하며 기존 세션을 덮어쓰지 않습니다.
      await query(`INSERT INTO ${TABLE} (token_hash, player_id, issued_at_ms, expires_at_ms) VALUES ($1, $2, $3, $4)`,
        [tokenHash, session.playerId, session.issuedAt, session.expiresAt]);
    },
    async find(tokenHash) {
      validHash(tokenHash);
      const { rows } = await query(`SELECT player_id, issued_at_ms, expires_at_ms FROM ${TABLE} WHERE token_hash = $1`, [tokenHash]);
      if (rows.length === 0) return null;
      if (rows.length !== 1) throw new Error("세션 저장소 응답을 확인하세요.");
      const row = rows[0];
      const session = {
        playerId: row.player_id as string,
        issuedAt: milliseconds(row.issued_at_ms),
        expiresAt: milliseconds(row.expires_at_ms),
      };
      if (!validSession(session)) throw new Error("세션 저장소 응답을 확인하세요.");
      return Object.freeze(session);
    },
    async delete(tokenHash) {
      validHash(tokenHash);
      await query(`DELETE FROM ${TABLE} WHERE token_hash = $1`, [tokenHash]);
    },
  };
}
