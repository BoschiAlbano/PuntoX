import prisma from "@/DB/prisma";
import readline from "readline";

const askQuestion = (query: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    }),
  );
};

const deleteClientSales = async () => {
  const inputId = process.argv[2];
  let clientIdStr = inputId;

  if (!clientIdStr) {
    console.log("No se proporcionó ID de cliente como argumento.");
    clientIdStr = await askQuestion("Ingrese el ID del cliente: ");
  }

  if (!clientIdStr) {
    console.error("ID es requerido.");
    return;
  }

  // Handle non-numeric input gracefully
  if (isNaN(Number(clientIdStr))) {
    console.error("El ID debe ser numérico.");
    return;
  }

  const clientId = BigInt(clientIdStr);

  try {
    // 1. Verify client exists
    const client = await prisma.persona_Cliente.findUnique({
      where: { Id: clientId },
      include: { Persona: true },
    });

    if (!client) {
      console.error(`Cliente con ID ${clientId} no encontrado.`);
      return;
    }

    console.log(
      `Cliente encontrado: ${client.Persona.Nombre} ${client.Persona.Apellido} (ID: ${clientIdStr})`,
    );

    // 2. Find all sales (Comprobante_Factura)
    // We strictly focus on Facturas as "Ventas", but technically Presupuestos and Remitos are also related to Client sales flow.
    // I will check Facturas, Presupuestos, and Remitos.
    const facturas = await prisma.comprobante_Factura.findMany({
      where: { ClienteId: clientId },
      select: { Id: true },
    });

    const presupuestos = await prisma.comprobante_Presupuesto.findMany({
      where: { ClienteId: clientId },
      select: { Id: true },
    });

    const remitos = await prisma.comprobante_Remito.findMany({
      where: { ClienteId: clientId },
      select: { Id: true },
    });

    // Combine IDs
    const comprobanteIds = [
      ...facturas.map((f) => f.Id),
      ...presupuestos.map((p) => p.Id),
      ...remitos.map((r) => r.Id),
    ];

    if (comprobanteIds.length === 0) {
      console.log(
        "No se encontraron ventas (Facturas, Presupuestos o Remitos) para este cliente.",
      );
      return;
    }

    console.log(
      `Se encontraron ${comprobanteIds.length} comprobantes para eliminar.`,
    );
    console.log(`- Facturas: ${facturas.length}`);
    console.log(`- Presupuestos: ${presupuestos.length}`);
    console.log(`- Remitos: ${remitos.length}`);

    const confirm = await askQuestion(
      "¿Está seguro de eliminar TODOS estos registros y sus tablas relacionadas? Esta acción es IRREVERSIBLE. (S/N): ",
    );
    if (confirm.trim().toUpperCase() !== "S") {
      console.log("Operación cancelada.");
      return;
    }

    // 3. Delete dependencies
    console.log("Iniciando eliminación...");

    // DetalleComprobante
    // Handles details for all found comprobantes
    const deletedDetalles = await prisma.detalleComprobante.deleteMany({
      where: { ComprobanteId: { in: comprobanteIds } },
    });
    console.log(
      `Eliminados ${deletedDetalles.count} detalles de comprobantes.`,
    );

    // FormaPago related
    // First identify the payment forms
    const formasPago = await prisma.formaPago.findMany({
      where: { ComprobanteId: { in: comprobanteIds } },
      select: { Id: true },
    });
    const formaPagoIds = formasPago.map((fp) => fp.Id);

    if (formaPagoIds.length > 0) {
      // Child tables of FormaPago
      await prisma.formaPago_Cheque.deleteMany({
        where: { Id: { in: formaPagoIds } },
      });
      await prisma.formaPago_CtaCte.deleteMany({
        where: { Id: { in: formaPagoIds } },
      });
      await prisma.formaPago_Tarjeta.deleteMany({
        where: { Id: { in: formaPagoIds } },
      });

      // The FormaPago itself
      const deletedPagos = await prisma.formaPago.deleteMany({
        where: { Id: { in: formaPagoIds } },
      });
      console.log(
        `Eliminados ${deletedPagos.count} registros de formas de pago.`,
      );
    }

    // Movimiento related
    // Sales often generate movements (cash entry, etc.)
    const movimientos = await prisma.movimiento.findMany({
      where: { ComprobanteId: { in: comprobanteIds } },
      select: { Id: true },
    });
    const movimientoIds = movimientos.map((m) => m.Id);

    if (movimientoIds.length > 0) {
      // Child tables of Movimiento
      await prisma.movimiento_CuentaCorriente.deleteMany({
        where: { Id: { in: movimientoIds } },
      });
      await prisma.movimiento_CuentaCorrienteProveedor.deleteMany({
        where: { Id: { in: movimientoIds } },
      });

      // The Movimiento itself
      const deletedMovs = await prisma.movimiento.deleteMany({
        where: { Id: { in: movimientoIds } },
      });
      console.log(`Eliminados ${deletedMovs.count} movimientos de caja.`);
    }

    // Links to other comprobantes (e.g. Nota Credito linking to this Invoice)
    const deletedNCLinks = await prisma.comprobante_NotaCredito.deleteMany({
      where: { ComprobanteId: { in: comprobanteIds } },
    });
    if (deletedNCLinks.count > 0) {
      console.log(
        `Eliminados ${deletedNCLinks.count} enlaces a Notas de Crédito (La nota de crédito en sí no se borra, solo la referencia).`,
      );
    }

    // Also check if any of the Comprobantes we are deleting ARE Notas de Credito referencing others?
    // We selected Facturas, Presupuestos, Remitos. Does one of these reference another?
    // Unlikely for these types to be the SOURCE of a Nota Credito relation, usually they are the TARGET.
    // However, checking the other direction:
    const deletedReverseNCLinks =
      await prisma.comprobante_NotaCredito.deleteMany({
        where: { Id: { in: comprobanteIds } },
      });
    if (deletedReverseNCLinks.count > 0) {
      console.log(
        `Eliminados ${deletedReverseNCLinks.count} referencias donde el comprobante era Nota de Crédito.`,
      );
    }

    // Extension tables
    await prisma.comprobante_Factura.deleteMany({
      where: { Id: { in: comprobanteIds } },
    });
    await prisma.comprobante_Presupuesto.deleteMany({
      where: { Id: { in: comprobanteIds } },
    });
    await prisma.comprobante_Remito.deleteMany({
      where: { Id: { in: comprobanteIds } },
    });

    // Finally Comprobante (The Parent)
    const deletedComprobantes = await prisma.comprobante.deleteMany({
      where: { Id: { in: comprobanteIds } },
    });
    console.log(`Total: Eliminados ${deletedComprobantes.count} comprobantes.`);

    console.log("Proceso finalizado correctamente.");
  } catch (error) {
    console.error("Error eliminando ventas:", error);
  } finally {
    await prisma.$disconnect();
  }
};

deleteClientSales();

//npx tsx scripts/Delete_Comprobantes_Clliente.ts 3 (cambiar id del cliente)
