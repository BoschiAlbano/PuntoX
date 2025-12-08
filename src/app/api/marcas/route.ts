import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

export async function GET(_req: NextRequest) {
  // Obtener la session del usuario
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log(user);

  const tenantId = user?.user_metadata?.tenantId;

  console.log(tenantId);

  if (!tenantId) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  try {
    const marcas = await prisma.marca.findMany({
      where: {
        TenantId: Number(tenantId),
        EstaEliminado: false,
      },
      select: {
        Id: true,
        Descripcion: true,
      },
      orderBy: {
        Descripcion: "asc",
      },
    });

    return NextResponse.json(
      { marcas: marcas.map((marca) => ({ ...marca, Id: Number(marca.Id) })) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al obtener marcas:", error);
    return NextResponse.json(
      { error: "Error al obtener marcas" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log(user);

  const tenantId = user?.user_metadata?.tenantId;

  console.log(tenantId);

  if (!tenantId) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const tenantIdNumber = Number(tenantId);
    const marca = await prisma.marca.create({
      data: {
        ...body,
        TenantId: tenantIdNumber,
      },
    });

    return NextResponse.json(
      {
        ...marca,
        Id: Number(marca.Id),
        TenantId: tenantIdNumber,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al crear marca:", error);
    return NextResponse.json(null, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tenantId = user?.user_metadata?.tenantId;

  if (!tenantId) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  const idParam =
    req.nextUrl.searchParams.get("Id") ?? req.nextUrl.searchParams.get("id");
  const marcaId = idParam ? Number(idParam) : NaN;

  if (!Number.isInteger(marcaId)) {
    return NextResponse.json(
      { error: "Id de marca invalido" },
      { status: 400 }
    );
  }

  try {
    const marcaActualizada = await prisma.marca.delete({
      where: {
        Id: marcaId,
        TenantId: Number(tenantId),
      },
      // data: {
      //   EstaEliminado: true,
      // },
      select: {
        Id: true,
      },
    });

    return NextResponse.json(
      { success: true, Id: Number(marcaActualizada.Id) },
      { status: 200 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("record to update")
    ) {
      return NextResponse.json(
        { error: "Marca no encontrada" },
        { status: 404 }
      );
    }

    console.error("Error al eliminar marca:", error);
    return NextResponse.json(
      { error: "Error al eliminar marca" },
      { status: 500 }
    );
  }
}
