const eurFmt = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const m3Fmt = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 2,
});

export function formatEur(v: number) {
  return eurFmt.format(v);
}

export function formatM3(v: number) {
  return `${m3Fmt.format(v)} m3`;
}
