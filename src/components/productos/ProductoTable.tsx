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
  onNew: () => void;
  isDisabled: boolean;
}

export default function ProductoTable({
  productos,
  isLoading,
  isError,
  onEdit,
  onDelete,
  onNew,
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
                  <Tooltip content="Editar" color="warning">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="warning"
                      onPress={() => onEdit(producto)}
                      isDisabled={isDisabled}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="size-5 text-gray-500"
                      >
                        <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                      </svg>
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
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="size-5 text-gray-500"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Button>
                  </Tooltip>
                  <Tooltip content="Nuevo" color="primary">
                    <Button
                      isIconOnly
                      size="sm"
                      color="primary"
                      variant="light"
                      isDisabled={isDisabled}
                      onPress={onNew}
                      className="rounded-full font-extrabold text-2xl"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="size-5 text-gray-500"
                      >
                        <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                      </svg>
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
