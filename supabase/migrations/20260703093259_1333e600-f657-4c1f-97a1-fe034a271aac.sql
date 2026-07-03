CREATE TABLE public.pantry (
  env text NOT NULL PRIMARY KEY,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pantry TO authenticated;
GRANT ALL ON public.pantry TO service_role;

ALTER TABLE public.pantry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed read pantry" ON public.pantry
  FOR SELECT TO authenticated USING (public.is_allowed_user());
CREATE POLICY "Allowed insert pantry" ON public.pantry
  FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user());
CREATE POLICY "Allowed update pantry" ON public.pantry
  FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user());

CREATE TRIGGER update_pantry_timestamp
  BEFORE UPDATE ON public.pantry
  FOR EACH ROW EXECUTE FUNCTION public.update_meal_plan_timestamp();