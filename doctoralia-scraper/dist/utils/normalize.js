export function cleanTxt(s) {
    return (s || "").replace(/\s+/g, " ").trim();
}
export function toFloat(s) {
    if (!s)
        return null;
    const m = String(s).replace(",", ".").match(/(\d+(\.\d+)?)/);
    return m ? Number(m[1]) : null;
}
export function toInt(s) {
    if (!s)
        return null;
    const m = String(s).match(/(\d+)/);
    return m ? Number(m[1]) : null;
}
//# sourceMappingURL=normalize.js.map