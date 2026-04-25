export const formatRupiah = (n: number) =>
  "Rp " + n.toLocaleString("id-ID");

export const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
