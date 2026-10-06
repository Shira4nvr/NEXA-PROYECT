// Formatea precios de forma consistente en ambas plataformas.
// Los precios se guardan como enteros (ej: 45900 = $45.900 COP) para evitar
// problemas de redondeo con decimales.
export function formatCurrency(amount, currency = "COP") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
