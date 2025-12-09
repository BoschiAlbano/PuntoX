"use client";

import { Tabs, Tab, Card, CardBody } from "@heroui/react";
import MarcaCRUD from "@/components/marcas/MarcaCRUD";
import ProductoCRUD from "@/components/productos/ProductoCRUD";
import RubroCRUD from "@/components/rubros/RubroCRUD";
import UnidadMedidaCRUD from "@/components/unidad-medida/UnidadMedidaCRUD";

export default function ProductosPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header de la página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de Productos
        </h1>
        <p className="text-gray-600 mt-2">
          Administra tus productos, marcas, rubros y unidades de medida
        </p>
      </div>

      {/* Tabs con los diferentes CRUDs */}
      <Tabs
        aria-label="Gestión de productos"
        color="primary"
        variant="underlined"
        classNames={{
          tabList:
            "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-primary",
        }}
      >
        <Tab
          key="productos"
          title={
            <div className="flex items-center space-x-2">
              <span>📦</span>
              <span>Productos</span>
            </div>
          }
        >
          <Card className="mt-6 shadow-none border-none bg-transparent">
            <CardBody className="p-0">
              <ProductoCRUD />
            </CardBody>
          </Card>
        </Tab>

        <Tab
          key="marcas"
          title={
            <div className="flex items-center space-x-2">
              <span>🏷️</span>
              <span>Marcas</span>
            </div>
          }
        >
          <Card className="mt-6 shadow-none border-none bg-transparent">
            <CardBody className="p-0">
              <MarcaCRUD />
            </CardBody>
          </Card>
        </Tab>

        <Tab
          key="rubros"
          title={
            <div className="flex items-center space-x-2">
              <span>📁</span>
              <span>Rubros</span>
            </div>
          }
        >
          <Card className="mt-6 shadow-none border-none bg-transparent">
            <CardBody className="p-0">
              <RubroCRUD />
            </CardBody>
          </Card>
        </Tab>

        <Tab
          key="unidades"
          title={
            <div className="flex items-center space-x-2">
              <span>⚖️</span>
              <span>Unidades de Medida</span>
            </div>
          }
        >
          <Card className="mt-6 shadow-none border-none bg-transparent">
            <CardBody className="p-0">
              <UnidadMedidaCRUD />
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}
