"use client";
import { motion } from "framer-motion";
import { addToast } from "@heroui/react";
import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";
import { Dispatch, SetStateAction } from "react";

export default function DashboardHeader({
  isShow,
}: {
  isShow: Dispatch<SetStateAction<boolean>>;
  show: boolean;
}) {
  const { user, supabase } = useSupabaseAuthContext();

  const fullName =
    typeof user?.app_metadata?.full_name === "string"
      ? user.app_metadata.full_name
      : "";
  const initialsFromName = fullName
    ? fullName
        .split(" ")
        .filter(Boolean)
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : "";
  const userInitials =
    initialsFromName || user?.email?.[0]?.toUpperCase() || "U";

  const displayName =
    fullName.trim() ||
    (typeof user?.email === "string" ? user.email : "") ||
    "Usuario";
  const displayEmail = typeof user?.email === "string" ? user.email : "";

  async function handleSignOut(): Promise<void> {
    // Cerrar sesión en la base de datos primero
    try {
      await fetch("/api/auth/registrar-sesion", {
        method: "DELETE",
        credentials: "include",
      });
    } catch (error) {
      console.warn("Error al cerrar sesión en BD:", error);
    }

    // Luego cerrar sesión en Supabase
    await supabase.auth.signOut();
    
    addToast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
      color: "success",
    });
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40"
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Search Bar */}
          <div className="max-w-2xl sm:flex-1  ">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Buscar productos, ordenes, clientes..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center sm:gap-4 gap-0 sm:ml-6 ml-0">
            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-3 rounded-xl hover:bg-slate-100 transition-colors sm:block hidden"
            >
              <svg
                className="w-6 h-6 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </motion.button>

            {/* User Menu */}
            {/* <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 p-2 pr-4 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-[#90c472] flex items-center justify-center text-white font-semibold">
                    {userInitials}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-semibold text-slate-900">
                      {displayName}
                    </p>
                    <p className="text-xs text-slate-500">{displayEmail}</p>
                  </div>
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </motion.button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="User Actions"
                className="flex flex-col p-2 w-64 rounded-xl bg-white  border border-slate-200 shadow-lg"
              >
                <DropdownItem
                  key="settings"
                  className="my-1 hover:bg-slate-100 transition-colors rounded-lg py-2 px-4 cursor-pointer"
                >
                  Mi Perfil
                </DropdownItem>
                <DropdownItem
                  key="team_settings"
                  className="my-1 hover:bg-slate-100 transition-colors rounded-lg py-2 px-4 cursor-pointer"
                >
                  Configuracion
                </DropdownItem>
                <DropdownItem
                  key="analytics"
                  className="my-1 hover:bg-slate-100 transition-colors rounded-lg py-2 px-4 cursor-pointer"
                >
                  Analiticas
                </DropdownItem>
                <DropdownItem
                  key="help_and_feedback"
                  className="my-1 hover:bg-slate-100 transition-colors rounded-lg py-2 px-4 cursor-pointer"
                >
                  Ayuda y Feedback
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  color="danger"
                  onPress={() => handleSignOut()}
                  className=" w-full rounded-lg my-1  hover:bg-slate-100 transition-colors py-2 px-4 cursor-pointer"
                >
                  Cerrar Sesion
                </DropdownItem>
              </DropdownMenu>
            </Dropdown> */}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="items-center gap-3 p-2 pr-4 rounded-xl hover:bg-slate-100 transition-colors flex"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-[#90c472] flex items-center justify-center text-white font-semibold">
                {userInitials}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-semibold text-slate-900">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500">{displayEmail}</p>
              </div>
              {/* <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg> */}
              <svg
                onClick={() => isShow((prev) => !prev)}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-5 cursor-pointer text-gray-500 sm:hidden flex "
              >
                <path
                  fillRule="evenodd"
                  d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
              {/* {show ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5"
                >
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5"
                >
                  <path
                    fill-rule="evenodd"
                    d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"
                    clip-rule="evenodd"
                  />
                </svg>
              )} */}
            </motion.button>
            {/* {show ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5"
                >
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5"
                >
                  <path
                    fill-rule="evenodd"
                    d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"
                    clip-rule="evenodd"
                  />
                </svg>
              )} */}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
