-- Elimina la columna Password ya que la autenticación se maneja en Supabase Auth
ALTER TABLE "Usuario" DROP COLUMN IF EXISTS "Password";
