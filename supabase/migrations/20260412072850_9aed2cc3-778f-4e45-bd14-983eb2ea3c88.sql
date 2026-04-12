CREATE POLICY "Public delete custom_meals"
ON public.custom_meals
FOR DELETE
TO public
USING (true);