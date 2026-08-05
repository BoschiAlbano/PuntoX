import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { optimizeImageToWebp } from "@/lib/utils/imageOptimizer";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"] as const;
const MAX_FOTO_BYTES = 5 * 1024 * 1024; // 5 MB

/** Elimina la foto de Supabase Storage si la URL pertenece al bucket "empleados". */
async function deleteEmpleadoFotoFromStorage(fotoUrl: string | null) {
  if (!fotoUrl || !fotoUrl.includes("/empleados/")) return;
  try {
    const supabase = getSupabaseServiceClient();
    const path = fotoUrl.split("/empleados/")[1];
    if (path) await supabase.storage.from("empleados").remove([path]);
  } catch (e) {
    console.warn("No se pudo eliminar foto de empleado del storage:", e);
  }
}

/**
 * PATCH /api/perfil/foto
 * Permite al usuario autenticado actualizar su propia foto de perfil.
 * No requiere permiso especial; cualquier usuario autenticado puede cambiar su propia foto.
 * Recibe multipart/form-data con un campo "foto" (File).
 */
export async function PATCH(req: NextRequest) {
  try {
    // Solo requiere estar autenticado; sin permiso especial de CRUD
    const { tenantId, usuarioId } = await getAuthContext({ req });

    // Buscar el EmpleadoId del usuario actual
    const usuario = await prisma.usuario.findUnique({
      where: { Id: BigInt(usuarioId) },
      select: { EmpleadoId: true },
    });

    if (!usuario?.EmpleadoId) {
      return NextResponse.json(
        { error: "No se encontró el perfil de empleado para este usuario." },
        { status: 404 },
      );
    }

    const empleadoId = usuario.EmpleadoId;

    // Leer archivo del form-data
    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: "FormData inválido." }, { status: 400 });
    }

    const file = formData.get("foto");

    // Si se envía null/vacío explícitamente, eliminar la foto actual
    if (file === null || file === "") {
      const actual = await prisma.persona_Empleado.findUnique({
        where: { Id: empleadoId },
        select: { Foto: true },
      });
      await deleteEmpleadoFotoFromStorage(actual?.Foto ?? null);

      await prisma.persona_Empleado.update({
        where: { Id: empleadoId },
        data: { Foto: null },
      });

      return NextResponse.json({ foto: null });
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Se esperaba un archivo de imagen en el campo 'foto'." },
        { status: 400 },
      );
    }

    // Validar tipo
    const mime = file.type.toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.includes(mime as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      return NextResponse.json(
        { error: "Formato de imagen no válido. Use PNG, JPG o JPEG." },
        { status: 400 },
      );
    }

    // Leer y validar tamaño
    const rawBuffer = Buffer.from(await file.arrayBuffer());
    if (rawBuffer.length > MAX_FOTO_BYTES) {
      return NextResponse.json(
        { error: "La imagen no puede superar los 5 MB." },
        { status: 400 },
      );
    }

    const optimized = await optimizeImageToWebp(rawBuffer);

    // Eliminar foto anterior si existe
    const actual = await prisma.persona_Empleado.findUnique({
      where: { Id: empleadoId },
      select: { Foto: true },
    });
    await deleteEmpleadoFotoFromStorage(actual?.Foto ?? null);

    // Subir nueva foto a Supabase Storage
    const supabase = getSupabaseServiceClient();
    const fileName = `${tenantId}/emp-${empleadoId.toString()}-${Date.now()}.${optimized.extension}`;
    const { error: uploadError } = await supabase.storage
      .from("empleados")
      .upload(fileName, optimized.buffer, {
        contentType: optimized.contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error (PATCH perfil/foto):", uploadError);
      return NextResponse.json(
        { error: "No se pudo subir la imagen. Intente nuevamente." },
        { status: 500 },
      );
    }

    const { data: urlData } = supabase.storage
      .from("empleados")
      .getPublicUrl(fileName);
    const fotoUrl = urlData.publicUrl;

    // Guardar URL en la base de datos
    await prisma.persona_Empleado.update({
      where: { Id: empleadoId },
      data: { Foto: fotoUrl },
    });

    return NextResponse.json({ foto: fotoUrl });
  } catch (error) {
    return handleError(error);
  }
}
