import type { createParticipantSessions } from "./participant-session";

type Options = {
  origin: string;
  sessions: Pick<ReturnType<typeof createParticipantSessions>, "revoke">;
};

// 영속 세션 저장소를 연결한 서버 라우트에서 사용합니다.
export function createLogoutHandler({ origin, sessions }: Options) {
  const url = new URL(origin);
  if (url.origin !== origin || !(url.protocol === "https:"
    || (url.protocol === "http:" && url.hostname === "localhost"))) {
    throw new RangeError("로그아웃 출처를 확인하세요.");
  }
  return async function logout(request: Request): Promise<Response> {
    const headers = new Headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    if (request.method !== "POST") {
      headers.set("Allow", "POST");
      return Response.json({ error: "method-not-allowed" }, { status: 405, headers });
    }
    if (new URL(request.url).origin !== origin || request.headers.get("origin") !== origin) {
      return Response.json({ error: "forbidden" }, { status: 403, headers });
    }
    try {
      // 삭제 완료 후에만 쿠키를 지웁니다. 연결 취소와 무관하게 시작한 폐기는 완료합니다.
      const cookie = await sessions.revoke(request);
      headers.set("Set-Cookie", cookie);
      return new Response(null, { status: 204, headers });
    } catch {
      return Response.json({ error: "internal-error" }, { status: 500, headers });
    }
  };
}
