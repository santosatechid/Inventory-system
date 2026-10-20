"use client";

import {
  CalendarDays,
  Download,
  FileSpreadsheet,
  Inbox,
  RotateCcw,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/shell/page-header";
import { StatusBadge } from "@/components/shell/status-badge";
import { Button } from "@/components/ui/button";
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
import { useDeliveryNotes } from "@/hooks/inventory/useDeliveryNotes";
import { useIncoming } from "@/hooks/inventory/useIncoming";
import { useTurnovers } from "@/hooks/inventory/useTurnovers";
import { downloadCsv } from "@/lib/csv";
import { formatDate } from "@/lib/format";

function monthKey(value: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function ReportsPage() {
  const { data: incoming = [] } = useIncoming();
  const { data: notes = [] } = useDeliveryNotes();
  const { data: turnovers = [] } = useTurnovers();
  const [period, setPeriod] = useState(monthKey(new Date()));

  const periods = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return {
        value,
        label: new Intl.DateTimeFormat("id-ID", {
          month: "long",
          year: "numeric",
        }).format(date),
      };
    });
  }, []);

  const incomingRows = incoming.filter(
    (row) => monthKey(row.receivedAt) === period,
  );
  const outgoingRows = notes.filter(
    (row) => monthKey(row.confirmedAt ?? row.issuedAt) === period,
  );
  const turnoverRows = turnovers.filter(
    (row) => monthKey(row.submittedAt) === period,
  );

  const incomingQty = incomingRows.reduce(
    (sum, row) => sum + row.items.reduce((s, item) => s + item.qty, 0),
    0,
  );
  const outgoingQty = outgoingRows.reduce(
    (sum, row) => sum + row.items.reduce((s, item) => s + item.qty, 0),
    0,
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Laporan"
        description="Unduh laporan bulanan sesuai template Excel PT Luindo Prima."
        actions={
          <Button
            size="sm"
            onClick={() =>
              downloadCsv(`laporan-barang-keluar-${period}.csv`, [
                [
                  "Tanggal",
                  "No. Surat Jalan",
                  "Pekerjaan",
                  "Site",
                  "Leader",
                  "Item",
                  "Jumlah",
                  "Status",
                ],
                ...outgoingRows.flatMap((row) =>
                  row.items.map((item) => [
                    formatDate(row.confirmedAt ?? row.issuedAt),
                    row.number,
                    row.request.jobNo,
                    row.request.site,
                    row.request.leader.name,
                    item.item.name,
                    item.qty,
                    row.status,
                  ]),
                ),
              ])
            }
          >
            <Download />
            Ekspor Excel
          </Button>
        }
      />

      <div className="bg-card border-border flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <span className="text-muted-foreground text-[11px] font-medium">
            Periode
          </span>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full">
              <span className="flex items-center gap-2">
                <CalendarDays className="text-muted-foreground size-3.5" />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              {periods.map((row) => (
                <SelectItem key={row.value} value={row.value}>
                  {row.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
          <FileSpreadsheet className="size-3.5" />
          Format kolom mengikuti template perusahaan.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {[
          {
            icon: Inbox,
            title: "Laporan Barang Masuk",
            value: `${incomingRows.length} dokumen · ${incomingQty} unit`,
            description: "Tanggal, supplier, item, jumlah, dan Admin penerima.",
            rows: [
              ["Tanggal", "Nomor", "Supplier", "Item", "Jumlah", "Admin"],
              ...incomingRows.map((row) => [
                formatDate(row.receivedAt),
                row.number,
                row.supplier.name,
                row.items.map((item) => item.item.name).join(", "),
                row.items.reduce((s, item) => s + item.qty, 0),
                row.createdBy.name,
              ]),
            ],
          },
          {
            icon: Truck,
            title: "Laporan Barang Keluar",
            value: `${outgoingRows.length} surat jalan · ${outgoingQty} unit`,
            description:
              "Nomor surat jalan, pekerjaan/site, Leader, item, jumlah.",
            rows: [
              [
                "Tanggal",
                "No. Surat Jalan",
                "Pekerjaan",
                "Site",
                "Leader",
                "Item",
                "Jumlah",
                "Status",
              ],
              ...outgoingRows.map((row) => [
                formatDate(row.confirmedAt ?? row.issuedAt),
                row.number,
                row.request.jobNo,
                row.request.site,
                row.request.leader.name,
                row.items.map((item) => item.item.name).join(", "),
                row.items.reduce((s, item) => s + item.qty, 0),
                row.status,
              ]),
            ],
          },
          {
            icon: RotateCcw,
            title: "Laporan Turnover",
            value: `${turnoverRows.length} laporan`,
            description:
              "Jumlah keluar, terpakai, dikembalikan, rusak/hilang, status.",
            rows: [
              [
                "Tanggal",
                "Surat Jalan",
                "Leader",
                "Item",
                "Dipakai",
                "Kembali",
                "Rusak",
                "Status",
              ],
              ...turnoverRows.flatMap((row) =>
                row.items.map((item) => [
                  formatDate(row.submittedAt),
                  row.deliveryNote.number,
                  row.submittedBy.name,
                  item.item.name,
                  item.used,
                  item.returned,
                  item.damaged,
                  row.status,
                ]),
              ),
            ],
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-card border-border flex flex-col gap-2.5 rounded-xl border p-4"
            >
              <div className="flex items-center justify-between">
                <span className="bg-muted flex size-7 items-center justify-center rounded-md">
                  <Icon className="size-3.5" />
                </span>
                <span className="border-border rounded-full border px-2.5 py-0.5 text-[10.5px]">
                  CSV
                </span>
              </div>
              <p className="text-[12.5px] font-semibold">{card.title}</p>
              <p className="text-base font-semibold tracking-[-0.3px]">
                {card.value}
              </p>
              <p className="text-muted-foreground text-[11px] leading-4">
                {card.description}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() =>
                  downloadCsv(
                    `${card.title.toLowerCase().replaceAll(" ", "-")}-${period}.csv`,
                    card.rows,
                  )
                }
              >
                <Download />
                Unduh
              </Button>
            </div>
          );
        })}
      </div>

      <div className="bg-card border-border flex flex-col gap-3 rounded-xl border p-4">
        <div>
          <p className="text-[13.5px] font-semibold">
            Pratinjau Laporan Barang Keluar
          </p>
          <p className="text-muted-foreground text-[11.5px]">
            {outgoingRows.length} baris pada periode terpilih
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>No. Surat Jalan</TableHead>
              <TableHead>Pekerjaan / Site</TableHead>
              <TableHead>Leader</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {outgoingRows.slice(0, 8).map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-xs">
                  {formatDate(row.confirmedAt ?? row.issuedAt)}
                </TableCell>
                <TableCell className="text-xs font-medium">
                  {row.number}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {row.request.jobNo} · {row.request.site}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {row.request.leader.name}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {row.items.map((item) => item.item.name).join(", ")}
                </TableCell>
                <TableCell className="text-xs">
                  {row.items.reduce((sum, item) => sum + item.qty, 0)} unit
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
              </TableRow>
            ))}
            {outgoingRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground py-6 text-center text-xs"
                >
                  Tidak ada data pada periode ini.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
