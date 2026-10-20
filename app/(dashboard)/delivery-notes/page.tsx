"use client";

import { Check, Download, FilePlus, Printer, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shell/page-header";
import { EmptyState, StatCard } from "@/components/shell/stat-card";
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
import {
  useConfirmDeliveryNote,
  useCreateDeliveryNote,
  useDeliveryNotes,
} from "@/hooks/inventory/useDeliveryNotes";
import { useRequests } from "@/hooks/inventory/useRequests";
import { downloadCsv } from "@/lib/csv";
import { formatDate } from "@/lib/format";
import { authClient } from "@/services/auth/authClients";

export default function DeliveryNotesPage() {
  const { data: rows = [] } = useDeliveryNotes();
  const { data: requests = [] } = useRequests();
  const createNote = useCreateDeliveryNote();
  const confirmNote = useConfirmDeliveryNote();
  const { data: session } = authClient.useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "ADMIN";

  const [selectedId, setSelectedId] = useState("");
  const [issueOpen, setIssueOpen] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [vehicle, setVehicle] = useState("");

  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];
  const approved = requests.filter(
    (row) => row.status === "APPROVED" && !row.delivery,
  );

  async function issue() {
    if (!requestId) {
      toast.error("Pilih request yang disetujui.");
      return;
    }
    await createNote.mutateAsync({ requestId, vehicle: vehicle || undefined });
    toast.success("Surat jalan diterbitkan.");
    setIssueOpen(false);
    setRequestId("");
    setVehicle("");
  }

  async function confirmSelected() {
    if (!selected) return;
    await confirmNote.mutateAsync(selected.id);
    toast.success("Barang keluar dikonfirmasi. Stok gudang berkurang.");
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Surat Jalan"
        description="Terbitkan surat jalan untuk request yang disetujui, lalu konfirmasi barang keluar gudang."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
            >
              <Printer />
              Cetak
            </Button>
            {isAdmin ? (
              <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <FilePlus />
                    Terbitkan Surat Jalan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Terbitkan surat jalan</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3">
                    <div className="grid gap-1.5">
                      <Label className="text-[11.5px]">
                        Request yang disetujui
                      </Label>
                      <Select value={requestId} onValueChange={setRequestId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih request" />
                        </SelectTrigger>
                        <SelectContent>
                          {approved.map((row) => (
                            <SelectItem key={row.id} value={row.id}>
                              {row.number} · {row.site} · {row.leader.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {approved.length === 0 ? (
                        <p className="text-muted-foreground text-[10.5px]">
                          Belum ada request disetujui tanpa surat jalan.
                        </p>
                      ) : null}
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-[11.5px]">
                        Kendaraan / pengiriman
                      </Label>
                      <Input
                        value={vehicle}
                        placeholder="Dibawa Leader / B 1234 XYZ"
                        onChange={(event) => setVehicle(event.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIssueOpen(false)}>
                      Batal
                    </Button>
                    <Button
                      onClick={issue}
                      disabled={createNote.isPending || approved.length === 0}
                    >
                      Terbitkan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : null}
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Surat Jalan"
          value={`${rows.length} dokumen`}
          icon={FilePlus}
        />
        <StatCard
          label="Barang di Operasional"
          value={`${rows
            .filter((row) => row.status === "CONFIRMED")
            .reduce(
              (sum, row) =>
                sum + row.items.reduce((s, item) => s + item.qty, 0),
              0,
            )} unit`}
          icon={Truck}
        />
        <StatCard
          label="Menunggu Konfirmasi"
          value={`${rows.filter((row) => row.status === "ISSUED").length} dokumen`}
          icon={Check}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="bg-card border-border flex flex-col gap-3 rounded-xl border p-4">
          <div>
            <p className="text-[13.5px] font-semibold">Daftar Surat Jalan</p>
            <p className="text-muted-foreground text-[11.5px]">
              Klik baris untuk melihat detail.
            </p>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              title="Belum ada surat jalan"
              description="Terbitkan dari request yang telah disetujui Direktur."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(row.id)}
                  >
                    <TableCell>
                      <p className="text-xs font-medium">{row.number}</p>
                      <p className="text-muted-foreground text-[10.5px]">
                        {row.request.jobNo}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDate(row.issuedAt)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.request.leader.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {row.request.site}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {row.items.reduce((sum, item) => sum + item.qty, 0)} unit
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {selected ? (
          <div className="bg-card border-border flex h-fit flex-col gap-3 rounded-xl border p-4">
            <div>
              <p className="text-[13.5px] font-semibold">{selected.number}</p>
              <p className="text-muted-foreground text-[11.5px]">
                Diterbitkan {formatDate(selected.issuedAt)} ·{" "}
                {selected.createdBy.name}
              </p>
            </div>

            <div className="border-border flex flex-col gap-2 rounded-lg border p-3 text-[11px]">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Pekerjaan</span>
                <span className="text-right font-medium">
                  {selected.request.jobNo} · {selected.request.site}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Leader</span>
                <span className="font-medium">
                  {selected.request.leader.name}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Kendaraan</span>
                <span className="text-right font-medium">
                  {selected.vehicle ?? "Dibawa Leader"}
                </span>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="w-24">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selected.items.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <p className="text-xs font-medium">{row.item.name}</p>
                        <p className="text-muted-foreground text-[10.5px]">
                          {row.item.code}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {row.qty} {row.item.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="bg-muted flex flex-col gap-1.5 rounded-lg p-3 text-[11px]">
              <p className="text-muted-foreground text-[10.5px] font-semibold">
                Dampak stok setelah konfirmasi
              </p>
              {selected.items.map((row) => (
                <div key={row.id} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">
                    {row.item.name}
                  </span>
                  <span className="text-right font-medium">
                    {row.item.stockGudang} →{" "}
                    {row.item.stockGudang - row.qty} {row.item.unit}
                  </span>
                </div>
              ))}
            </div>

            {isAdmin && selected.status === "ISSUED" ? (
              <Button
                onClick={confirmSelected}
                disabled={confirmNote.isPending}
              >
                <Check />
                Konfirmasi Barang Keluar
              </Button>
            ) : null}

            <Button
              variant="outline"
              onClick={() =>
                downloadCsv(`${selected.number}.csv`, [
                  ["Item", "Jumlah", "Satuan"],
                  ...selected.items.map((row) => [
                    row.item.name,
                    row.qty,
                    row.item.unit,
                  ]),
                ])
              }
            >
              <Download />
              Unduh Surat Jalan
            </Button>
          </div>
        ) : null}
      </div>

      <div className="bg-muted text-muted-foreground flex items-center gap-2 rounded-xl px-4 py-3 text-[11.5px]">
        <Truck className="size-4 shrink-0" />
        Saat konfirmasi: stok gudang berkurang dan stok operasional bertambah.
        Saldo berubah hanya pada langkah ini.
      </div>
    </div>
  );
}
