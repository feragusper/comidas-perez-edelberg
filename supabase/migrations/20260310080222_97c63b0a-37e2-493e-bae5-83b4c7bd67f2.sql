
CREATE TABLE public.custom_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id text NOT NULL UNIQUE,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🍽️',
  category text NOT NULL DEFAULT 'Otro',
  baby_safety text NOT NULL DEFAULT 'caution',
  baby_note text,
  is_keto boolean NOT NULL DEFAULT false,
  is_side boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read custom_meals"
  ON public.custom_meals FOR SELECT
  TO public USING (true);

CREATE POLICY "Public insert custom_meals"
  ON public.custom_meals FOR INSERT
  TO public WITH CHECK (true);

CREATE POLICY "Public update custom_meals"
  ON public.custom_meals FOR UPDATE
  TO public USING (true) WITH CHECK (true);
