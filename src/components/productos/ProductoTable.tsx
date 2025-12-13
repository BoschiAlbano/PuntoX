import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Tooltip,
  Spinner,
} from "@heroui/react";
import { Producto } from "@/lib/validations/producto.schema";

interface ProductoTableProps {
  productos: Producto[];
  isLoading: boolean;
  isError: boolean;
  onEdit: (producto: Producto) => void;
  onDelete: (producto: Producto) => void;
  isDisabled: boolean;
}

export default function ProductoTable({
  productos,
  isLoading,
  isError,
  onEdit,
  onDelete,
  isDisabled,
}: ProductoTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <Table aria-label="Tabla de productos">
        <TableHeader>
          <TableColumn>CÓDIGO</TableColumn>
          <TableColumn>CÓDIGO BARRA</TableColumn>
          <TableColumn>DESCRIPCIÓN</TableColumn>
          <TableColumn>PRECIO COSTO</TableColumn>
          <TableColumn>% GANANCIA</TableColumn>
          <TableColumn>STOCK MÍNIMO</TableColumn>
          <TableColumn>ESTADO</TableColumn>
          <TableColumn>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={
            isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Spinner size="lg" />
              </div>
            ) : isError ? (
              <div className="text-danger flex justify-center py-4">
                Error al cargar datos
              </div>
            ) : (
              "No hay productos registrados"
            )
          }
        >
          {productos.map((producto) => (
            <TableRow key={producto.Id}>
              <TableCell>{producto.Codigo}</TableCell>
              <TableCell>{producto.CodigoBarra}</TableCell>
              <TableCell>
                <div>
                  <p className="font-semibold">{producto.Descripcion}</p>
                  {producto.Abreviatura && (
                    <p className="text-xs text-gray-500">
                      {producto.Abreviatura}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>${producto.Precio.PrecioCosto}</TableCell>
              <TableCell>{producto.Precio.PorcentajeGanancia}%</TableCell>
              <TableCell>{producto.StockMinimo}</TableCell>
              <TableCell>
                <Chip
                  color={producto.EstaEliminado ? "danger" : "success"}
                  variant="flat"
                  size="sm"
                >
                  {producto.EstaEliminado ? "Inactivo" : "Activo"}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Tooltip content="Editar">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onEdit(producto)}
                      isDisabled={isDisabled}
                    >
                      ✏️
                    </Button>
                  </Tooltip>
                  <Tooltip content="Eliminar" color="danger">
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      variant="light"
                      onPress={() => onDelete(producto)}
                      isDisabled={isDisabled}
                    >
                      🗑️
                    </Button>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
