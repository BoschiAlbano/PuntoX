"use client";
import { motion } from "framer-motion";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  addToast,
  Button,
} from "@heroui/react";
import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";

export default function DashboardHeader() {
  const { user, supabase } = useSupabaseAuthContext();

  const userInitials =
    user?.user_metadata?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  function handleSignOut(): void {
    addToast({
      title: "Cerrar sesion",
      description: "Confirma que deseas cerrar sesion.",
      endContent: (
        <Button size="sm" variant="flat" onPress={() => supabase.auth.signOut()}>
          Aceptar
        </Button>
      ),
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
          <div className="flex-1 max-w-2xl">
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
          <div className="flex items-center gap-4 ml-6">
            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-3 rounded-xl hover:bg-slate-100 transition-colors"
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
            <Dropdown placement="bottom-end">
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
                      {user?.user_metadata?.full_name || user?.email || "Usuario"}
                    </p>
                    <p className="text-xs text-slate-500">{user?.email || ""}</p>
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
            </Dropdown>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
