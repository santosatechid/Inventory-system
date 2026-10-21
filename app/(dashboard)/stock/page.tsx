"use client";

import {
  AlertTriangle,
  Download,
  Package,
  RefreshCw,
  Search,
  Warehouse,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/shell/page-header";
import { EmptyState, StatCard } from "@/components/shell/stat-card";
import { StatusBadge } from "@/components/shell/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useItems, useSuppliers } from "@/hooks/inventory/useItems";
import { downloadCsv } from "@/lib/csv";
import { formatDateTime } from "@/lib/format";
import type { Item } from "@/types/inventory";

function stockStatus(item: Item) {
  if (item.stockGudang === 0) return "EMPTY";
  if (item.stockGudang <= item.minStock) return "LOW";
  return "SAFE";
}

export default function StockPage() {
  const {
    data: items = [],
    isLoading,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useItems({ staleTime: 30 * 1000 });
  const { data: suppliers = [] } = useSuppliers();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [supplierFilter, setSupplierFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))).sort(),
    [items],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        (item.brand ?? "").toLowerCase().includes(query);
      const matchesCategory = category === "ALL" || item.category === category;
      const matchesSupplier =
        supplierFilter === "ALL" || item.supplierId === supplierFilter;
      const matchesStock =
        stockFilter === "ALL" ||
        (stockFilter === "SAFE" && item.stockGudang > item.minStock) ||
        (stockFilter === "LOW" &&
          item.stockGudang > 0 &&
          item.stockGudang <= item.minStock) ||
        (stockFilter === "EMPTY" && item.stockGudang === 0);
      return matchesSearch && matchesCategory && matchesSupplier && matchesStock;
    });
  }, [items, search, category, supplierFilter, stockFilter]);

  const totalGudang = items.reduce((sum, item) => sum + item.stockGudang, 0);
  const totalOperasional = items.reduce(
    (sum, item) => sum + item.stockOperasional,
    0,
  );
  const lowStock = items.filter((item) => item.stockGudang <= item.minStock);

  const exportCsv = () => {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    downloadCsv(
      `stok-inventory-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.csv`,
      [
        ["Tanggal Export", formatDateTime(now)],
        [],
        [
          "Kode",
          "Nama",
          "Kategori",
          "Merek",
          "Ukuran",
          "Satuan",
          "Stok Gudang",
          "Stok Operasional",
          "Stok Minimum",
          "Status",
          "Supplier",
        ],
        ...filtered.map((item) => [
          item.code,
          item.name,
          item.category,
          item.brand ?? "",
          item.size ?? "",
          item.unit,
          item.stockGudang,
          item.stockOperasional,
          item.minStock,
          stockStatus(item) === "EMPTY"
            ? "Habis"
            : stockStatus(item) === "LOW"
              ? "Menipis"
              : "Aman",
          item.supplier?.name ?? "",
        ]),
      ],
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Stok Inventory"
        description="Pantau posisi stok gudang dan operasional seluruh item secara terkini."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={isFetching ? "animate-spin" : undefined} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={exportCsv}
              disabled={filtered.length === 0}
            >
              <Download />
              Ekspor Excel
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Item" value={items.length} icon={Package} />
        <StatCard
          label="Stok Gudang"
          value={totalGudang.toLocaleString("id-ID")}
          icon={Warehouse}
        />
        <StatCard
          label="Stok Operasional"
          value={totalOperasional.toLocaleString("id-ID")}
          icon={Warehouse}
        />
        <StatCard
          label="Di Bawah Minimum"
          value={lowStock.length}
          icon={AlertTriangle}
        >
          <span className="text-muted-foreground text-[11px]">
            {lowStock.filter((item) => item.stockGudang === 0).length} item
            habis
          </span>
        </StatCard>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <div className="border-border flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border px-3">
          <Search className="text-muted-foreground size-3.5" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama, kode, atau merek item…"
            className="h-9 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-9 w-full text-xs sm:w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua kategori</SelectItem>
            {categories.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={supplierFilter} onValueChange={setSupplierFilter}>
          <SelectTrigger className="h-9 w-full text-xs sm:w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua supplier</SelectItem>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="h-9 w-full text-xs sm:w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua stok</SelectItem>
            <SelectItem value="SAFE">Aman</SelectItem>
            <SelectItem value="LOW">Menipis</SelectItem>
            <SelectItem value="EMPTY">Habis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border-border overflow-x-auto rounded-xl border">
        {isLoading ? (
          <div className="p-6 text-sm">Memuat stok…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Tidak ada item"
            description="Ubah pencarian atau filter untuk melihat item lain."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="w-24">Kode</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="w-28">Kategori</TableHead>
                <TableHead className="w-20">Gudang</TableHead>
                <TableHead className="w-28">Operasional</TableHead>
                <TableHead className="w-20">Minimum</TableHead>
                <TableHead className="w-28">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-xs font-medium">
                    {item.code}
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-medium">{item.name}</p>
                    <p className="text-muted-foreground text-[10.5px]">
                      {item.brand ?? "—"} ·{" "}
                      {item.supplier?.name ?? "Tanpa supplier"}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {item.category}
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {item.stockGudang} {item.unit}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {item.stockOperasional} {item.unit}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {item.minStock}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={stockStatus(item)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
        <span>
          Menampilkan {filtered.length} dari {items.length} item.
        </span>
        <span>
          Diperbarui:{" "}
          {dataUpdatedAt ? formatDateTime(new Date(dataUpdatedAt)) : "—"}
        </span>
      </div>
    </div>
  );
}
