"use client";

import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { type DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/shadcn/utils";

function parse(value: string) {
  return value ? new Date(`${value}T00:00:00`) : undefined;
}

export function DateRangePicker({
  from,
  to,
  onChange,
  className,
  placeholder = "Rentang tanggal",
}: {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
  className?: string;
  placeholder?: string;
}) {
  const selected: DateRange | undefined = from
    ? { from: parse(from), to: parse(to) }
    : undefined;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-9 w-full justify-start px-2.5 text-xs font-normal"
          >
            <CalendarIcon className="size-3.5" />
            {selected?.from ? (
              selected.to ? (
                <>
                  {format(selected.from, "dd MMM y", { locale: localeId })} -{" "}
                  {format(selected.to, "dd MMM y", { locale: localeId })}
                </>
              ) : (
                format(selected.from, "dd MMM y", { locale: localeId })
              )
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={selected?.from}
            selected={selected}
            onSelect={(range) =>
              onChange({
                from: range?.from ? format(range.from, "yyyy-MM-dd") : "",
                to: range?.to ? format(range.to, "yyyy-MM-dd") : "",
              })
            }
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      {from || to ? (
        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0"
          onClick={() => onChange({ from: "", to: "" })}
          aria-label="Reset rentang tanggal"
        >
          <X className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
