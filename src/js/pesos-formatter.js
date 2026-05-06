/**
 * Módulo: Formatadores de Pesos e Dimensões
 * Responsável pela apresentação dos dados e textos de infração.
 */

/**
 * Formata o texto da infração de excesso de peso (PBT e/ou Eixos)
 * @param {Object} results
 * @returns {string} Texto formatado
 */
export function formatarInfracaoPeso({ pbt, eixos, multa, metodo }) {
  let txt = `*INFRAÇÃO: EXCESSO DE PESO (Art. 231, V CTB)*\n`;
  txt += `Método: ${metodo === 'balanca' ? 'BALANÇA' : 'NOTA FISCAL'}\n`;
  txt += `Código: 682-31\n`;
  txt += `─────────────────────\n`;

  if (pbt.status === 'EXCESSO') {
    txt += `[PBT]\n`;
    txt += `Limite Legal: ${pbt.limiteLegal.toLocaleString('pt-BR')} kg\n`;
    txt += `Peso Apurado: ${pbt.apurado.toLocaleString('pt-BR')} kg\n`;
    txt += `Excesso Constatado: ${pbt.excessoTotal.toLocaleString('pt-BR')} kg\n`;
    txt += `Transbordo Obreg.: ${pbt.excessoTotal.toLocaleString('pt-BR')} kg\n\n`;
  }

  if (eixos && eixos.temExcesso) {
    txt += `[EXCESSO NOS EIXOS]\n`;
    eixos.excedentes.forEach(e => {
      txt += `• ${e.tipo}: ${e.peso.toLocaleString('pt-BR')} kg (Exc: ${e.excesso.toLocaleString('pt-BR')} kg)\n`;
    });
    txt += `\n`;
  }

  if (multa > 0) {
    txt += `Valor Est. Multa: R$ ${multa.toFixed(2).replace('.', ',')}\n`;
  }
  
  txt += `─────────────────────\n`;
  txt += `Medida: Retenção para transbordo/remanejamento.`;
  return txt;
}

/**
 * Formata o texto da infração de dimensões excedentes
 * @param {Array} erros Lista de objetos { type, medido, limite }
 * @returns {string} Texto formatado
 */
export function formatarInfracaoDimensoes(erros) {
  let txt = `*INFRAÇÃO: DIMENSÃO EXCEDENTE (Art. 231, IV CTB)*\n`;
  txt += `Código: 682-32\n`;
  txt += `─────────────────────\n`;
  txt += `Motivos:\n`;
  
  erros.forEach(e => {
    const label = {
      'LARGURA': 'Largura',
      'ALTURA': 'Altura',
      'COMPRIMENTO': 'Comprimento',
      'BALANCO': 'Balanço Traseiro'
    }[e.type] || 'Desconhecido';
    
    txt += `• ${label} excedente (${e.medido.toFixed(2)}m > ${e.limite.toFixed(2)}m)\n`;
  });

  txt += `─────────────────────\n`;
  txt += `Medida: Retenção para regularização.`;
  return txt;
}

export function formatKg(val) {
  return (val || 0).toLocaleString('pt-BR') + ' kg';
}

export function formatM(val) {
  return (val || 0).toFixed(2) + 'm';
}
