-- 1. Restrict allowed_emails: users can only see their own email row
DROP POLICY IF EXISTS "Authenticated can read allowed_emails" ON public.allowed_emails;

CREATE POLICY "Users can read own allowed_email"
ON public.allowed_emails
FOR SELECT
TO authenticated
USING (lower(email) = lower((auth.jwt() ->> 'email')));

-- 2. Restrict Realtime channel access to allowed users only
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed users can receive realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (public.is_allowed_user());

CREATE POLICY "Allowed users can send realtime"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (public.is_allowed_user());