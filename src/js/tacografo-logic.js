/**
 * Utilitários de Cálculo para Tacógrafo
 */

export const getDiffMinutes = (start, end) => {
  if (!start || !end) return 0;
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);

  let total1 = h1 * 60 + m1;
  let total2 = h2 * 60 + m2;

  if (total2 < total1) {
    total2 += 1440; // Adiciona 24h para virada de dia
  }

  return total2 - total1;
};

export const formatDuration = (minutes) => {
  const horas = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${horas}h ${mins}min`;
};
