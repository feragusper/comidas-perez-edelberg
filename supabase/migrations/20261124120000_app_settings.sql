-- ============================================================
-- App settings: configurable planning rules (and future settings).
-- One row per environment ('stage' / 'prod'), same scheme as pantry.env.
-- ============================================================

CREATE TABLE public.app_settings (
  env text NOT NULL PRIMARY KEY,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed read app_settings" ON public.app_settings
  FOR SELECT TO authenticated USING (public.is_allowed_user());
CREATE POLICY "Allowed insert app_settings" ON public.app_settings
  FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user());
CREATE POLICY "Allowed update app_settings" ON public.app_settings
  FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user());

CREATE TRIGGER update_app_settings_timestamp
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_meal_plan_timestamp();

ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
