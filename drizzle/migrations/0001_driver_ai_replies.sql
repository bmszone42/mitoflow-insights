CREATE TABLE public.driver_ai_replies (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pair_key text NOT NULL,
  reply text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, pair_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_ai_replies TO authenticated;
GRANT ALL ON public.driver_ai_replies TO service_role;
ALTER TABLE public.driver_ai_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own replies select" ON public.driver_ai_replies FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own replies insert" ON public.driver_ai_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own replies update" ON public.driver_ai_replies FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own replies delete" ON public.driver_ai_replies FOR DELETE TO authenticated USING (auth.uid() = user_id);