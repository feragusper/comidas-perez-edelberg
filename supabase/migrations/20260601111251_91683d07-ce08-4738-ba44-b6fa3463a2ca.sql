REVOKE EXECUTE ON FUNCTION public.is_allowed_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_allowed_user() TO authenticated, service_role;