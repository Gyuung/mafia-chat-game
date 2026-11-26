-- 배포 마이그레이션에서 한 번 적용합니다. 요청 처리 중 자동 실행하지 않습니다.
BEGIN;

CREATE TABLE public.mafia_participant_sessions (
  token_hash text PRIMARY KEY CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  player_id text NOT NULL CHECK (char_length(player_id) BETWEEN 1 AND 128),
  issued_at_ms bigint NOT NULL CHECK (issued_at_ms BETWEEN 0 AND 9007199254740991),
  expires_at_ms bigint NOT NULL CHECK (expires_at_ms BETWEEN 0 AND 9007199254740991),
  CHECK (expires_at_ms > issued_at_ms AND expires_at_ms - issued_at_ms <= 86400000)
);

-- 만료 데이터 정리용입니다. 인증 시 만료 검사는 세션 모듈에서도 수행합니다.
CREATE INDEX mafia_participant_sessions_expiry_idx
  ON public.mafia_participant_sessions (expires_at_ms);

COMMIT;
