"use client";

import { CheckCheck, RotateCcw, Search, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shell/page-header";
import { DateRangePicker } from "@/components/common/date-range-picker";
import { EmptyState, StatCard } from "@/components/shell/stat-card";
import { StatusBadge } from "@/components/shell/status-badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useDeliveryNotes } from "@/hooks/inventory/useDeliveryNotes";
import {
  useCreateTurnover,
  useTurnovers,
  useVerifyTurnover,
} from "@/hooks/inventory/useTurnovers";
import { formatDate, inRange } from "@/lib/format";
import { authClient } from "@/services/auth/authClients";

export default function TurnoverPage() {
  const { data: notes = [] } = useDeliveryNotes();
  const { data: turnovers = [] } = useTurnovers();
  const createTurnover = useCreateTurnover();
  const verifyTurnover = useVerifyTurnover();
  const { data: session } = authClient.useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "ADMIN";

  const [noteId, setNoteId] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [values, setValues] = useState<
    Record<string, { used: string; returned: string; damaged: string }>
  >({});

  const available = notes.filter(
    (row) => row.status === "CONFIRMED" && !row.turnover,
  );
  const selected = available.find((row) => row.id === noteId);
  const pending = turnovers.filter((row) => row.status === "SUBMITTED");

  const query = search.trim().toLowerCase();
  const filtered = turnovers.filter((row) => {
    const matchesSearch =
      !query ||
      row.deliveryNote.number.toLowerCase().includes(query) ||
      row.deliveryNote.request.site.toLowerCase().includes(query) ||
      row.deliveryNote.request.leader.name.toLowerCase().includes(query) ||
      (row.deliveryNote.request.customer ?? "")
        .toLowerCase()
        .includes(query) ||
      row.submittedBy.name.toLowerCase().includes(query);
    return (
      matchesSearch &&
      (statusFilter === "ALL" || row.status === statusFilter) &&
      inRange(row.submittedAt, dateFrom, dateTo)
    );
  });

  function valueFor(itemId: string) {
    return values[itemId] ?? { used: "0", returned: "0", damaged: "0" };
  }

  async function submit() {
    if (!selected) {
      toast.error("Pilih surat jalan yang sudah dikonfirmasi.");
      return;
    }

    const rows = selected.items.map((row) => {
      const value = valueFor(row.itemId);
      return {
        itemId: row.itemId,
        brought: row.qty,
        used: Number(value.used || 0),
        returned: Number(value.returned || 0),
        damaged: Number(value.damaged || 0),
      };
    });

    if (
      rows.some(
        (row) => row.used + row.returned + row.damaged !== row.brought,
      )
    ) {
      toast.error(
        "Terpakai + kembali + rusak harus sama dengan jumlah dibawa.",
      );
      return;
    }

    await createTurnover.mutateAsync({
      deliveryNoteId: selected.id,
      note: note || undefined,
      items: rows,
    });
    toast.success("Laporan turnover dikirim ke Admin.");
    setNoteId("");
    setNote("");
    setValues({});
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Turnover Barang"
        description="Laporkan barang terpakai, sisa yang dikembalikan, serta barang rusak atau hilang setelah inspeksi."
        actions={
          !isAdmin ? (
            <Button onClick={submit} disabled={createTurnover.isPending}>
              <Send />
              {createTurnover.isPending ? "Mengirim…" : "Kirim Laporan"}
            </Button>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Menunggu Turnover"
          value={`${available.length} surat jalan`}
          icon={RotateCcw}
        />
        <StatCard
          label="Menunggu Verifikasi"
          value={`${pending.length} laporan`}
          icon={Send}
        />
        <StatCard
          label="Terverifikasi"
          value={`${turnovers.filter((row) => row.status === "VERIFIED").length} laporan`}
          icon={CheckCheck}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          {!isAdmin ? (
            <div className="bg-card border-border flex flex-col gap-3 rounded-xl border p-4">
              <div>
                <p className="text-[13.5px] font-semibold">Rincian Pemakaian</p>
                <p className="text-muted-foreground text-[11.5px]">
                  Pilih surat jalan, lalu isi jumlah terpakai, kembali, dan
                  rusak/hilang.
                </p>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-[11.5px]">Surat jalan</Label>
                <Select
                  value={noteId}
                  onValueChange={(value) => {
                    setNoteId(value);
                    setValues({});
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih surat jalan terkonfirmasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {row.number} · {row.request.site} ·{" "}
                        {row.request.leader.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {available.length === 0 ? (
                  <p className="text-muted-foreground text-[10.5px]">
                    Belum ada surat jalan yang siap di-turnover.
                  </p>
                ) : null}
              </div>

              {selected ? (
                <>
                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="w-20">Dibawa</TableHead>
                          <TableHead className="w-24">Terpakai</TableHead>
                          <TableHead className="w-24">Kembali</TableHead>
                          <TableHead className="w-24">Rusak</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selected.items.map((row) => {
                          const value = valueFor(row.itemId);
                          return (
                            <TableRow key={row.id}>
                              <TableCell>
                                <p className="text-xs font-medium">
                                  {row.item.name}
                                </p>
                                <p className="text-muted-foreground text-[10.5px]">
                                  {row.qty} {row.item.unit}
                                </p>
                              </TableCell>
                              <TableCell className="text-xs font-medium">
                                {row.qty}
                              </TableCell>
                              {(["used", "returned", "damaged"] as const).map(
                                (field) => (
                                  <TableCell key={field}>
                                    <Input
                                      type="number"
                                      min={0}
                                      max={row.qty}
                                      className="h-8"
                                      value={value[field]}
                                      onChange={(event) =>
                                        setValues((current) => ({
                                          ...current,
                                          [row.itemId]: {
                                            ...value,
                                            [field]: event.target.value,
                                          },
                                        }))
                                      }
                                    />
                                  </TableCell>
                                ),
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-[11.5px]">Catatan Leader</Label>
                    <Textarea
                      rows={2}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Contoh: 1 box rusak karena terkena air saat pengujian."
                    />
                  </div>

                  <p className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-[10.5px]">
                    Aturan: terpakai + kembali + rusak/hilang harus sama dengan
                    jumlah dibawa. Sisa barang wajib dikembalikan ke gudang.
                  </p>
                </>
              ) : null}
            </div>
          ) : (
            <div className="bg-card border-border flex flex-col gap-3 rounded-xl border p-4">
              <div>
                <p className="text-[13.5px] font-semibold">
                  Verifikasi Turnover
                </p>
                <p className="text-muted-foreground text-[11.5px]">
                  Periksa laporan Leader sebelum menyesuaikan stok.
                </p>
              </div>

              {pending.length === 0 ? (
                <EmptyState
                  title="Tidak ada laporan menunggu"
                  description="Turnover dari Leader akan tampil di sini."
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {pending.map((row) => (
                    <div
                      key={row.id}
                      className="border-border flex flex-col gap-2 rounded-lg border p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium">
                            {row.deliveryNote.number}
                          </p>
                          <p className="text-muted-foreground text-[10.5px]">
                            {row.deliveryNote.request.site} ·{" "}
                            {row.submittedBy.name} ·{" "}
                            {formatDate(row.submittedAt)}
                          </p>
                        </div>
                        <StatusBadge status={row.status} />
                      </div>
                      <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-[10.5px]">
                        {row.items.map((item) => (
                          <span key={item.id}>
                            {item.item.name}: {item.used} dipakai ·{" "}
                            {item.returned} kembali · {item.damaged} rusak
                          </span>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        className="w-fit"
                        onClick={async () => {
                          await verifyTurnover.mutateAsync(row.id);
                          toast.success(
                            "Turnover diverifikasi. Stok telah disesuaikan.",
                          );
                        }}
                        disabled={verifyTurnover.isPending}
                      >
                        <CheckCheck />
                        Verifikasi &amp; Perbarui Stok
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-card border-border flex flex-col gap-3 rounded-xl border p-4">
            <p className="text-[13.5px] font-semibold">Riwayat Turnover</p>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <div className="border-border flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border px-3">
                <Search className="text-muted-foreground size-3.5" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari surat jalan, site, leader, pelanggan, atau pengirim…"
                  className="h-9 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-full text-xs sm:w-[170px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SUBMITTED">Menunggu Verifikasi</SelectItem>
                  <SelectItem value="VERIFIED">Terverifikasi</SelectItem>
                </SelectContent>
              </Select>
              <DateRangePicker
                from={dateFrom}
                to={dateTo}
                onChange={({ from, to }) => {
                  setDateFrom(from);
                  setDateTo(to);
                }}
                className="w-full sm:w-[250px]"
              />
            </div>

            {filtered.length === 0 ? (
              <EmptyState title="Belum ada turnover" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Surat Jalan</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Leader</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-xs font-medium">
                        {row.deliveryNote.number}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {row.deliveryNote.request.site}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {row.submittedBy.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(row.submittedAt)}
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
        </div>

        <div className="flex h-fit flex-col gap-4">
          <div className="bg-card border-border flex flex-col gap-2 rounded-xl border p-4">
            <p className="text-[13.5px] font-semibold">Dampak ke Stok</p>
            <p className="text-muted-foreground text-[11.5px]">
              Dihitung otomatis saat Admin memverifikasi.
            </p>
            <div className="text-muted-foreground flex justify-between border-b py-1.5 text-[11px]">
              <span>Terpakai</span>
              <span className="text-foreground font-medium">
                keluar dari operasional
              </span>
            </div>
            <div className="text-muted-foreground flex justify-between border-b py-1.5 text-[11px]">
              <span>Kembali</span>
              <span className="text-foreground font-medium">
                masuk ke gudang
              </span>
            </div>
            <div className="text-muted-foreground flex justify-between py-1.5 text-[11px]">
              <span>Rusak / hilang</span>
              <span className="text-foreground font-medium">
                dicatat sebagai kerugian
              </span>
            </div>
          </div>

          <div className="bg-muted flex flex-col gap-2 rounded-xl p-4">
            <p className="text-[11.5px] font-semibold">Aturan Pengisian</p>
            {[
              "Terpakai + kembali + rusak/hilang = jumlah dibawa.",
              "Sisa barang wajib dikembalikan ke gudang.",
              "Barang rusak atau hilang dicatat terpisah.",
            ].map((text) => (
              <p
                key={text}
                className="text-muted-foreground text-[10.5px] leading-4"
              >
                • {text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
