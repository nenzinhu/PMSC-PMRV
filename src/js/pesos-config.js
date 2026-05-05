/**
 * Configurações e Constantes Legais para Pesos e Dimensões
 * Baseado no CTB e Resoluções CONTRAN (ex: 210/06, 882/21)
 */

export const PES_CONSTANTS = {
  TOLERANCIA_PBT: 0.05,       // 5% (Res. 882/21)
  TOLERANCIA_EIXO: 0.125,     // 12.5% (Res. 882/21)
  MULTA_BASE: 130.16,         // Multa Média (Art. 231, V CTB)
  ADICIONAL_FAIXAS: [
    { ate: 600, valor: 5.32 },
    { ate: 800, valor: 10.64 },
    { ate: 1000, valor: 21.28 },
    { ate: 3000, valor: 31.92 },
    { ate: 5000, valor: 42.56 },
    { ate: Infinity, valor: 53.20 }
  ],
  FRACAO_KG: 200
};

export const VEHICLE_PRESETS = [
  { label: '🚚 2 Eixos (Toco) - 16t', value: 16000, schema: ['simples_2', 'simples_4'] },
  { label: '🚚 3 Eixos (Truck) - 23t', value: 23000, schema: ['simples_2', 'tandem_duplo'] },
  { label: '🚚 4 Eixos (Bitruck) - 29t', value: 29000, schema: ['direcional_duplo', 'tandem_duplo'] },
  { label: '🚛 3 Eixos (Cavalo Simples + 1) - 33t', value: 33000, schema: ['simples_2', 'simples_4', 'simples_4'] },
  { label: '🚛 4 Eixos (Cavalo Simples + 2) - 41.5t', value: 41500, schema: ['simples_2', 'simples_4', 'tandem_duplo'] },
  { label: '🚛 5 Eixos (Cavalo Truck + 2 ou Simples + 3) - 48.5t', value: 48500, schema: ['simples_2', 'tandem_duplo', 'tandem_duplo'] },
  { label: '🚛 6 Eixos (Cavalo Truck + 3) - 53t', value: 53000, schema: ['simples_2', 'tandem_duplo', 'tandem_triplo'] },
  { label: '🚛 7 Eixos (Bitrem) - 57t', value: 57000, schema: ['simples_2', 'tandem_duplo', 'tandem_duplo', 'tandem_duplo'] },
  { label: '🚛 9 Eixos (Rodotrem) - 74t', value: 74000, schema: ['simples_2', 'tandem_duplo', 'tandem_duplo', 'tandem_duplo', 'tandem_duplo'] }
];

export const PES_LIMITES_EIXOS = {
  simples_2: { nome: "Eixo Simples (2 pneus)", limite: 6000 },
  simples_4: { nome: "Eixo Simples (4 pneus)", limite: 10000 },
  tandem_duplo: { nome: "Tandem Duplo (8 pneus)", limite: 17000 },
  tandem_triplo: { nome: "Tandem Triplo (12 pneus)", limite: 25500 },
  direcional_duplo: { nome: "Direcional Duplo (4 pneus)", limite: 12000 }
};

export const DIMENSION_LIMITS = {
  LARGURA_MAX: 2.60,
  ALTURA_MAX: 4.40,
  BALANCO_MAX_ABS: 3.50,
  BALANCO_PERCENT: 0.60
};

export const DIMENSION_TYPES = [
  { label: 'Veículo Simples (14.00m)', value: 14.00 },
  { label: 'Articulado (18.60m)', value: 18.60 },
  { label: 'Com Reboque (19.80m)', value: 19.80 },
  { label: 'CVC (Rodotrem/Bitrem) (30.00m)', value: 30.00 }
];
