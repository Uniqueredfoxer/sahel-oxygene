/** Formate un montant en FCFA avec espace normale comme séparateur de milliers (sûr pour PDFKit). */
function formaterMontant(montant) {
  const n = Math.round(Number(montant) || 0);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** Formate une date en français sans espace insécable (sûr pour PDFKit). */
function formaterDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const jj = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const aaaa = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${jj}/${mm}/${aaaa} ${hh}:${min}`;
}

export { formaterMontant, formaterDate };
