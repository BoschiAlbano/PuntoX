"use client";

import { useState, useEffect } from "react";
import { Input, Select, SelectItem, Button, Spinner } from "@heroui/react";
import Image from "next/image";
import { useConfiguracion } from "@/hooks/useConfiguracion";
import { SectionPanel } from "./SectionPanel";

export function PerfilTab() {
  const {
    tenant: tenantData,
    configuracion: configuracionData,
    branding: brandingData,
    saveTenant: saveTenantMutation,
    saveConfiguracion: saveConfiguracionMutation,
    saveBranding: saveBrandingMutation,
    isSavingTenant,
    isSavingConfiguracion,
    useProvincias,
    useDepartamentos,
    useLocalidades,
  } = useConfiguracion();

  // Local state for form fields
  const [tenant, setTenant] = useState({
    nombre: "",
    dominio: "",
  });

  const [configuracion, setConfiguracion] = useState({
    razonSocial: "",
    nombreFantasia: "",
    cuit: "",
    email: "",
    telefono: "",
    celular: "",
    direccion: "",
    localidadId: null as number | null,
    departamentoId: null as number | null,
    provinciaId: null as number | null,
    observacionPieFactura: "",
  });

  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoPreviewOriginal, setLogoPreviewOriginal] = useState<string>("");

  // Location Selector State
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<
    string | null
  >(null);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<
    string | null
  >(null);

  // Queries
  const provinciasQuery = useProvincias();
  const departamentosQuery = useDepartamentos(provinciaSeleccionada);
  const localidadesQuery = useLocalidades(departamentoSeleccionado);

  const provincias = provinciasQuery.data || [];
  const departamentos = departamentosQuery.data || [];
  const localidades = localidadesQuery.data || [];

  // Sync data on load
  useEffect(() => {
    if (tenantData) {
      setTenant({
        nombre: tenantData.nombre || "",
        dominio: tenantData.dominio || "",
      });
    }
  }, [tenantData]);

  useEffect(() => {
    if (configuracionData) {
      setConfiguracion({
        razonSocial: configuracionData.razonSocial || "",
        nombreFantasia: configuracionData.nombreFantasia || "",
        cuit: configuracionData.cuit || "",
        email: configuracionData.email || "",
        telefono: configuracionData.telefono || "",
        celular: configuracionData.celular || "",
        direccion: configuracionData.direccion || "",
        localidadId: configuracionData.localidadId || null,
        departamentoId: configuracionData.departamentoId || null,
        provinciaId: configuracionData.provinciaId || null,
        observacionPieFactura: configuracionData.observacionPieFactura || "",
      });

      if (configuracionData.provinciaId) {
        setProvinciaSeleccionada(String(configuracionData.provinciaId));
      }
      if (configuracionData.departamentoId) {
        setDepartamentoSeleccionado(String(configuracionData.departamentoId));
      }
    }
  }, [configuracionData]);

  useEffect(() => {
    if (brandingData?.logoPreview) {
      setLogoPreview(brandingData.logoPreview);
      setLogoPreviewOriginal(brandingData.logoPreview);
    }
  }, [brandingData]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("El archivo es demasiado grande (Máximo 5MB)");
        return;
      }
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      await Promise.all([
        saveTenantMutation(tenant),
        saveConfiguracionMutation(configuracion),
        logo
          ? saveBrandingMutation({
              ...brandingData,
              slogan: brandingData?.slogan || "",
              color: brandingData?.color || "",
              logo,
            })
          : Promise.resolve(),
      ]);
      setLogo(null);
    } catch (error) {
      console.error("Error saving profile", error);
    }
  };

  const isSaving = isSavingTenant || isSavingConfiguracion;

  return (
    <SectionPanel
      id="perfil"
      title="Perfil del negocio"
      description="Información general de su empresa"
      summary="Aquí puede configurar los datos básicos de su negocio"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full relative">
        {/* Logo */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Logo del negocio
          </label>
          <div className="flex items-center gap-4">
            {logoPreview && (
              <div className="relative">
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-24 h-24 object-contain border border-slate-200 rounded-lg bg-white"
                  width={96}
                  height={96}
                />
                <button
                  type="button"
                  onClick={() => {
                    setLogo(null);
                    setLogoPreview(logoPreviewOriginal);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex-1">
              <Input
                type="file"
                accept="image/*"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white border-slate-200" }}
                onChange={handleLogoChange}
              />
              <p className="text-xs text-gray-500 mt-1">
                Formatos: JPG, PNG, GIF. Máximo 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <Input
          label="Nombre"
          variant="bordered"
          classNames={{ inputWrapper: "bg-white border-slate-200" }}
          value={tenant.nombre}
          onChange={(e) => setTenant({ ...tenant, nombre: e.target.value })}
        />
        <Input
          label="Razón social"
          variant="bordered"
          classNames={{ inputWrapper: "bg-white border-slate-200" }}
          value={configuracion.razonSocial}
          onChange={(e) =>
            setConfiguracion({ ...configuracion, razonSocial: e.target.value })
          }
          isRequired
        />
        <Input
          label="Nombre de fantasía"
          variant="bordered"
          classNames={{ inputWrapper: "bg-white border-slate-200" }}
          value={configuracion.nombreFantasia}
          onChange={(e) =>
            setConfiguracion({
              ...configuracion,
              nombreFantasia: e.target.value,
            })
          }
        />
        <Input
          label="Correo"
          type="email"
          variant="bordered"
          classNames={{ inputWrapper: "bg-white border-slate-200" }}
          value={configuracion.email}
          onChange={(e) =>
            setConfiguracion({ ...configuracion, email: e.target.value })
          }
        />
        <Input
          label="Telefono"
          variant="bordered"
          classNames={{ inputWrapper: "bg-white border-slate-200" }}
          value={configuracion.telefono}
          onChange={(e) =>
            setConfiguracion({ ...configuracion, telefono: e.target.value })
          }
        />
        <Input
          label="Celular"
          variant="bordered"
          classNames={{ inputWrapper: "bg-white border-slate-200" }}
          value={configuracion.celular}
          onChange={(e) =>
            setConfiguracion({ ...configuracion, celular: e.target.value })
          }
        />
        <Input
          label="Dominio"
          variant="bordered"
          classNames={{ inputWrapper: "bg-white border-slate-200" }}
          value={tenant.dominio}
          onChange={(e) => setTenant({ ...tenant, dominio: e.target.value })}
        />
        <Input
          label="CUIT"
          variant="bordered"
          classNames={{ inputWrapper: "bg-white border-slate-200" }}
          value={configuracion.cuit}
          onChange={(e) =>
            setConfiguracion({ ...configuracion, cuit: e.target.value })
          }
          isRequired
        />
        <Input
          label="Dirección"
          variant="bordered"
          classNames={{ inputWrapper: "bg-white border-slate-200" }}
          value={configuracion.direccion}
          onChange={(e) =>
            setConfiguracion({ ...configuracion, direccion: e.target.value })
          }
          isRequired
        />

        {/* Location Selectors */}
        <div className="md:col-span-2 space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Ubicación del negocio <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500">
              Seleccione la ubicación completa de su negocio (Campo obligatorio)
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select
              label="Provincia"
              variant="bordered"
              placeholder="Seleccione provincia"
              selectedKeys={
                provinciaSeleccionada ? [provinciaSeleccionada] : []
              }
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setProvinciaSeleccionada(selected || null);
                setDepartamentoSeleccionado(null);
                setConfiguracion((prev) => ({
                  ...prev,
                  provinciaId: selected ? Number(selected) : null,
                  departamentoId: null,
                  localidadId: null,
                }));
              }}
              classNames={{ trigger: "bg-white border-slate-200" }}
              isRequired
            >
              {provincias.map((provincia) => (
                <SelectItem key={provincia.Id.toString()}>
                  {provincia.Descripcion}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="Departamento"
              variant="bordered"
              placeholder={
                !provinciaSeleccionada
                  ? "Seleccione provincia"
                  : departamentosQuery.isLoading
                    ? "Cargando..."
                    : "Seleccione departamento"
              }
              selectedKeys={
                departamentoSeleccionado ? [departamentoSeleccionado] : []
              }
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setDepartamentoSeleccionado(selected || null);
                setConfiguracion((prev) => ({
                  ...prev,
                  departamentoId: selected ? Number(selected) : null,
                  localidadId: null,
                }));
              }}
              classNames={{ trigger: "bg-white border-slate-200" }}
              isLoading={departamentosQuery.isLoading}
              isDisabled={
                !provinciaSeleccionada || departamentosQuery.isLoading
              }
              isRequired
            >
              {departamentos.length === 0 &&
              !departamentosQuery.isLoading &&
              provinciaSeleccionada ? (
                <SelectItem key="no-items" isDisabled>
                  No hay departamentos
                </SelectItem>
              ) : (
                departamentos.map((dep) => (
                  <SelectItem key={dep.Id.toString()}>
                    {dep.Descripcion}
                  </SelectItem>
                ))
              )}
            </Select>
            <Select
              label="Localidad"
              variant="bordered"
              placeholder={
                !departamentoSeleccionado
                  ? "Seleccione departamento"
                  : localidadesQuery.isLoading
                    ? "Cargando..."
                    : "Seleccione localidad"
              }
              selectedKeys={
                configuracion.localidadId
                  ? [configuracion.localidadId.toString()]
                  : []
              }
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                setConfiguracion((prev) => ({
                  ...prev,
                  localidadId: selected ? Number(selected) : null,
                }));
              }}
              classNames={{ trigger: "bg-white border-slate-200" }}
              isLoading={localidadesQuery.isLoading}
              isDisabled={
                !departamentoSeleccionado || localidadesQuery.isLoading
              }
              isRequired
            >
              {localidades.length === 0 &&
              !localidadesQuery.isLoading &&
              departamentoSeleccionado ? (
                <SelectItem key="no-items" isDisabled>
                  No hay localidades
                </SelectItem>
              ) : (
                localidades.map((loc) => (
                  <SelectItem key={loc.Id.toString()}>
                    {loc.Descripcion}
                  </SelectItem>
                ))
              )}
            </Select>
          </div>
        </div>

        <Input
          label="Observación en pie de factura"
          variant="bordered"
          className="md:col-span-2"
          classNames={{ inputWrapper: "bg-white border-slate-200" }}
          value={configuracion.observacionPieFactura}
          onChange={(e) =>
            setConfiguracion({
              ...configuracion,
              observacionPieFactura: e.target.value,
            })
          }
          placeholder="Ej: Gracias por tu compra. Vuelve pronto."
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button color="primary" onPress={handleSave} isLoading={isSaving}>
          Guardar Cambios
        </Button>
      </div>
    </SectionPanel>
  );
}
