import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utilities/auth/authOptions";

// GET /api/marcas - Listar todas las marcas activas
export async function GET(req: NextRequest, res: NextResponse) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const marcas = await prisma.marca.findMany({
      where: {
        EstaEliminado: false,
        TenantId: Number(session.user.tenantId),
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
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const marca = await prisma.marca.create({
      data: body,
    });

    return NextResponse.json(
      {
        ...marca,
        Id: Number(marca.Id),
        TenantId: Number(session.user.tenantId),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al crear marca:", error);
    return NextResponse.json(null, { status: 500 });
  }
}

export async function DELETE(req: Request, res: Response) {
  console.log("ENTRA");

  return NextResponse.json(null, { status: 500 });

  // const session = await getServerSession(authOptions);
  // console.log(session);
  // if (!session) {
  //   return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  // }

  // try {
  //   const { id } = req.query;

  //   console.log(id);

  //   await prisma.marca.delete({
  //     where: {
  //       Id: Number(id),
  //       TenantId: Number(session.user.tenantId),
  //     },
  //   });
  //   return NextResponse.json(null, { status: 200 });
  // } catch (error) {
  //   console.error("Error al eliminar marca:", error);
  //   return NextResponse.json(null, { status: 500 });
  // }
}
