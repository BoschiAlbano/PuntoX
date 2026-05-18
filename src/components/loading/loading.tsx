"use client";
import { PuntoXLogo } from "../ui/PuntoXLogo";

function LoadingSpinner({ message }: { message?: string }) {
  return (
    <section className="min-h-75 h-full w-full bg-transparent flex flex-col items-center justify-center gap-2">
      <PuntoXLogo spinner />
      <p className="text-slate-600 font-medium tracking-wide">{message}</p>
    </section>
  );
  // return (
  //   <motion.div
  //     initial={{ opacity: 0, scale: 0.95 }}
  //     animate={{ opacity: 1, scale: 1 }}
  //     transition={{ duration: 0.5, ease: "easeOut" }}
  //     className="text-center flex flex-col items-center"
  //   >
  //     <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
  //       {/* Glow de fondo */}
  //       <div className="absolute inset-0  rounded-full blur-xl animate-pulse" />

  //       {/* Anillo giratorio principal */}
  //       <motion.div
  //         animate={{ rotate: 360 }}
  //         transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
  //         className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#67afc3] border-r-[#2dd4bf]"
  //       />

  //       {/* Anillo giratorio secundario (inverso) */}
  //       <motion.div
  //         animate={{ rotate: -360 }}
  //         transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
  //         className="absolute inset-2 rounded-full border-[3px] border-transparent border-b-[#67afc3]/50 border-l-[#2dd4bf]/50"
  //       />

  //       {/* Contenedor central Glassmorphism */}
  //       <PuntoXLogo spinner />
  //     </div>

  //     {message && (
  //       <motion.div
  //         initial={{ opacity: 0, y: 10 }}
  //         animate={{ opacity: 1, y: 0 }}
  //         transition={{ delay: 0.2 }}
  //         className="flex flex-col items-center gap-3"
  //       >
  //         <p className="text-slate-600 font-medium tracking-wide">{message}</p>
  //         {/* Puntos de carga animados */}
  //         <div className="flex gap-1.5">
  //           <motion.div
  //             animate={{ y: [0, -4, 0] }}
  //             transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
  //             className="w-1.5 h-1.5 rounded-full bg-[#67afc3]"
  //           />
  //           <motion.div
  //             animate={{ y: [0, -4, 0] }}
  //             transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
  //             className="w-1.5 h-1.5 rounded-full bg-[#67afc3]"
  //           />
  //           <motion.div
  //             animate={{ y: [0, -4, 0] }}
  //             transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
  //             className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf]"
  //           />
  //         </div>
  //       </motion.div>
  //     )}
  //   </motion.div>
  // );
}

export function LoadingPage({
  message = "Verificando autenticación...",
}: {
  message?: string;
}) {
  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center relative overflow-hidden">
      <div className="relative z-10 flex flex-col items-center justify-center">
        <LoadingSpinner message={message} />
      </div>
    </div>
  );
}

export function LoadingComponent({
  message = "Cargando...",
}: {
  message?: string;
}) {
  return (
    <div className="min-h-75 h-full w-full bg-transparent flex items-center justify-center">
      <LoadingSpinner message={message} />
    </div>
  );
}
