/**
 * Format helpers & constants for PROSADA
 */

export const fmt = (val) => {
  if (val == null || val === "" || Number.isNaN(val)) return "0";
  return String(val).replace(".", ",");
};

export const TK_COLOR = {
  Tinggi: "#1a7a6e",
  Sedang: "#d99a1c",
  Rendah: "#e05260",
};
