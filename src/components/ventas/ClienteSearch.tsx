"use client";

import React, { useState } from "react";
import {
  Input,
  Button,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Spinner,
} from "@heroui/react";
import { Search, User, UserCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ClienteSearchProps {
  selected: any;
  onSelect: (c: any) => void;
}

function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function ClienteSearch({
  selected,
  onSelect,
}: ClienteSearchProps) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounceValue(searchQuery, 500);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["clientes_ventas", debouncedSearch, page],
    queryFn: async () => {
      const res = await fetch(
        `/api/clientes?q=${debouncedSearch}&page=${page}&limit=5`
      );
      return res.json();
    },
    enabled: isOpen,
  });

  const items = data?.data || [];

  const handleSelect = (client: any) => {
    onSelect(client);
    onClose();
    setSearchQuery("");
  };

  return (
    <>
      <Button
        variant="flat"
        color={selected.Id === 0 ? "default" : "primary"}
        onPress={onOpen}
        className="justify-start min-w-[200px] py-6"
        startContent={
          selected.Id === 0 ? <User size={18} /> : <UserCheck size={18} />
        }
      >
        <div className="flex flex-col items-start leading-tight">
          <span className="text-small font-semibold">
            {selected.Id === 0
              ? "Consumidor Final"
              : selected.Nombre + " " + selected.Apellido}
          </span>
          <span className="text-tiny opacity-75">
            {selected.Id === 0 ? "99999999" : selected.Dni || "Sin DNI"}
          </span>
        </div>
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="3xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Buscar Cliente</ModalHeader>
              <ModalBody>
                <Input
                  autoFocus
                  placeholder="Buscar por Nombre, DNI, Email..."
                  startContent={
                    <Search className="text-default-400" size={18} />
                  }
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  onClear={() => setSearchQuery("")}
                />

                <div className="min-h-[250px]">
                  <Table
                    aria-label="Resultados Clientes"
                    removeWrapper
                    bottomContent={
                      data?.meta && (
                        <div className="flex w-full justify-center">
                          <Pagination
                            isCompact
                            showControls
                            showShadow
                            color="primary"
                            page={page}
                            total={data.meta.totalPages}
                            onChange={setPage}
                          />
                        </div>
                      )
                    }
                  >
                    <TableHeader>
                      <TableColumn>NOMBRE</TableColumn>
                      <TableColumn>DNI</TableColumn>
                      <TableColumn>EMAIL</TableColumn>
                      <TableColumn>ACCION</TableColumn>
                    </TableHeader>
                    <TableBody
                      items={items}
                      loadingContent={<Spinner />}
                      loadingState={
                        isLoading || isFetching ? "loading" : "idle"
                      }
                      emptyContent="No se encontraron clientes"
                    >
                      {(item: any) => (
                        <TableRow key={item.Id}>
                          <TableCell>
                            {item.Nombre + " " + item.Apellido}
                          </TableCell>
                          <TableCell>{item.Dni || "-"}</TableCell>
                          <TableCell>{item.Mail || "-"}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              color="primary"
                              onPress={() => handleSelect(item)}
                            >
                              Seleccionar
                            </Button>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </ModalBody>
              <ModalFooter>
                <div className="flex-1">
                  {/* Quick action to revert to default */}
                  <Button
                    variant="light"
                    onPress={() =>
                      handleSelect({
                        Id: 0,
                        Nombre: "Consumidor Final",
                        Apellido: "Consumidor Final",
                        Dni: "Consumidor Final",
                        Mail: "Consumidor Final",
                      })
                    }
                  >
                    Usar Consumidor Final
                  </Button>
                </div>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
