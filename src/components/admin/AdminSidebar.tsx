"use client";
import { useState, useEffect, memo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Shield,
  ImageIcon,
} from "lucide-react";
import {
  SidebarBrand,
  SidebarFooter,
  SidebarFrame,
  SidebarNav,
  type SidebarMenuSection,
} from "@/components/shell/SidebarParts";

type MenuSection = SidebarMenuSection;

interface AdminSidebarProps {
  isCollapsed: boolean;
  onClose?: () => void;
}

const menuSections: MenuSection[] = [
  {
    title: "Principal",
    items: [
      {
        icon: <LayoutDashboard className="w-5 h-5" />,
        label: "Dashboard",
        href: "/admin/dashboard",
      },
    ],
  },
  {
    title: "Gestión",
    items: [
      {
        icon: <Building2 className="w-5 h-5" />,
        label: "Tiendas",
        href: "/admin/tenants",
      },
      {
        icon: <CreditCard className="w-5 h-5" />,
        label: "Planes SaaS",
        href: "/admin/planes",
      },
      {
        icon: <ImageIcon className="w-5 h-5" />,
        label: "Imágenes (Caché)",
        href: "/admin/imagenes-cache",
      },
    ],
  },
  {
    title: "Plataforma",
    items: [
      {
        icon: <Shield className="w-5 h-5" />,
        label: "Auditoría",
        href: "/admin/auditoria",
      },
    ],
  },
];

function AdminSidebarComponent({ isCollapsed, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [openSection, setOpenSection] = useState<string | null>("Principal");

  const toggleSection = useCallback((title: string) => {
    setOpenSection((prev) => (prev === title ? null : title));
  }, []);

  // Activo también en subrutas (ej. /admin/tenants/4 marca "Tiendas")
  const isActive = useCallback(
    (href: string) => pathname === href || pathname.startsWith(href + "/"),
    [pathname],
  );

  // Auto-expand section that contains the active route
  useEffect(() => {
    const activeSection = menuSections.find((section) =>
      section.items.some((item) => isActive(item.href)),
    );
    if (activeSection && openSection !== activeSection.title) {
      setOpenSection(activeSection.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Prefetch all routes
  useEffect(() => {
    menuSections.forEach((section) => {
      section.items.forEach((item) => {
        router.prefetch(item.href);
      });
    });
  }, [router]);

  // Mismo aspecto que el sidebar de las tiendas (components/shell/SidebarParts)
  return (
    <SidebarFrame isCollapsed={isCollapsed}>
      <SidebarBrand subtitle="Super Admin" isCollapsed={isCollapsed} />

      <SidebarNav
        sections={menuSections}
        isCollapsed={isCollapsed}
        openSection={openSection}
        onToggleSection={toggleSection}
        isActive={isActive}
        onNavigate={() => {
          if (window.innerWidth < 768 && onClose) onClose();
        }}
      />

      <SidebarFooter isCollapsed={isCollapsed} />
    </SidebarFrame>
  );
}

const AdminSidebar = memo(AdminSidebarComponent);
export default AdminSidebar;
