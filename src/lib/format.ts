export const formatCurrency = (amount: number): string => {
  // Forzamos el formato con puntos y comas manualmente por seguridad extrema
  const parts = (amount || 0).toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${parts.join(',')} €`;
};

export const cleanNIF = (nif: string): string => {
  if (!nif) return "";
  return nif.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
};

export const cleanBudgetNumber = (serie: string | undefined | null, number: string | undefined | null): string => {
  const s = (serie || '').trim();
  const n = (number || '').trim();
  
  let combined = '';
  if (s) {
    combined = `${s}-${n}`;
  } else {
    combined = n;
  }
  
  return combined.replace(/^(P-)+/gi, 'P-');
};

