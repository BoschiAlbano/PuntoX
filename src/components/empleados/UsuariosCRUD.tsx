"use client";

import { useState } from "react";
import GenericCrud from "@/components/shared/GenericCrud";
import { Chip, Button, Tooltip, addToast } from "@heroui/react";
import { exportToCsv, exportToXls } from "@/lib/utils/exportCsv";
import { EditButton, DeleteButton } from "../shared/TableActions";
import UsuarioForm from "./UsuarioForm";
import ChangePasswordModal from "./ChangePasswordModal";
import { PerfilTipo } from "../../../prisma/generated/prisma";
import { useUserStore } from "@/store/useUserStore";
import { TIPO_PERFIL } from "@/lib/constants/comprobantes";

/** Sucursal tal como viene de la API de empleados (incluye EsDefault de UsuarioSucursal) */
export type SucursalUsuario = {
  Id: number;
  Nombre: string;
  EsDefault?: boolean;
};

export type Usuario = {
  Id: number;
  id: number;
  personaId: number;
  usuarioId: number | null;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  email: string;
  username: string | null;
  telefono: string | null;
  direccion: string | null;
  localidadId: number | null;
  localidad: string | null;
  departamentoId?: number | null;
  provinciaId?: number | null;
  rolId: number | null;
  rolNombre: string | null;
  rolTipo?: PerfilTipo;
  sucursales?: SucursalUsuario[];
  estado: "Activo" | "Invitado" | "Suspendido";
  legajo: string | null;
  dni: string | null;
  ultimaActividad: string | null;
};

