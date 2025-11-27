export function cleanTxt(s: string | null | undefined): string {
  return (s || "").replace(/\s+/g, " ").trim();
}

export function toFloat(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = String(s).replace(",", ".").match(/(\d+(\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

export function toInt(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = String(s).match(/(\d+)/);
  return m ? Number(m[1]) : null;
}


