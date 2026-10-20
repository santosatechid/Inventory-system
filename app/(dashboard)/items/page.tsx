"use client";

import { AlertTriangle, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/stat-card";
import { StatusBadge } from "@/components/shell/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateItem,
  useCreateSupplier,
  useItems,
  useSuppliers,
  useUpdateItem,
} from "@/hooks/inventory/useItems";

const EMPTY_ITEM = {
  code: "",
  name: "",
  category: "Film",
  brand: "",
  size: "",
  unit: "box",
  stockGudang: "0",
  minStock: "0",
  supplierId: "",
};

const EMPTY_SUPPLIER = {
  name: "",
  contact: "",
  phone: "",
  email: "",
  address: "",
};

export default function ItemsPage() {
  const { data: items = [], isLoading } = useItems();
  const { data: suppliers = [] } = useSuppliers();
  const createItem = useCreateItem();
  const createSupplier = useCreateSupplier();
  const updateItem = useUpdateItem();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [supplierForm, setSupplierForm] = useState(EMPTY_SUPPLIER);
  const [itemOpen, setItemOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [minStock, setMinStock] = useState<Record<string, string>>({});

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))).sort(),
    [items],
  );

  const filtered = items.filter((item) => {
    const query = search.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.code.toLowerCase().includes(query) ||
      (item.brand ?? "").toLowerCase().includes(query);
    return (
      matchesSearch && (category === "ALL" || item.category === category)
    );
  });

  const lowStock = items.filter((item) => item.stockGudang <= item.minStock);

  const submitItem = async () => {
    if (!itemForm.code || !itemForm.name || !itemForm.unit) {
      toast.error("Kode, nama, dan satuan wajib diisi.");
      return;
    }
    await createItem.mutateAsync({
      ...itemForm,
      stockGudang: Number(itemForm.stockGudang),
      minStock: Number(itemForm.minStock),
      supplierId: itemForm.supplierId || null,
    });
    toast.success("Item ditambahkan.");
    setItemForm(EMPTY_ITEM);
    setItemOpen(false);
  };

  const submitSupplier = async () => {
    if (!supplierForm.name) {
      toast.error("Nama supplier wajib diisi.");
      return;
    }
    await createSupplier.mutateAsync(supplierForm);
    toast.success("Supplier ditambahkan.");
    setSupplierForm(EMPTY_SUPPLIER);
    setSupplierOpen(false);
  };

  const saveAlerts = async () => {
    const changed = items.filter(
      (item) =>
        minStock[item.id] !== undefined &&
        Number(minStock[item.id]) !== item.minStock,
    );
    for (const item of changed) {
      await updateItem.mutateAsync({
        id: item.id,
        code: item.code,
        name: item.name,
        category: item.category,
        brand: item.brand ?? "",
        size: item.size ?? "",
        unit: item.unit,
        minStock: Number(minStock[item.id]),
        supplierId: item.supplierId,
      });
    }
    toast.success(`${changed.length} batas minimum diperbarui.`);
    setAlertOpen(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Master Item & Supplier"
        description="Daftar consumable, kategori, dan supplier yang dipakai pekerjaan inspeksi."
        actions={
          <>
            <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal />
                  Atur Alert
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Atur batas stok minimum</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">
                          {item.name}
                        </p>
                        <p className="text-muted-foreground text-[10.5px]">
                          {item.code} · stok {item.stockGudang} {item.unit}
                        </p>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        className="h-8 w-24"
                        value={minStock[item.id] ?? String(item.minStock)}
                        onChange={(event) =>
                          setMinStock((current) => ({
                            ...current,
                            [item.id]: event.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAlertOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={saveAlerts} disabled={updateItem.isPending}>
                    Simpan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={supplierOpen} onOpenChange={setSupplierOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus />
                  Tambah Supplier
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah supplier</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label>Nama supplier</Label>
                    <Input
                      value={supplierForm.name}
                      onChange={(event) =>
                        setSupplierForm({
                          ...supplierForm,
                          name: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label>Kontak</Label>
                      <Input
                        value={supplierForm.contact}
                        onChange={(event) =>
                          setSupplierForm({
                            ...supplierForm,
                            contact: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Telepon</Label>
                      <Input
                        value={supplierForm.phone}
                        onChange={(event) =>
                          setSupplierForm({
                            ...supplierForm,
                            phone: event.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={supplierForm.email}
                      onChange={(event) =>
                        setSupplierForm({
                          ...supplierForm,
                          email: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Alamat</Label>
                    <Textarea
                      rows={2}
                      value={supplierForm.address}
                      onChange={(event) =>
                        setSupplierForm({
                          ...supplierForm,
                          address: event.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setSupplierOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={submitSupplier}
                    disabled={createSupplier.isPending}
                  >
                    Simpan Supplier
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={itemOpen} onOpenChange={setItemOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus />
                  Tambah Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Tambah item consumable</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Kode</Label>
                    <Input
                      value={itemForm.code}
                      placeholder="FILM-004"
                      onChange={(event) =>
                        setItemForm({ ...itemForm, code: event.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Kategori</Label>
                    <Select
                      value={itemForm.category}
                      onValueChange={(value) =>
                        setItemForm({ ...itemForm, category: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Film", "Chemical", "Penetrant", "APD", "Lainnya"].map(
                          (value) => (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 grid gap-1.5">
                    <Label>Nama item</Label>
                    <Input
                      value={itemForm.name}
                      onChange={(event) =>
                        setItemForm({ ...itemForm, name: event.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Merek</Label>
                    <Input
                      value={itemForm.brand}
                      onChange={(event) =>
                        setItemForm({ ...itemForm, brand: event.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Ukuran</Label>
                    <Input
                      value={itemForm.size}
                      placeholder="30x40 cm"
                      onChange={(event) =>
                        setItemForm({ ...itemForm, size: event.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Satuan</Label>
                    <Input
                      value={itemForm.unit}
                      onChange={(event) =>
                        setItemForm({ ...itemForm, unit: event.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Supplier</Label>
                    <Select
                      value={itemForm.supplierId || "NONE"}
                      onValueChange={(value) =>
                        setItemForm({
                          ...itemForm,
                          supplierId: value === "NONE" ? "" : value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Tanpa supplier</SelectItem>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Stok awal</Label>
                    <Input
                      type="number"
                      min={0}
                      value={itemForm.stockGudang}
                      onChange={(event) =>
                        setItemForm({
                          ...itemForm,
                          stockGudang: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Stok minimum</Label>
                    <Input
                      type="number"
                      min={0}
                      value={itemForm.minStock}
                      onChange={(event) =>
                        setItemForm({
                          ...itemForm,
                          minStock: event.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setItemOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={submitItem} disabled={createItem.isPending}>
                    Simpan Item
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <Tabs defaultValue="items" className="gap-4">
        <TabsList className="h-auto flex-wrap justify-start gap-1 rounded-none bg-transparent p-0">
          {[
            ["items", "Item", items.length],
            ["suppliers", "Supplier", suppliers.length],
          ].map(([value, label, count]) => (
            <TabsTrigger
              key={String(value)}
              value={String(value)}
              className="data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground rounded-none border-0 border-b-2 border-transparent px-1 pb-2.5 text-[12.5px] data-[state=active]:border-foreground data-[state=active]:shadow-none"
            >
              {label}
              <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10.5px]">
                {count}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="items" className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="border-border flex flex-1 items-center gap-2 rounded-lg border px-3">
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
          </div>

          {lowStock.length > 0 ? (
            <div className="bg-warning-surface border-warning-border flex items-center gap-3 rounded-lg border px-4 py-2.5">
              <AlertTriangle className="text-warning size-4 shrink-0" />
              <p className="text-warning text-[11.5px]">
                <span className="font-semibold">
                  {lowStock.length} item di bawah stok minimum
                </span>{" "}
                · {lowStock.filter((item) => item.stockGudang === 0).length} item
                habis. Alert otomatis muncul saat stok ≤ batas minimum.
              </p>
            </div>
          ) : null}

          <div className="bg-card border-border overflow-hidden rounded-xl border">
            {isLoading ? (
              <div className="p-6 text-sm">Memuat item…</div>
            ) : filtered.length === 0 ? (
              <EmptyState title="Tidak ada item" description="Ubah filter atau tambah item baru." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60">
                    <TableHead className="w-24">Kode</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="w-28">Kategori</TableHead>
                    <TableHead className="w-24">Ukuran</TableHead>
                    <TableHead className="w-20">Satuan</TableHead>
                    <TableHead className="w-20">Stok</TableHead>
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
                          {item.brand ?? "—"} · {item.supplier?.name ?? "Tanpa supplier"}
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {item.category}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {item.size ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {item.unit}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {item.stockGudang}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {item.minStock}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={
                            item.stockGudang === 0
                              ? "EMPTY"
                              : item.stockGudang <= item.minStock
                                ? "LOW"
                                : "SAFE"
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <p className="text-muted-foreground text-[11.5px]">
            Menampilkan {filtered.length} dari {items.length} item.
          </p>
        </TabsContent>

        <TabsContent value="suppliers" className="flex flex-col gap-3">
          <div className="bg-card border-border overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead>Supplier</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-24">Item</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="text-xs font-medium">
                      {supplier.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {supplier.contact ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {supplier.phone ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {supplier.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {supplier._count?.items ?? 0}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={supplier.isActive ? "SAFE" : "DRAFT"}
                        label={supplier.isActive ? "Aktif" : "Nonaktif"}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