export default function UsuariosCRUD() {
  const { user, roles } = useUserStore();
  const [passwordModalUser, setPasswordModalUser] = useState<Usuario | null>(
    null,
  );

  // Transformer para adaptar la respuesta de la API
  const transformer = (data: any): Usuario[] => {
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      ...item,
      Id: item.id, // Mapear id a Id para GenericCrud
    }));
  };

  return (
    <>
      <GenericCrud<Usuario>
        apiPath="/api/empleados"
        queryKey="usuarios-crud"
        searchPlaceholder="Buscar por nombre, usuario o DNI..."
        transformer={transformer}
        additionalInvalidateQueryKeys={["roles-select"]}
        enableBulkActions
        exportConfig={{
          filename: "usuarios",
          columns: [
            { key: "nombreCompleto", header: "Nombre completo" },
            { key: "email", header: "Email" },
            { key: "username", header: "Usuario" },
            { key: "telefono", header: "Teléfono" },
            { key: "rolNombre", header: "Rol" },
            { key: "estado", header: "Estado" },
            { key: "legajo", header: "Legajo" },
            { key: "dni", header: "DNI" },
            { key: "ultimaActividad", header: "Última actividad" },
          ],
          mapItem: (u) => ({
            nombreCompleto: u.nombreCompleto ?? "",
            email: u.email ?? "",
            username: u.username ?? "",
            telefono: u.telefono ?? "",
            rolNombre: u.rolNombre ?? "",
            estado: u.estado ?? "",
            legajo: u.legajo ?? "",
            dni: u.dni ?? "",
            ultimaActividad: u.ultimaActividad ?? "",
          }),
        }}
        bulkActionsDropdown={[
          {
            key: "cambiar-estado",
            label: "Cambiar estado",
            onAction: (ctx) => {
              addToast({ title: "Cambiar estado", description: `${ctx.totalCount} usuario(s)` });
            },
          },
          {
            key: "editar-campos",
            label: "Editar campos comunes",
            onAction: (ctx) => {
              addToast({ title: "Editar campos", description: `${ctx.totalCount} usuario(s)` });
            },
          },
          {
            key: "exportar-csv",
            label: "Exportar como CSV",
            onAction: (ctx) => {
              const data = ctx.items.map((u) => ({
                nombreCompleto: u.nombreCompleto ?? "",
                email: u.email ?? "",
                username: u.username ?? "",
                telefono: u.telefono ?? "",
                rolNombre: u.rolNombre ?? "",
                estado: u.estado ?? "",
                legajo: u.legajo ?? "",
                dni: u.dni ?? "",
                ultimaActividad: u.ultimaActividad ?? "",
              }));
              const columns = [
                { key: "nombreCompleto" as const, header: "Nombre completo" },
                { key: "email" as const, header: "Email" },
                { key: "username" as const, header: "Usuario" },
                { key: "telefono" as const, header: "Teléfono" },
                { key: "rolNombre" as const, header: "Rol" },
                { key: "estado" as const, header: "Estado" },
                { key: "legajo" as const, header: "Legajo" },
                { key: "dni" as const, header: "DNI" },
                { key: "ultimaActividad" as const, header: "Última actividad" },
              ];
              exportToCsv(data, columns, "usuarios");
              addToast({
                title: "Exportado",
                description: `${ctx.items.length} usuario${ctx.items.length !== 1 ? "s" : ""} exportado${ctx.items.length !== 1 ? "s" : ""} como CSV`,
                color: "success",
              });
              ctx.clearSelection();
            },
          },
          {
            key: "exportar-xls",
            label: "Exportar como XLS",
            onAction: (ctx) => {
              const data = ctx.items.map((u) => ({
                nombreCompleto: u.nombreCompleto ?? "",
                email: u.email ?? "",
                username: u.username ?? "",
                telefono: u.telefono ?? "",
                rolNombre: u.rolNombre ?? "",
                estado: u.estado ?? "",
                legajo: u.legajo ?? "",
                dni: u.dni ?? "",
                ultimaActividad: u.ultimaActividad ?? "",
              }));
              const columns = [
                { key: "nombreCompleto" as const, header: "Nombre completo" },
                { key: "email" as const, header: "Email" },
                { key: "username" as const, header: "Usuario" },
                { key: "telefono" as const, header: "Teléfono" },
                { key: "rolNombre" as const, header: "Rol" },
                { key: "estado" as const, header: "Estado" },
                { key: "legajo" as const, header: "Legajo" },
                { key: "dni" as const, header: "DNI" },
                { key: "ultimaActividad" as const, header: "Última actividad" },
              ];
              exportToXls(data, columns, "usuarios");
              addToast({
                title: "Exportado",
                description: `${ctx.items.length} usuario${ctx.items.length !== 1 ? "s" : ""} exportado${ctx.items.length !== 1 ? "s" : ""} como Excel`,
                color: "success",
              });
              ctx.clearSelection();
            },
          },
        ]}
        renderRowPreview={(item) => (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Nombre completo</p>
                <p className="font-semibold text-slate-800">{item.nombreCompleto}</p>
                {item.legajo && (
                  <p className="text-slate-500 text-xs mt-1">Legajo: {item.legajo}</p>
                )}
                {item.dni && (
                  <p className="text-slate-500 text-xs">DNI: {item.dni}</p>
                )}
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Estado</p>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    item.estado === "Activo"
                      ? "bg-green-100 text-green-700"
                      : item.estado === "Invitado"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {item.estado}
                </span>
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Acceso</p>
              <div className="space-y-1">
                <p className="font-mono text-sm">
                  Usuario: {item.username || "—"}
                </p>
                <p className="text-slate-600">
                  Email: {item.email || "—"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Rol</p>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  item.rolTipo === "ADMINISTRADOR" ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-700"
                }`}
              >
                {item.rolNombre || "Sin rol"}
              </span>
            </div>
            {item.sucursales && item.sucursales.length > 0 && (
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Sucursales asignadas</p>
                <div className="flex flex-wrap gap-1">
                  {item.sucursales.map((s) => (
                    <span
                      key={s.Id}
                      className="inline-block px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700"
                    >
                      {s.Nombre}
                      {s.EsDefault && " (default)"}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Ubicación</p>
              <p className="font-medium">{item.localidad || "Pendiente"}</p>
              {item.direccion && (
                <p className="text-slate-500 text-xs mt-0.5">{item.direccion}</p>
              )}
            </div>
            <div className="flex gap-6">
              {item.telefono && (
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Teléfono</p>
                  <p className="font-medium">{item.telefono}</p>
                </div>
              )}
              {item.ultimaActividad && (
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Última actividad</p>
                  <p className="text-slate-600 text-xs">{item.ultimaActividad}</p>
                </div>
              )}
            </div>
          </div>
        )}
        getRowPreviewTitle={(item) => item.nombreCompleto || "Usuario"}
        columns={[
          {
            uid: "nombreCompleto",
            name: "NOMBRE",
            sortable: true,
            align: "start",
          },
          { uid: "username", name: "USUARIO", sortable: true },
          { uid: "rolNombre", name: "ROL", sortable: false },
          { uid: "legajo", name: "LEGAJO", sortable: true },
          // { uid: "sucursal", name: "SUCURSAL", sortable: false },
          { uid: "localidad", name: "LOCALIDAD", sortable: false },
          { uid: "estado", name: "ESTADO", sortable: false },
          { uid: "acciones", name: "ACCIONES" },
        ]}
        renderCell={(item, columnKey, actions) => {
          switch (columnKey) {
            case "nombreCompleto":
              return (
                <span className="font-medium text-gray-700">
                  {item.nombreCompleto}
                </span>
              );
            case "username":
              return (
                <span className="text-gray-600 text-sm font-mono">
                  {item.username || item.email || "-"}
                </span>
              );
            case "rolNombre":
              const rolColor =
                item.rolTipo === "ADMINISTRADOR" ? "primary" : "secondary";
              return (
                <Chip size="sm" color={rolColor} variant="flat">
                  {item.rolNombre || "Sin rol"}
                </Chip>
              );
            case "legajo":
              return (
                <span className="text-gray-600 text-sm">
                  {item.legajo || "-"}
                </span>
              );
            case "localidad":
              return (
                <span className="text-gray-600 text-sm">
                  {item.localidad || "Pendiente"}
                </span>
              );
            case "estado":
              const estadoColor =
                item.estado === "Activo"
                  ? "success"
                  : item.estado === "Invitado"
                    ? "warning"
                    : "danger";
              return (
                <Chip size="sm" color={estadoColor} variant="flat">
                  {item.estado}
                </Chip>
              );
            case "acciones":
              const isCurrentUser = Number(item.Id) === Number(user?.Id);

              // Check if the CURRENT user is an Administrator
              const currentUserIsAdmin = roles?.some(
                (r) =>
                  r.Tipo === TIPO_PERFIL.ADMINISTRADOR ||
                  r.Tipo === "SUPERADMIN",
              );

              // Lógica de Permisos Refinada:

              // 1. Editar / Cambiar Contraseña:
              // - Admin: Puede editar a todos.
              // - No-Admin: Solo puede editarse a sí mismo.
              const canEditOrPass = currentUserIsAdmin || isCurrentUser;

              // 2. Eliminar:
              // - Admin: Puede eliminar a todos, MENOS a sí mismo.
              // - No-Admin: No puede eliminar a nadie (ni a sí mismo, ni a otros).
              const canDelete = currentUserIsAdmin && !isCurrentUser;

              return (
                <div className="flex gap-2 w-full justify-center items-center">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="secondary"
                    onPress={() => setPasswordModalUser(item)}
                    isDisabled={!canEditOrPass}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                      />
                    </svg>
                  </Button>

                  <EditButton
                    onPress={() => actions.onEdit(item)}
                    label={`Editar ${item.nombreCompleto || "usuario"}`}
                    isDisabled={!canEditOrPass}
                  />

                  <DeleteButton
                    onPress={() => actions.onDelete(item)}
                    label={`Eliminar ${item.nombreCompleto || "usuario"}`}
                    isDisabled={!canDelete}
                  />
                </div>
              );
            default:
              return null;
          }
        }}
        FormComponent={UsuarioForm}
      />
      {passwordModalUser && (
        <ChangePasswordModal
          isOpen={!!passwordModalUser}
          onClose={() => setPasswordModalUser(null)}
          usuarioId={passwordModalUser.Id}
          userName={
            passwordModalUser.username || passwordModalUser.nombreCompleto
          }
        />
      )}
    </>
  );
}
