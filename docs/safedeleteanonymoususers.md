1. Dry run - ver cuántos se borrarían:


SELECT COUNT(*) AS total_to_delete
FROM auth.users
WHERE is_anonymous = true
  AND COALESCE(last_sign_in_at, created_at) < NOW() - INTERVAL '1 day';
2. Si quieres ver quiénes son antes de borrar:


SELECT id, created_at, last_sign_in_at, email
FROM auth.users
WHERE is_anonymous = true
  AND COALESCE(last_sign_in_at, created_at) < NOW() - INTERVAL '1 day';
3. Ejecutar la limpieza (borrar todo):


-- Borrar datos de app
DELETE FROM public.user_state
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE is_anonymous = true
    AND COALESCE(last_sign_in_at, created_at) < NOW() - INTERVAL '1 day'
);

DELETE FROM public.push_tokens
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE is_anonymous = true
    AND COALESCE(last_sign_in_at, created_at) < NOW() - INTERVAL '1 day'
);

-- Borrar los usuarios anónimos
DELETE FROM auth.users
WHERE is_anonymous = true
  AND COALESCE(last_sign_in_at, created_at) < NOW() - INTERVAL '1 day';