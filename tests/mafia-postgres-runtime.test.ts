import assert from "node:assert/strict";
import test from "node:test";
import type { PoolConfig } from "pg";
import { createPostgresSessionRuntime } from "../src/server/auth/postgres-runtime";

const databaseUrl = "postgresql://user:p%40ss@db.example/mafia?sslmode=require";
const hash = "a".repeat(64);
function fixture() {
  let config!: PoolConfig;
  let listener!: () => void;
  let ended = 0;
  const calls: { sql: string; values: (string | number)[] }[] = [];
  const runtime = createPostgresSessionRuntime({ databaseUrl, createPool(value) {
    config = value;
    return {
      async query(sql, values) { calls.push({ sql, values }); return { rows: [] }; },
      async end() { ended++; },
      on(event, callback) { assert.equal(event, "error"); listener = callback; },
    };
  } });
  return { runtime, config, calls, idleError: () => listener(), ended: () => ended };
}

test("TLS 검증·연결/질의 시간 제한·작은 풀을 설정하고 생성 시 질의하지 않음", async () => {
  const f = fixture();
  assert.equal(f.config.host, "db.example");
  assert.equal(f.config.user, "user");
  assert.equal(f.config.password, "p@ss");
  assert.equal(f.config.database, "mafia");
  assert.deepEqual(f.config.ssl, { rejectUnauthorized: true });
  assert.equal(f.config.connectionString, undefined);
  assert.equal(f.config.max, 3);
  assert.equal(f.config.connectionTimeoutMillis, 3000);
  assert.equal(f.config.statement_timeout, 3000);
  assert.equal(f.config.query_timeout, 4000);
  assert.equal(f.calls.length, 0);
  await f.runtime.store.find(hash);
  assert.deepEqual(f.calls[0].values, [hash]);
  assert.doesNotThrow(f.idleError);
  await f.runtime.close();
});

test("연결 종료는 한 번만 실행하고 종료 이후 질의 거절", async () => {
  const f = fixture();
  const first = f.runtime.close();
  assert.equal(f.runtime.close(), first);
  await first;
  assert.equal(f.ended(), 1);
  await assert.rejects(f.runtime.store.find(hash), /종료/u);
  assert.equal(f.calls.length, 0);
});

test("연결 설정 오류에 접속 비밀값을 포함하지 않고 풀 생성 전 거절", () => {
  let created = 0;
  for (const value of ["", "SECRET", "https://user:SECRET@db.example/mafia", "postgres://db.example/mafia",
    "postgres://user:SECRET@db.example", `${databaseUrl}&sslmode=disable`,
    "postgres://user:SECRET@db.example/mafia?sslmode=disable", `${databaseUrl}&sslcert=SECRET`,
    "postgres://user:SECRET@db.example/mafia?sslmode=no-verify", `${databaseUrl}#SECRET`]) {
    assert.throws(() => createPostgresSessionRuntime({ databaseUrl: value, createPool() {
      created++; throw new Error("created");
    } }), (error: unknown) => error instanceof RangeError && !error.message.includes("SECRET"));
  }
  assert.equal(created, 0);
});

test("로컬 평문 연결은 명시적 허용과 disable 설정이 모두 필요", async () => {
  const localUrl = "postgres://user:pass@localhost/mafia?sslmode=disable";
  assert.throws(() => createPostgresSessionRuntime({ databaseUrl: localUrl }));
  let config!: PoolConfig;
  const runtime = createPostgresSessionRuntime({ databaseUrl: localUrl, allowInsecureLocal: true, createPool(value) {
    config = value;
    return { async query() { return { rows: [] }; }, async end() {}, on() {} };
  } });
  assert.equal(config.ssl, false);
  await runtime.close();
  assert.throws(() => createPostgresSessionRuntime({ databaseUrl, maxConnections: 0 }));
  assert.throws(() => createPostgresSessionRuntime({ databaseUrl, maxConnections: 21 }));
});

test("드라이버 오류·종료 실패는 접속 정보 없는 일반 오류로 전달", async () => {
  const runtime = createPostgresSessionRuntime({ databaseUrl, createPool() {
    return {
      async query() { throw new Error("SECRET CONNECTION STRING"); },
      async end() { throw new Error("SECRET CONNECTION STRING"); },
      on() {},
    };
  } });
  await assert.rejects(runtime.store.find(hash), (error: unknown) => error instanceof Error && !error.message.includes("SECRET"));
  await assert.rejects(runtime.close(), (error: unknown) => error instanceof Error && !error.message.includes("SECRET"));
});

test("기본 pg 풀도 연결 없이 생성·종료할 수 있음", async () => {
  const runtime = createPostgresSessionRuntime({ databaseUrl });
  await runtime.close();
});
