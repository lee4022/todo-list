-- =====================================================
-- TODO List - Supabase DB 초기 설정
-- Supabase 대시보드 > SQL Editor에 붙여넣고 실행하세요.
-- =====================================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 테이블 생성 ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.groups (
  id         UUID        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  color      TEXT        NOT NULL DEFAULT '#aaa',
  is_default BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.todos (
  id           SERIAL  PRIMARY KEY,
  user_id      UUID    NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  text         TEXT    NOT NULL,
  description  TEXT    NOT NULL DEFAULT '',
  group_id     UUID,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TEXT,
  completed_at TEXT
);

-- ── Row Level Security 활성화 ───────────────────────

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos  ENABLE ROW LEVEL SECURITY;

-- groups 정책: 본인 데이터만 접근
CREATE POLICY "groups_select" ON public.groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "groups_insert" ON public.groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "groups_update" ON public.groups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "groups_delete" ON public.groups FOR DELETE USING (auth.uid() = user_id);

-- todos 정책: 본인 데이터만 접근
CREATE POLICY "todos_select" ON public.todos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "todos_insert" ON public.todos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "todos_update" ON public.todos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "todos_delete" ON public.todos FOR DELETE USING (auth.uid() = user_id);

-- ── 회원가입 시 기본 그룹 자동 생성 ──────────────────
-- 새 유저가 가입하면 '기타' 그룹을 자동으로 만들어줍니다.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.groups (user_id, name, color, is_default)
  VALUES (NEW.id, '기타', '#aaa', TRUE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Realtime 활성화 ─────────────────────────────────
-- 아래 두 줄로 실시간 동기화를 켭니다.
-- 또는 Supabase Dashboard > Database > Replication에서 테이블을 직접 추가해도 됩니다.

ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;
