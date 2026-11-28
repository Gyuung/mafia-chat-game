import { Pool, type PoolConfig } from "pg";
import { createPostgresSessionStore, type SessionQuery } from "./postgres-session-store";

type SessionPool = {
  query: SessionQuery;
  end(): Promise<void>;
  on(event: "error", listener: () => void): unknown;
};

type Options = {
  databaseUrl: string;
  allowInsecureLocal?: boolean;
  maxConnections?: number;
  createPool?: (config: PoolConfig) => SessionPool;
};

// 환경 변수는 호출자가 서버에서 명시적으로 읽어 전달하며, 가져오기만으로 연결하지 않습니다.
export function createPostgresSessionRuntime({
  databaseUrl, allowInsecureLocal = false, maxConnections = 3,
  createPool = (config) => new Pool(config),
}: Options) {
  let url: URL;
  try { url = new URL(databaseUrl); }
  catch { throw new RangeError("세션 DB 설정을 확인하세요."); }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const mode = url.searchParams.get("sslmode");
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || !url.username
    || url.pathname.length <= 1 || url.hash
    || [...url.searchParams.keys()].some((key) => key !== "sslmode")
    || url.searchParams.getAll("sslmode").length > 1
    || (mode !== null && !["require", "verify-full", "disable"].includes(mode))
    || (mode === "disable" && !(local && allowInsecureLocal))
    || !Number.isSafeInteger(maxConnections) || maxConnections < 1 || maxConnections > 20) {
    throw new RangeError("세션 DB 설정을 확인하세요.");
  }
  // URL의 SSL 매개변수가 인증서 검증 설정을 덮어쓰지 않도록 필드를 분리합니다.
  let user: string, password: string, database: string;
  try {
    user = decodeURIComponent(url.username);
    password = decodeURIComponent(url.password);
    database = decodeURIComponent(url.pathname.slice(1));
  } catch { throw new RangeError("세션 DB 설정을 확인하세요."); }
  const config: PoolConfig = {
    host: url.hostname === "[::1]" ? "::1" : url.hostname,
    port: url.port ? Number(url.port) : 5432,
    user, password, database,
    ssl: local && allowInsecureLocal && mode === "disable" ? false : { rejectUnauthorized: true },
    max: maxConnections, connectionTimeoutMillis: 3000, idleTimeoutMillis: 10000,
    statement_timeout: 3000, query_timeout: 4000, application_name: "mafia-participant-sessions",
  };
  const pool = createPool(config);
  // 유휴 연결 오류로 프로세스가 종료되지 않게 하고, 이후 질의에서 성공 여부를 판단합니다.
  pool.on("error", () => {});
  let closing: Promise<void> | undefined;
  const query: SessionQuery = async (sql, values) => {
    if (closing) throw new Error("세션 DB 연결이 종료되었습니다.");
    try { return await pool.query(sql, values); }
    catch { throw new Error("세션 DB 요청을 완료할 수 없습니다."); }
  };
  return {
    store: createPostgresSessionStore(query),
    close(): Promise<void> {
      if (!closing) closing = pool.end().catch(() => { throw new Error("세션 DB 연결을 종료할 수 없습니다."); });
      return closing;
    },
  };
}
