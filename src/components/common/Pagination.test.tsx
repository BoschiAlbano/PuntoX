/**
 * Tests para el componente Pagination.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Pagination, { PaginationInfo } from "./Pagination";

vi.mock("@heroui/react", async () => {
  const actual = await vi.importActual("@heroui/react");
  return { ...actual, addToast: vi.fn() };
});

describe("Pagination", () => {
  const mockPagination: PaginationInfo = {
    page: 1,
    limit: 10,
    total: 50,
    totalPages: 5,
    hasNextPage: true,
    hasPreviousPage: false,
  };

  const mockOnPageChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no renderiza cuando total es 0", () => {
    const { container } = render(
      <Pagination
        pagination={{ ...mockPagination, total: 0 }}
        onPageChange={mockOnPageChange}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("muestra información de paginación correcta", () => {
    render(
      <Pagination
        pagination={mockPagination}
        onPageChange={mockOnPageChange}
      />
    );

    expect(screen.getByText(/Mostrando/i)).toBeInTheDocument();
    expect(screen.getByText(/1.*a.*10.*de.*50/i)).toBeInTheDocument();
    expect(screen.getByText(/Página.*1.*de.*5/i)).toBeInTheDocument();
  });

  it("deshabilita botón anterior en primera página", () => {
    render(
      <Pagination
        pagination={{ ...mockPagination, hasPreviousPage: false }}
        onPageChange={mockOnPageChange}
      />
    );

    const prevButton = screen.getByLabelText("Página anterior");
    expect(prevButton).toBeInTheDocument();
    expect(prevButton).toBeDisabled();
  });

  it("deshabilita botón siguiente en última página", () => {
    render(
      <Pagination
        pagination={{
          ...mockPagination,
          page: 5,
          hasNextPage: false,
        }}
        onPageChange={mockOnPageChange}
      />
    );

    const nextButton = screen.getByLabelText("Página siguiente");
    expect(nextButton).toBeInTheDocument();
    expect(nextButton).toBeDisabled();
  });
});
