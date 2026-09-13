export function studentStatusTone(status?: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "active") return "success";
  if (status === "pending") return "warning";
  if (status === "transferred") return "danger";
  return "neutral";
}

export function activeTone(isActive?: boolean): "success" | "danger" {
  return isActive === false ? "danger" : "success";
}
