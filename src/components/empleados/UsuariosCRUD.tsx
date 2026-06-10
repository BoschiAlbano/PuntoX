"use client";

import { useState } from "react";
import GenericCrud from "@/components/shared/GenericCrud";
import {
  Chip,
  Tooltip,
  addToast,
} from "@heroui/react";
import { EditButton, DeleteButton, PasswordButton, LockButton } from "../shared/TableActions";
import { useQueryClient } from "@tanstack/react-query";
import ChangePasswordModal from "./ChangePasswordModal";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { useRouter } from "next/navigation";
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
  foto: string | null;
  dni: string | null;
  ultimaActividad: string | null;
  intentosFallidos?: number;
};

export default function UsuariosCRUD() {
  const router = useRouter();
  const { user, roles, updateUserFoto, isAdministrador, isSuperAdmin } = useUserStore();
  const queryClient = useQueryClient();
  const [passwordModalUser, setPasswordModalUser] = useState<Usuario | null>(
    null,
  );
  const [lockConfirm, setLockConfirm] = useState<{
    item: Usuario;
    bloquear: boolean;
  } | null>(null);
  const [isLocking, setIsLocking] = useState(false);

  const handleLockToggle = async () => {
    if (!lockConfirm) return;
    setIsLocking(true);
    try {
      const res = await fetch("/api/empleados", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: lockConfirm.item.usuarioId ?? lockConfirm.item.Id,
          bloquear: lockConfirm.bloquear,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al actualizar el estado");
      }
      addToast({
        title: lockConfirm.bloquear
          ? "Cuenta bloqueada"
          : "Cuenta desbloqueada",
        description: lockConfirm.bloquear
          ? `${lockConfirm.item.nombreCompleto} ya no puede iniciar sesión`
          : `${lockConfirm.item.nombreCompleto} puede volver a iniciar sesión`,
        color: lockConfirm.bloquear ? "warning" : "success",
      });
      queryClient.invalidateQueries({ queryKey: ["usuarios-crud"] });
    } catch (err: any) {
      addToast({
        title: "Error",
        description: err.message || "No se pudo actualizar el estado",
        color: "danger",
      });
    } finally {
      setIsLocking(false);
      setLockConfirm(null);
    }
  };

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
        onSaveSuccess={(result, _payload, isEdit) => {
          // Si editamos al empleado que corresponde al usuario logueado, actualizar su foto en el store
          if (!isEdit) return;
          const fotoNueva = result?.empleado?.foto;
          if (fotoNueva === undefined) return; // La API no devolvió foto → nada que hacer
          // Verificar si el empleado editado es el usuario actual
          const editedUsuarioId = result?.empleado?.id ?? result?.empleado?.usuarioId;
          if (editedUsuarioId && Number(editedUsuarioId) === Number(user?.Id)) {
            updateUserFoto(fotoNueva ?? null);
          }
        }}
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
              addToast({
                title: "Cambiar estado",
                description: `${ctx.totalCount} usuario(s)`,
              });
            },
          },
        ]}
        renderRowPreview={(item) => (
          <div className="space-y-6 text-sm">
            <div className="p-4 rounded-xl bg-linear-to-br from-slate-50 to-white border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#67afc3] to-[#2dd4bf] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                {item.nombre?.charAt(0).toUpperCase()}
                {item.apellido?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-800 text-base">
                  {item.nombreCompleto}
                </p>
                {item.legajo && (
                  <p className="text-slate-500 font-medium text-xs mt-0.5">
                    Legajo: {item.legajo}
                  </p>
                )}
                {item.dni && (
                  <p className="text-slate-500 font-medium text-xs">
                    DNI: {item.dni}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-1">
                  Estado
                </p>
                <span
                  className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${
                    item.estado === "Activo"
                      ? "bg-emerald-50 text-emerald-600"
                      : item.estado === "Invitado"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-red-50 text-red-500"
                  }`}
                >
                  {item.estado}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-1">
                  Rol Asignado
                </p>
                <span
                  className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${
                    item.rolTipo === "ADMINISTRADOR"
                      ? "bg-[#67afc3]/10 text-[#67afc3]"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.rolNombre || "Sin rol"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-1">
                  Acceso
                </p>
                <div className="space-y-1.5">
                  <p className="text-slate-700 text-xs font-mono font-medium truncate">
                    @ {item.username || "—"}
                  </p>
                  <p className="text-slate-700 text-xs font-medium truncate flex items-center gap-1">
                    <span className="text-slate-400 text-[10px]">✉️</span>{" "}
                    {item.email || "—"}
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-1">
                  Ubicación
                </p>
                <p className="font-medium text-slate-700 text-xs truncate">
                  {item.localidad || "Pendiente"}
                </p>
                {item.direccion && (
                  <p className="text-slate-500 text-[10px] mt-0.5 truncate">
                    {item.direccion}
                  </p>
                )}
              </div>
            </div>

            {item.sucursales && item.sucursales.length > 0 ? (
              <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-1">
                  Sucursales asignadas
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {item.sucursales.map((s) => (
                    <span
                      key={s.Id}
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        s.EsDefault
                          ? "bg-[#67afc3]/10 text-[#67afc3] border-[#67afc3]/20"
                          : "bg-white text-slate-500 border-slate-200"
                      }`}
                    >
                      {s.Nombre}
                      {s.EsDefault && " (Predeterminada)"}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex gap-4 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
              <div className="flex-1">
                <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-0.5">
                  Teléfono
                </p>
                <p className="font-medium text-slate-700 text-xs">
                  {item.telefono || "—"}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mb-0.5">
                  Última actividad
                </p>
                <p className="text-slate-600 text-xs">
                  {item.ultimaActividad || "—"}
                </p>
              </div>
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
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#67afc3] to-[#2dd4bf] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                    {item.nombre?.charAt(0).toUpperCase()}
                    {item.apellido?.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-800">
                    {item.nombreCompleto}
                  </span>
                </div>
              );
            case "username":
              return (
                <span className="text-slate-500 text-xs font-mono font-medium bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                  {item.username || item.email || "-"}
                </span>
              );
            case "rolNombre":
              return (
                <span
                  className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${
                    item.rolTipo === "ADMINISTRADOR"
                      ? "bg-[#67afc3]/10 text-[#67afc3]"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.rolNombre || "Sin rol"}
                </span>
              );
            case "legajo":
              return (
                <span className="text-slate-500 text-xs font-medium">
                  {item.legajo || "-"}
                </span>
              );
            case "localidad":
              return (
                <span className="text-slate-600 text-xs font-medium truncate max-w-[120px] inline-block">
                  {item.localidad || "Pendiente"}
                </span>
              );
            case "estado": {
              const estadoStyle =
                item.estado === "Activo"
                  ? "bg-emerald-50 text-emerald-600"
                  : item.estado === "Invitado"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-red-50 text-red-500";
              const esBloqueoAutomatico =
                item.estado === "Suspendido" &&
                (item.intentosFallidos ?? 0) > 0;
              return (
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${estadoStyle}`}
                  >
                    {item.estado}
                  </span>
                  {esBloqueoAutomatico && (
                    <Tooltip
                      content={`Bloqueado automáticamente tras ${item.intentosFallidos} intento${(item.intentosFallidos ?? 0) !== 1 ? "s" : ""} fallido${(item.intentosFallidos ?? 0) !== 1 ? "s" : ""}`}
                      placement="top"
                    >
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-100 text-orange-600 text-[9px] font-bold cursor-default">
                        !
                      </span>
                    </Tooltip>
                  )}
                </div>
              );
            }
            case "acciones": {
              const isCurrentUser = Number(item.usuarioId) === Number(user?.Id);

              // Check if the CURRENT user is an Administrator
              const currentUserIsAdmin = isAdministrador || isSuperAdmin;

              // 1. Editar / Cambiar Contraseña: admin puede editar a todos; no-admin solo a sí mismo
              const canEditOrPass = currentUserIsAdmin || isCurrentUser;
              // 2. Eliminar: admin puede eliminar a todos menos a sí mismo
              const canDelete = currentUserIsAdmin && !isCurrentUser;
              // 3. Bloquear/Desbloquear: solo admins, no sobre sí mismos, y solo si tiene usuario
              const canBlock =
                currentUserIsAdmin && !isCurrentUser && !!item.usuarioId;
              const estaActivo = item.estado !== "Suspendido";

              return (
                <div className="flex gap-2 w-full justify-center items-center">
                  <PasswordButton
                    onPress={() => setPasswordModalUser(item)}
                    isDisabled={!canEditOrPass}
                  />

                  <EditButton
                    onPress={() => router.push(`/empleados/${item.personaId}`)}
                    label={`Editar ${item.nombreCompleto || "usuario"}`}
                    isDisabled={!canEditOrPass}
                  />

                  {canBlock && (
                    <LockButton
                      isLocked={!estaActivo}
                      onPress={() =>
                        setLockConfirm({ item, bloquear: estaActivo })
                      }
                    />
                  )}

                  <DeleteButton
                    onPress={() => actions.onDelete(item)}
                    label={`Eliminar ${item.nombreCompleto || "usuario"}`}
                    isDisabled={!canDelete}
                  />
                </div>
              );
            }
            default:
              return null;
          }
        }}
        onNewClick={() => router.push("/empleados/new")}
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

      {/* Modal de confirmación para bloquear/desbloquear */}
      <ConfirmModal
        isOpen={!!lockConfirm}
        onClose={() => setLockConfirm(null)}
        onConfirm={handleLockToggle}
        title={lockConfirm?.bloquear ? "Bloquear cuenta" : "Desbloquear cuenta"}
        description={
          <p className="text-sm text-slate-600">
            {lockConfirm?.bloquear ? (
              <>
                ¿Estás seguro de que querés bloquear la cuenta de{" "}
                <span className="font-semibold">
                  {lockConfirm.item.nombreCompleto}
                </span>
                ? El usuario no podrá iniciar sesión hasta que sea desbloqueado.
              </>
            ) : (
              <>
                ¿Querés desbloquear la cuenta de{" "}
                <span className="font-semibold">
                  {lockConfirm?.item.nombreCompleto}
                </span>
                ? El usuario podrá volver a iniciar sesión.
              </>
            )}
          </p>
        }
        confirmLabel={lockConfirm?.bloquear ? "Bloquear" : "Desbloquear"}
        variant={lockConfirm?.bloquear ? "danger" : "success"}
        isLoading={isLocking}
      />
    </>
  );
}
