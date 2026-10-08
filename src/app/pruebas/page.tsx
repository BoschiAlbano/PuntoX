import { AuthLoadingView } from "@/components/loading/loading";
import React from "react";

const Page = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <AuthLoadingView size={40} message="hola prueba" />
    </div>
  );
};

export default Page;
