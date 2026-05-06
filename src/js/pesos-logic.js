/**
 * Módulo: Lógica de Pesos e Dimensões
 * Responsável pelos cálculos técnicos e validações de domínio.
 */

import { PES_CONSTANTS, DIMENSION_LIMITS, PES_LIMITES_EIXOS } from './pesos-config';

/**
 * Calcula a multa por excesso de peso (Art. 231, V CTB)
 * @param {number} excessoKG Excesso em kg (o maior entre PBT e Eixos)
 * @returns {number} Valor da multa em Reais
 */
export function calcularMulta(excessoKG) {
  if (excessoKG <= 0) return 0;

  const { MULTA_BASE, ADICIONAL_FAIXAS, FRACAO_KG } = PES_CONSTANTS;
  const fracoes = Math.ceil(excessoKG / FRACAO_KG);
  
  const faixa = ADICIONAL_FAIXAS.find(f => excessoKG <= f.ate) || ADICIONAL_FAIXAS[ADICIONAL_FAIXAS.length - 1];
  const valorAdicional = fracoes * faixa.valor;

  return MULTA_BASE + valorAdicional;
}

/**
 * Realiza os cálculos de PBT (Peso Bruto Total)
 * @param {Object} options
 * @param {number} options.apurado Peso total medido ou calculado (Tara + NF)
 * @param {number} options.limiteLegal Limite estabelecido para o veículo
 * @returns {Object} Dados do cálculo de PBT
 */
export function calcularPBT({ apurado, limiteLegal }) {
  const tolerancia = Math.floor(limiteLegal * PES_CONSTANTS.TOLERANCIA_PBT);
  const limiteMax = limiteLegal + tolerancia;
  const excessoTotal = Math.max(0, apurado - limiteLegal);
  const excessoTolerancia = Math.max(0, apurado - limiteMax);

  let status = 'LEGAL';
  if (apurado > limiteMax) {
    status = 'EXCESSO';
  } else if (apurado > limiteLegal) {
    status = 'TOLERANCIA';
  }

  return {
    apurado,
    limiteLegal,
    tolerancia,
    limiteMax,
    excessoTotal,
    excessoTolerancia,
    status
  };
}

/**
 * Realiza os cálculos de excesso por Eixo (Balança)
 * @param {Array} eixos Lista de eixos { tipo, peso }
 * @returns {Object} Resultado da fiscalização por eixos
 */
export function calcularEixos(eixos) {
  let maiorExcessoEixo = 0;
  const eixosDetalhes = eixos.map(eixo => {
    const config = PES_LIMITES_EIXOS[eixo.tipo];
    if (!config || !eixo.peso) return { id: eixo.id, status: 'EMPTY' };

    const limiteLegal = config.limite;
    const tolerancia = Math.floor(limiteLegal * PES_CONSTANTS.TOLERANCIA_EIXO);
    const limiteMax = limiteLegal + tolerancia;
    const excesso = Math.max(0, eixo.peso - limiteLegal);
    const excessoTolerancia = Math.max(0, eixo.peso - limiteMax);
    
    if (excesso > maiorExcessoEixo) maiorExcessoEixo = excesso;

    let status = 'LEGAL';
    if (eixo.peso > limiteMax) status = 'EXCESSO';
    else if (eixo.peso > limiteLegal) status = 'TOLERANCIA';

    return {
      id: eixo.id,
      tipo: config.nome,
      peso: eixo.peso,
      limiteLegal,
      limiteMax,
      excesso,
      excessoTolerancia,
      isExcedente: status === 'EXCESSO',
      status
    };
  });

  const eixosExcedentes = eixosDetalhes.filter(e => e.status === 'EXCESSO');

  return {
    detalhes: eixosDetalhes,
    excedentes: eixosExcedentes,
    maiorExcessoEixo,
    temExcesso: eixosExcedentes.length > 0
  };
}

/**
 * Realiza os cálculos de Dimensões
 * @param {Object} medidas
 */
export function calcularDimensoes(medidas) {
  const { largura, altura, comprimento, entreEixos, balancoTraseiro, limiteComprimento } = medidas;
  
  const erros = [];
  
  if (largura > DIMENSION_LIMITS.LARGURA_MAX) {
    erros.push({ type: 'LARGURA', medido: largura, limite: DIMENSION_LIMITS.LARGURA_MAX });
  }
  
  if (altura > DIMENSION_LIMITS.ALTURA_MAX) {
    erros.push({ type: 'ALTURA', medido: altura, limite: DIMENSION_LIMITS.ALTURA_MAX });
  }
  
  if (comprimento > limiteComprimento) {
    erros.push({ type: 'COMPRIMENTO', medido: comprimento, limite: limiteComprimento });
  }
  
  const limiteBalanco = Math.min(entreEixos * DIMENSION_LIMITS.BALANCO_PERCENT, DIMENSION_LIMITS.BALANCO_MAX_ABS);
  if (entreEixos > 0 && balancoTraseiro > limiteBalanco) {
    erros.push({ type: 'BALANCO', medido: balancoTraseiro, limite: limiteBalanco });
  }

  return {
    erros,
    isLegal: erros.length === 0,
    limiteBalanco
  };
}
