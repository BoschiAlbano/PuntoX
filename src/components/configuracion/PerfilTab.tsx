"use client";

import { useState, useEffect } from "react";
import {
  Input,
  Select,
  SelectItem,
  Button,
  Switch,
  addToast,
} from "@heroui/react";
import Image from "next/image";
import {
  Store,
  Mail,
  Phone,
  Smartphone,
  MapPin,
  Globe,
  FileText,
  Upload,
  Building2,
  Receipt,
  Save,
} from "lucide-react";
import { useConfiguracion } from "@/hooks/useConfiguracion";
import { PerfilTabSkeleton } from "./ConfiguracionSkeleton";

const inputCls = {
  label:
    "text-slate-500 font-bold uppercase text-[10px] tracking-widest ml-0.5",
  inputWrapper:
    "h-11 border-slate-200 bg-slate-50/50 hover:border-[#67afc3]/60 focus-within:!border-[#67afc3] focus-within:ring-1 focus-within:ring-[#67afc3]/20 transition-all rounded-xl",
  input: "text-sm text-slate-700 font-medium",
};

const selectCls = {
  label:
    "text-slate-500 font-bold uppercase text-[10px] tracking-widest ml-0.5",
  trigger:
    "h-11 border-slate-200 bg-slate-50/50 hover:border-[#67afc3]/60 data-[focus=true]:border-[#67afc3] rounded-xl",
};

function FormSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[20px] shadow-sm h-full">
      <div className="px-6 py-4 border-b border-slate-100/60 bg-slate-50/50 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-linear-to-br from-[#67afc3]/15 to-[#2dd4bf]/15 border border-[#67afc3]/20 text-[#67afc3]">
          <Icon size={16} strokeWidth={2.5} />
        </div>
        <h3 className="text-sm font-bold text-slate-700 tracking-tight">
          {title}
        </h3>
      </div>
      <div className="px-6 py-5 ">{children}</div>
    </div>
  );
}

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
    isLoadingTenant,
    isLoadingConfiguracion,
    isLoadingBranding,
    useProvincias,
    useDepartamentos,
    useLocalidades,
  } = useConfiguracion({
    enableTenant: true,
    enableConfiguracion: true,
    enableBranding: true,
  });

  const [tenant, setTenant] = useState({ nombre: "", dominio: "" });
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
    ShowFoto: false,
  });

  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoPreviewOriginal, setLogoPreviewOriginal] = useState<string>("");
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<
    string | null
  >(null);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<
    string | null
  >(null);

  const provinciasQuery = useProvincias();
  const departamentosQuery = useDepartamentos(provinciaSeleccionada);
  const localidadesQuery = useLocalidades(departamentoSeleccionado);
  const provincias = provinciasQuery.data || [];
  const departamentos = departamentosQuery.data || [];
  const localidades = localidadesQuery.data || [];

  useEffect(() => {
    if (tenantData)
      setTenant({
        nombre: tenantData.nombre || "",
        dominio: tenantData.dominio || "",
      });
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
        ShowFoto: configuracionData.ShowFoto || false,
      });
      if (configuracionData.provinciaId)
        setProvinciaSeleccionada(String(configuracionData.provinciaId));
      if (configuracionData.departamentoId)
        setDepartamentoSeleccionado(String(configuracionData.departamentoId));
    }
  }, [configuracionData]);

  useEffect(() => {
    if (brandingData?.logoPreview) {
      setLogoPreview(brandingData.logoPreview);
      setLogoPreviewOriginal(brandingData.logoPreview);
    }
  }, [brandingData]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("El archivo es demasiado grande (Máximo 5MB)");
        return;
      }
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const [, , brandingResult] = await Promise.all([
        saveTenantMutation(tenant, true), // silent: true
        saveConfiguracionMutation(configuracion, true), // silent: true
        logo
          ? saveBrandingMutation(
              {
                ...brandingData,
                slogan: brandingData?.slogan || "",
                color: brandingData?.color || "",
                logo,
              },
              true,
            ) // silent: true
          : Promise.resolve(null),
      ]);
      if (brandingResult?.logoPreview) {
        setLogoPreview(brandingResult.logoPreview);
        setLogoPreviewOriginal(brandingResult.logoPreview);
      }
      setLogo(null);

      // Mostrar un solo mensaje de éxito
      addToast({
        title: "Configuración guardada",
        description: "Los datos del negocio se guardaron correctamente.",
        color: "success",
      });
    } catch (error) {
      console.error("Error saving profile", error);
      // El error ya se maneja en el hook con handleError
    }
  };

  const isSaving = isSavingTenant || isSavingConfiguracion;
  const isLoading =
    isLoadingTenant || isLoadingConfiguracion || isLoadingBranding;

  if (isLoading) {
    return <PerfilTabSkeleton />;
  }

  return (
    <div className="pt-4">
      {/* Grid container - max width para evitar que se extienda demasiado */}
      <div className="max-w-screen-2xl mx-auto">
        {/* Grid de 2 columnas en pantallas grandes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
          {/* Identidad de marca - ocupa ambas columnas */}
          <div className="lg:col-span-2">
            <FormSection title="Identidad de marca" icon={Store}>
              <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6 lg:gap-8">
                {/* Columna izquierda: Logo upload */}
                <div className="flex flex-col items-center lg:items-start">
                  <label className="text-slate-500 font-bold uppercase text-[10px] tracking-widest ml-0.5 block mb-4">
                    Logo del negocio
                  </label>
                  <div className="flex flex-col items-center gap-5 py-4 w-full">
                    {/* Preview centrado - clickeable */}
                    <label className="cursor-pointer group relative">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                      {logoPreview ? (
                        <div className="relative">
                          <div className="w-40 h-40 rounded-2xl border-2 border-slate-200 bg-white overflow-hidden flex items-center justify-center shadow-sm group-hover:border-[#67afc3] transition-all">
                            <Image
                              src={logoPreview}
                              alt="Logo preview"
                              className="object-contain w-full h-full p-2"
                              width={160}
                              height={160}
                            />
                          </div>
                          {/* Overlay al hacer hover */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex flex-col items-center justify-center gap-2 text-white">
                            <Upload size={24} className="shrink-0" />
                            <span className="text-xs font-bold">
                              Cambiar logo
                            </span>
                          </div>
                          {/* Botón para eliminar */}
                          {logo && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setLogo(null);
                                setLogoPreview(logoPreviewOriginal);
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold hover:bg-red-600 shadow-lg transition-all z-10"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-300 group-hover:border-[#67afc3] group-hover:bg-[#67afc3]/5 transition-all">
                          <Upload
                            size={32}
                            className="group-hover:text-[#67afc3] transition-colors shrink-0"
                          />
                          <span className="text-xs font-bold uppercase tracking-wider group-hover:text-[#67afc3] transition-colors">
                            Subir logo
                          </span>
                          <span className="text-[10px]">
                            JPG, PNG — máx. 5MB
                          </span>
                        </div>
                      )}
                    </label>

                    {/* Switch debajo del logo */}
                    <div className="flex items-center justify-between px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-100 w-full">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-600">
                          Mostrar logo en ticket
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Incluir imagen en el comprobante impreso
                        </span>
                      </div>
                      <Switch
                        isSelected={configuracion.ShowFoto}
                        onValueChange={(v) =>
                          setConfiguracion({ ...configuracion, ShowFoto: v })
                        }
                        size="sm"
                        color="primary"
                        classNames={{
                          wrapper: "group-data-[selected=true]:bg-[#67afc3]",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Columna derecha: Campos de información */}
                <div className="flex flex-col gap-5">
                  <Input
                    label="Nombre del tenant"
                    labelPlacement="outside"
                    placeholder="Mi negocio S.A."
                    variant="bordered"
                    classNames={inputCls}
                    value={tenant.nombre}
                    onChange={(e) =>
                      setTenant({ ...tenant, nombre: e.target.value })
                    }
                    startContent={
                      <Store
                        size={15}
                        className="text-slate-400 mr-1 shrink-0"
                      />
                    }
                  />
                  <Input
                    label="Nombre de fantasía"
                    labelPlacement="outside"
                    placeholder="El Almacén del Sur"
                    variant="bordered"
                    classNames={inputCls}
                    value={configuracion.nombreFantasia}
                    onChange={(e) =>
                      setConfiguracion({
                        ...configuracion,
                        nombreFantasia: e.target.value,
                      })
                    }
                    startContent={
                      <Building2
                        size={15}
                        className="text-slate-400 mr-1 shrink-0"
                      />
                    }
                  />
                  <Input
                    label="Dominio web"
                    labelPlacement="outside"
                    placeholder="minegocio.com"
                    variant="bordered"
                    classNames={inputCls}
                    value={tenant.dominio}
                    onChange={(e) =>
                      setTenant({ ...tenant, dominio: e.target.value })
                    }
                    startContent={
                      <Globe
                        size={15}
                        className="text-slate-400 mr-1 shrink-0"
                      />
                    }
                  />
                  <Input
                    label="Razón social"
                    labelPlacement="outside"
                    placeholder="Mi negocio S.R.L."
                    variant="bordered"
                    classNames={inputCls}
                    isRequired
                    value={configuracion.razonSocial}
                    onChange={(e) =>
                      setConfiguracion({
                        ...configuracion,
                        razonSocial: e.target.value,
                      })
                    }
                    startContent={
                      <FileText
                        size={15}
                        className="text-slate-400 mr-1 shrink-0"
                      />
                    }
                  />
                </div>
              </div>
            </FormSection>
          </div>

          {/* Datos de contacto - columna izquierda */}
          <div>
            <FormSection title="Datos de contacto" icon={Mail}>
              <div className="flex flex-col gap-5">
                <Input
                  label="Correo electrónico"
                  labelPlacement="outside"
                  placeholder="contacto@minegocio.com"
                  type="email"
                  variant="bordered"
                  classNames={inputCls}
                  value={configuracion.email}
                  onChange={(e) =>
                    setConfiguracion({
                      ...configuracion,
                      email: e.target.value,
                    })
                  }
                  startContent={
                    <Mail size={15} className="text-slate-400 mr-1 shrink-0" />
                  }
                />
                <Input
                  label="Teléfono fijo"
                  labelPlacement="outside"
                  placeholder="011 4444-4444"
                  variant="bordered"
                  classNames={inputCls}
                  value={configuracion.telefono}
                  onChange={(e) =>
                    setConfiguracion({
                      ...configuracion,
                      telefono: e.target.value,
                    })
                  }
                  startContent={
                    <Phone size={15} className="text-slate-400 mr-1 shrink-0" />
                  }
                />
                <Input
                  label="Celular / WhatsApp"
                  labelPlacement="outside"
                  placeholder="+54 9 11 1234-5678"
                  variant="bordered"
                  classNames={inputCls}
                  value={configuracion.celular}
                  onChange={(e) =>
                    setConfiguracion({
                      ...configuracion,
                      celular: e.target.value,
                    })
                  }
                  startContent={
                    <Smartphone
                      size={15}
                      className="text-slate-400 mr-1 shrink-0"
                    />
                  }
                />
                <Input
                  label="Dirección"
                  labelPlacement="outside"
                  placeholder="Av. Corrientes 1234, CABA"
                  variant="bordered"
                  classNames={inputCls}
                  isRequired
                  value={configuracion.direccion}
                  onChange={(e) =>
                    setConfiguracion({
                      ...configuracion,
                      direccion: e.target.value,
                    })
                  }
                  startContent={
                    <MapPin
                      size={15}
                      className="text-slate-400 mr-1 shrink-0"
                    />
                  }
                />
              </div>
            </FormSection>
          </div>

          {/* Ubicación - columna derecha */}
          <div>
            <FormSection title="Ubicación del negocio" icon={MapPin}>
              <div className="flex flex-col gap-5 justify-center items-center h-full">
                <Select
                  label="Provincia"
                  labelPlacement="outside"
                  placeholder="Seleccioná una provincia"
                  variant="bordered"
                  classNames={selectCls}
                  isRequired
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
                >
                  {provincias.map((p) => (
                    <SelectItem key={p.Id.toString()}>
                      {p.Descripcion}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Departamento"
                  labelPlacement="outside"
                  placeholder={
                    !provinciaSeleccionada
                      ? "Primero elegí provincia"
                      : "Seleccioná departamento"
                  }
                  variant="bordered"
                  classNames={selectCls}
                  isRequired
                  isDisabled={
                    !provinciaSeleccionada || departamentosQuery.isLoading
                  }
                  isLoading={departamentosQuery.isLoading}
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
                >
                  {departamentos.length === 0 &&
                  !departamentosQuery.isLoading &&
                  provinciaSeleccionada ? (
                    <SelectItem key="none" isDisabled>
                      Sin departamentos
                    </SelectItem>
                  ) : (
                    departamentos.map((d) => (
                      <SelectItem key={d.Id.toString()}>
                        {d.Descripcion}
                      </SelectItem>
                    ))
                  )}
                </Select>

                <Select
                  label="Localidad"
                  labelPlacement="outside"
                  placeholder={
                    !departamentoSeleccionado
                      ? "Primero elegí departamento"
                      : "Seleccioná localidad"
                  }
                  variant="bordered"
                  classNames={selectCls}
                  isRequired
                  isDisabled={
                    !departamentoSeleccionado || localidadesQuery.isLoading
                  }
                  isLoading={localidadesQuery.isLoading}
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
                >
                  {localidades.length === 0 &&
                  !localidadesQuery.isLoading &&
                  departamentoSeleccionado ? (
                    <SelectItem key="none" isDisabled>
                      Sin localidades
                    </SelectItem>
                  ) : (
                    localidades.map((l) => (
                      <SelectItem key={l.Id.toString()}>
                        {l.Descripcion}
                      </SelectItem>
                    ))
                  )}
                </Select>
              </div>
            </FormSection>
          </div>

          {/* Observación en comprobantes - ocupa ambas columnas */}
          <div className="lg:col-span-2">
            <FormSection title="Observación en comprobantes" icon={Receipt}>
              <Input
                label="Texto en el pie del ticket / factura"
                labelPlacement="outside"
                placeholder="Ej: Gracias por tu compra. ¡Volvé pronto!"
                variant="bordered"
                classNames={inputCls}
                value={configuracion.observacionPieFactura}
                onChange={(e) =>
                  setConfiguracion({
                    ...configuracion,
                    observacionPieFactura: e.target.value,
                  })
                }
                startContent={
                  <Receipt size={15} className="text-slate-400 mr-1 shrink-0" />
                }
              />
            </FormSection>
          </div>
        </div>

        {/* Save bar */}
        <div className="flex justify-end pt-6 pb-6">
          <Button
            onPress={handleSave}
            isLoading={isSaving}
            className="bg-linear-to-r from-[#67afc3] to-[#2dd4bf] text-white font-bold px-8 h-11 shadow-lg shadow-[#67afc3]/30 rounded-xl transform transition-all active:scale-95 hover:shadow-xl gap-2"
            startContent={!isSaving && <Save size={16} />}
          >
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  );
}
