import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "@/store/useUserStore";

interface DashboardSummaryData {
  todaySales: {
    amount: number;
    transactions: number;
    percentage: number;
  };
  lowStock: {
    count: number;
  };
  monthRevenue: {
    amount: number;
    percentage: number;
  };
  activeClients: {
    count: number;
    percentage: number;
  };
}

interface TopProductsData {
  totalUnidades: number;
  topProducts: Array<{
    id: string;
    name: string;
    uds: number;
    pct: number;
    imageUrl: string;
  }>;
}

interface PaymentMethodsData {
  totalTransacciones: number;
  paymentMethods: Array<{
    name: string;
    pct: number;
    money: number;
    count: number;
  }>;
}

interface LowStockData {
  totalCount: number;
  lowStockItems: Array<{
    id: string;
    name: string;
    barcode: string;
    stock: number;
    minStock: number;
    branch: string;
  }>;
}

const fetchDashboardSummary = async (signal?: AbortSignal): Promise<DashboardSummaryData> => {
  const response = await fetch("/api/dashboard/summary", { signal });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Error al cargar el resumen del dashboard");
  }
  
  return response.json();
};

const fetchTopProducts = async (signal?: AbortSignal): Promise<TopProductsData> => {
  const response = await fetch("/api/dashboard/top-products", { signal });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Error al cargar productos más vendidos");
  }
  
  return response.json();
};

const fetchPaymentMethods = async (signal?: AbortSignal): Promise<PaymentMethodsData> => {
  const response = await fetch("/api/dashboard/payment-methods", { signal });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Error al cargar métodos de pago");
  }
  
  return response.json();
};

const fetchLowStock = async (signal?: AbortSignal): Promise<LowStockData> => {
  const response = await fetch("/api/dashboard/low-stock", { signal });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Error al cargar productos con bajo stock");
  }
  
  return response.json();
};

export function useDashboardSummary() {
  const currentBranchId = useUserStore((state) => state.currentBranch?.Id);
  return useQuery({
    queryKey: ["dashboard", "summary", currentBranchId],
    queryFn: ({ signal }) => fetchDashboardSummary(signal),
    refetchInterval: 120000, // 2 minutes
    staleTime: 60000, // 1 minute
  });
}

export function useTopProducts() {
  const currentBranchId = useUserStore((state) => state.currentBranch?.Id);
  return useQuery({
    queryKey: ["dashboard", "top-products", currentBranchId],
    queryFn: ({ signal }) => fetchTopProducts(signal),
    refetchInterval: 120000, // 2 minutes
    staleTime: 60000, // 1 minute
  });
}

export function usePaymentMethods() {
  const currentBranchId = useUserStore((state) => state.currentBranch?.Id);
  return useQuery({
    queryKey: ["dashboard", "payment-methods", currentBranchId],
    queryFn: ({ signal }) => fetchPaymentMethods(signal),
    refetchInterval: 120000, // 2 minutes
    staleTime: 60000, // 1 minute
  });
}

export function useLowStock() {
  const currentBranchId = useUserStore((state) => state.currentBranch?.Id);
  return useQuery({
    queryKey: ["dashboard", "low-stock", currentBranchId],
    queryFn: ({ signal }) => fetchLowStock(signal),
    refetchInterval: 120000, // 2 minutes
    staleTime: 60000, // 1 minute
  });
}
