export function unmask(phone) {
  if (!phone) return '';
  return phone.replace(/\D+/g, '');
}

export function format(phone) {
  if (!phone) return phone;
  if (typeof phone !== 'string') return phone;
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
}
