"use client";

import { useMemo, useState, type FormEventHandler, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button, Input } from "./ui";
import { DropdownMenu, type MenuAction } from "./dropdown-menu";
import { useI18n } from "@/lib/i18n";

export type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  align?: "left" | "right" | "center";
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  searchable,
  searchPlaceholder,
  pageSize = 0,
  actions,
  selectedIds,
  onToggle,
  mobileCard,
}: {
  columns: Array<Column<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  actions?: (row: T) => MenuAction[];
  selectedIds?: string[];
  onToggle?: (id: string) => void;
  mobileCard?: (row: T) => ReactNode;
}) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let next = rows;
    if (query) {
      next = rows.filter((row) =>
        columns.some((column) => String(column.sortValue ? column.sortValue(row) : column.cell(row)).toLowerCase().includes(query))
      );
    }
    if (sortKey != null && columns[sortKey]?.sortValue) {
      const getValue = columns[sortKey].sortValue!;
      next = [...next].sort((a, b) => {
        const av = getValue(a);
        const bv = getValue(b);
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return next;
  }, [columns, q, rows, sortDir, sortKey]);

  const size = pageSize > 0 ? pageSize : filtered.length || 1;
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const safePage = Math.min(page, pages - 1);
  const visible = pageSize > 0 ? filtered.slice(safePage * size, safePage * size + size) : filtered;

  if (!rows.length && !searchable) return null;

  return (
    <div className="space-y-3">
      {searchable ? (
        <Input
          className="max-w-md"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder={searchPlaceholder ?? t.common.searchPlaceholder}
        />
      ) : null}
      {mobileCard ? (
        <div className="grid gap-3 md:hidden">
          {visible.map((row) => (
            <div key={rowKey(row)} className="rounded-xl border border-border bg-white p-4 shadow-sm">
              {mobileCard(row)}
              {actions ? <div className="mt-3">{<DropdownMenu actions={actions(row)} />}</div> : null}
            </div>
          ))}
        </div>
      ) : null}
      <div className={cn("overflow-x-auto rounded-xl border border-border bg-white", mobileCard && "hidden md:block")}>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/70 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {onToggle ? <th className="w-10 px-4 py-3" /> : null}
              {columns.map((column, index) => (
                <th
                  key={column.header}
                  className={cn(
                    "whitespace-nowrap px-4 py-3",
                    column.align === "right" && "text-right",
                    column.align === "center" && "text-center",
                    column.sortValue && "cursor-pointer select-none",
                    column.className
                  )}
                  onClick={() => {
                    if (!column.sortValue) return;
                    if (sortKey === index) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                    else {
                      setSortKey(index);
                      setSortDir("asc");
                    }
                  }}
                >
                  {column.header}
                </th>
              ))}
              {actions ? <th className="px-4 py-3 text-right">{t.common.actions}</th> : null}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const id = rowKey(row);
              return (
                <tr key={id} className="border-t border-border/80 last:border-b-0 transition duration-150 hover:bg-muted/40">
                  {onToggle ? (
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds?.includes(id) ?? false} onChange={() => onToggle(id)} />
                    </td>
                  ) : null}
                  {columns.map((column) => (
                    <td
                      key={column.header}
                      className={cn(
                        "px-4 py-3 align-middle",
                        column.align === "right" && "text-right tabular-nums",
                        column.align === "center" && "text-center",
                        column.className
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                  {actions ? (
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu actions={actions(row)} />
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pageSize > 0 && filtered.length > pageSize ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            {filtered.length} · {safePage + 1}/{pages}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="h-9" disabled={safePage === 0} onClick={() => setPage((p) => p - 1)}>
              {t.common.prev}
            </Button>
            <Button type="button" variant="secondary" className="h-9" disabled={safePage >= pages - 1} onClick={() => setPage((p) => p + 1)}>
              {t.common.next}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function FormPanel({
  children,
  className,
  onSubmit,
}: {
  children: ReactNode;
  className?: string;
  onSubmit?: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <form
      className={cn("mb-6 grid gap-3 rounded-xl border border-border bg-white p-4 md:items-end", className)}
      onSubmit={onSubmit}
    >
      {children}
    </form>
  );
}
