-- Allowlist of authorized emails
CREATE TABLE public.allowed_emails (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.allowed_emails TO authenticated;
GRANT ALL ON public.allowed_emails TO service_role;

ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read allowed_emails"
ON public.allowed_emails FOR SELECT
TO authenticated
USING (true);

INSERT INTO public.allowed_emails (email) VALUES
  ('fernancho@gmail.com'),
  ('debuchita@gmail.com');

-- Security definer function to check current user is allowed
CREATE OR REPLACE FUNCTION public.is_allowed_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.allowed_emails
    WHERE lower(email) = lower((auth.jwt() ->> 'email'))
  )
$$;

-- Lock down meal_plan
DROP POLICY IF EXISTS "Public read meal_plan" ON public.meal_plan;
DROP POLICY IF EXISTS "Public insert meal_plan" ON public.meal_plan;
DROP POLICY IF EXISTS "Public update meal_plan" ON public.meal_plan;

CREATE POLICY "Allowed read meal_plan" ON public.meal_plan
FOR SELECT TO authenticated USING (public.is_allowed_user());
CREATE POLICY "Allowed insert meal_plan" ON public.meal_plan
FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user());
CREATE POLICY "Allowed update meal_plan" ON public.meal_plan
FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user());

REVOKE ALL ON public.meal_plan FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.meal_plan TO authenticated;

-- Lock down custom_meals
DROP POLICY IF EXISTS "Public read custom_meals" ON public.custom_meals;
DROP POLICY IF EXISTS "Public insert custom_meals" ON public.custom_meals;
DROP POLICY IF EXISTS "Public update custom_meals" ON public.custom_meals;
DROP POLICY IF EXISTS "Public delete custom_meals" ON public.custom_meals;

CREATE POLICY "Allowed read custom_meals" ON public.custom_meals
FOR SELECT TO authenticated USING (public.is_allowed_user());
CREATE POLICY "Allowed insert custom_meals" ON public.custom_meals
FOR INSERT TO authenticated WITH CHECK (public.is_allowed_user());
CREATE POLICY "Allowed update custom_meals" ON public.custom_meals
FOR UPDATE TO authenticated USING (public.is_allowed_user()) WITH CHECK (public.is_allowed_user());
CREATE POLICY "Allowed delete custom_meals" ON public.custom_meals
FOR DELETE TO authenticated USING (public.is_allowed_user());

REVOKE ALL ON public.custom_meals FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_meals TO authenticated;