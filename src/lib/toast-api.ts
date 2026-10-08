import { toast } from "sonner";
import type { Envelope } from "@/lib/api/baseApi";

type MutationResult = {
  data?: Envelope<unknown>;
  error?: unknown;
};

function envelopeMessage(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const rec = value as { message?: unknown; data?: unknown; errors?: unknown };
  const errors = Array.isArray(rec.errors) ? rec.errors : [];
  const details = errors
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const message = (item as { message?: unknown }).message;
      return typeof message === "string" ? message.trim() : "";
    })
    .filter(Boolean);
  if (details.length) return details.join(" ");
  if (typeof rec.message === "string" && rec.message.trim()) return rec.message;
  if (rec.data && typeof rec.data === "object") {
    const nested = rec.data as { message?: unknown };
    if (typeof nested.message === "string" && nested.message.trim()) return nested.message;
  }
  return undefined;
}

export function toastApiResult(
  result: MutationResult,
  fallbackSuccess: string,
  fallbackError = "Data was not saved."
): boolean {
  if ("error" in result && result.error) {
    const err = result.error as { data?: unknown };
    toast.error(envelopeMessage(err.data) ?? fallbackError);
    return false;
  }
  toast.success(envelopeMessage(result.data) ?? fallbackSuccess);
  return true;
}
