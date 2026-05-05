<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import VisualAxleSelector from '../components/VisualAxleSelector.vue';
import { 
  VEHICLE_PRESETS, 
  PES_LIMITES_EIXOS,
  DIMENSION_TYPES
} from '../js/pesos-config';
import { 
  calcularPBT, 
  calcularEixos,
  calcularMulta,
  calcularDimensoes
} from '../js/pesos-logic';
import {
  formatarInfracaoPeso,
  formatarInfracaoDimensoes,
  formatKg,
  formatM
} from '../js/pesos-formatter';

const router = useRouter();

// Tabs
const activeTab = ref('pbt'); // 'pbt' or 'dim'

// PBT/Peso State
const metodo = ref('nf'); // 'nf' or 'balanca'
const configValue = ref('16000');
const manualLimite = ref(0);
const tara = ref(0);
const cargaNF = ref(0);
const pbtMedido = ref(0);
const eixos = ref([]); // { tipo, peso, id }
const copiedPBT = ref(false);

// --- PERSISTÊNCIA ---
onMounted(() => {
  const saved = localStorage.getItem('pmrv_pesos_data');
  if (saved) {
    const data = JSON.parse(saved);
    metodo.value = data.metodo || 'nf';
    configValue.value = data.configValue || '16000';
    manualLimite.value = data.manualLimite || 0;
    tara.value = data.tara || 0;
    cargaNF.value = data.cargaNF || 0;
    pbtMedido.value = data.pbtMedido || 0;
    eixos.value = data.eixos || [];
  }
});

watch([metodo, configValue, manualLimite, tara, cargaNF, pbtMedido, eixos], () => {
  const data = {
    metodo: metodo.value,
    configValue: configValue.value,
    manualLimite: manualLimite.value,
    tara: tara.value,
    cargaNF: cargaNF.value,
    pbtMedido: pbtMedido.value,
    eixos: eixos.value
  };
  localStorage.setItem('pmrv_pesos_data', JSON.stringify(data));
  
  // Salvar resumo para o Relatório Completo
  const resumo = {
    apurado: pbtApurado.value,
    limite: limiteLegalPBT.value,
    excesso: resultadosPBT.value.excessoTotal
  };
  localStorage.setItem('pmrv_pesos_last', JSON.stringify(resumo));
}, { deep: true });

// Auto-populate axles when config changes
watch(configValue, (newVal) => {
  if (newVal !== 'MANUAL') {
    const preset = VEHICLE_PRESETS.find(p => String(p.value) === String(newVal));
    if (preset && preset.schema) {
      eixos.value = preset.schema.map((tipo, index) => ({
        id: Date.now() + index,
        tipo: tipo,
        peso: 0
      }));
    }
  }
});

// Dimensions State
const dimTipo = ref(14.00);
const dimLargura = ref(0);
const dimAltura = ref(0);
const dimComprimento = ref(0);
const dimEntreEixos = ref(0);
const dimBalanco = ref(0);
const copiedDim = ref(false);

// PBT Computed
const isManual = computed(() => configValue.value === 'MANUAL');
const limiteLegalPBT = computed(() => {
  if (isManual.value) return parseFloat(manualLimite.value || 0);
  return parseFloat(configValue.value);
});

const pbtApurado = computed(() => {
  if (metodo.value === 'nf') {
    return parseFloat(tara.value || 0) + parseFloat(cargaNF.value || 0);
  }
  return parseFloat(pbtMedido.value || 0);
});

const resultadosPBT = computed(() => {
  return calcularPBT({
    apurado: pbtApurado.value,
    limiteLegal: limiteLegalPBT.value
  });
});

const resultadosEixos = computed(() => {
  if (metodo.value !== 'balanca') return { temExcesso: false, detalhes: [], maiorExcessoEixo: 0 };
  return calcularEixos(eixos.value);
});

const multaTotal = computed(() => {
  const excesso = Math.max(resultadosPBT.value.excessoTotal, resultadosEixos.value.maiorExcessoEixo);
  return calcularMulta(excesso);
});

const infracaoTextoPeso = computed(() => {
  return formatarInfracaoPeso({
    pbt: resultadosPBT.value,
    eixos: resultadosEixos.value,
    multa: multaTotal.value,
    metodo: metodo.value
  });
});

// Dimensions Computed
const resultadosDim = computed(() => {
  return calcularDimensoes({
    largura: parseFloat(dimLargura.value || 0),
    altura: parseFloat(dimAltura.value || 0),
    comprimento: parseFloat(dimComprimento.value || 0),
    entreEixos: parseFloat(dimEntreEixos.value || 0),
    balancoTraseiro: parseFloat(dimBalanco.value || 0),
    limiteComprimento: parseFloat(dimTipo.value)
  });
});

const infracaoTextoDim = computed(() => formatarInfracaoDimensoes(resultadosDim.value.erros));

// Actions
const goBack = () => router.push({ name: 'home' });

const addEixo = () => {
  eixos.value.push({
    id: Date.now(),
    tipo: 'simples_2',
    peso: 0
  });
};

const removeEixo = (id) => {
  eixos.value = eixos.value.filter(e => e.id !== id);
};

const copiarPBT = () => {
  navigator.clipboard.writeText(infracaoTextoPeso.value).then(() => {
    copiedPBT.value = true;
    setTimeout(() => (copiedPBT.value = false), 2000);
  });
};

const copiarDim = () => {
  navigator.clipboard.writeText(infracaoTextoDim.value).then(() => {
    copiedDim.value = true;
    setTimeout(() => (copiedDim.value = false), 2000);
  });
};

</script>

<template>
  <section class="screen active" aria-label="Pesos e Dimensões">
    <div class="back-row">
      <button class="btn btn-sm" @click="goBack">‹ Voltar</button>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title-with-icon">
          <img src="/peso.png" alt="Peso" class="card-title-icon" />
          <h2 class="card-title">Pesos e Dimensões</h2>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="infra-tabs mt-8">
        <button 
          class="infra-tab-btn" 
          :class="{ active: activeTab === 'pbt' }" 
          @click="activeTab = 'pbt'"
        >
          ⚖️ Peso (PBT/Eixo)
        </button>
        <button 
          class="infra-tab-btn" 
          :class="{ active: activeTab === 'dim' }" 
          @click="activeTab = 'dim'"
        >
          📏 Dimensões
        </button>
      </div>

      <div class="divider mt-12 mb-16"></div>

      <!-- PBT CONTENT -->
      <div v-if="activeTab === 'pbt'" class="tab-content">
        <div class="form-field mb-16">
          <label class="field-label">Método de Fiscalização</label>
          <select v-model="metodo">
            <option value="nf">Nota Fiscal (Tolerância 5% PBT)</option>
            <option value="balanca">Balança (Tol. 5% PBT / 12.5% Eixos)</option>
          </select>
        </div>

        <div class="form-grid">
          <div class="form-field">
            <label class="field-label">Configuração do Veículo (PBT)</label>
            <select v-model="configValue">
              <optgroup label="Caminhão Simples">
                <option v-for="p in VEHICLE_PRESETS.slice(0, 3)" :key="p.value" :value="p.value">
                  {{ p.label }}
                </option>
              </optgroup>
              <optgroup label="Caminhão Trator + Semirreboque">
                <option v-for="p in VEHICLE_PRESETS.slice(3, 7)" :key="p.value" :value="p.value">
                  {{ p.label }}
                </option>
              </optgroup>
              <optgroup label="Combinações (CVC)">
                <option v-for="p in VEHICLE_PRESETS.slice(7)" :key="p.value" :value="p.value">
                  {{ p.label }}
                </option>
              </optgroup>
              <option value="MANUAL">✏️ Outro limite (Manual)</option>
            </select>
            <input 
              v-if="isManual"
              type="number" 
              v-model="manualLimite" 
              class="mt-8" 
              placeholder="Limite em KG"
            />
          </div>

          <!-- NOTA FISCAL FIELDS -->
          <div v-if="metodo === 'nf'" class="form-row form-row-2">
            <div class="form-field">
              <label class="field-label">Tara (KG)</label>
              <input type="number" v-model="tara" placeholder="Ex: 8500" />
            </div>
            <div class="form-field">
              <label class="field-label">Peso da Carga / NF (KG)</label>
              <input type="number" v-model="cargaNF" placeholder="Ex: 12000" />
            </div>
          </div>

          <!-- BALANCA FIELDS -->
          <div v-if="metodo === 'balanca'" class="form-field">
            <label class="field-label">Peso Total Medido (PBT Apurado)</label>
            <input type="number" v-model="pbtMedido" placeholder="Peso total na balança" />
          </div>
        </div>

        <!-- AXLE MANAGEMENT (BALANCA ONLY) -->
        <div v-if="metodo === 'balanca'" class="mt-16">
          <div class="flex justify-between align-center mb-8">
            <label class="field-label m-0">Pesagem por Eixo</label>
            <button class="btn btn-sm btn-primary" @click="addEixo">+ Adicionar Eixo</button>
          </div>
          
          <div v-if="eixos.length === 0" class="sub-box text-center py-16">
            <span class="card-sub">Nenhum eixo adicionado para fiscalização.</span>
          </div>

          <VisualAxleSelector 
            v-if="eixos.length > 0"
            v-model="eixos" 
            :resultadosEixos="resultadosEixos" 
          />
        </div>

        <!-- Resultados Peso -->
        <div v-if="pbtApurado > 0 || resultadosEixos.temExcesso" class="result-box visible">
          <div class="divider mt-16 mb-16"></div>
          
          <div class="infra-stats">
            <div class="infra-stat">
              <span class="infra-stat-label">PBT Apurado</span>
              <strong :style="{ color: resultadosPBT.status === 'EXCESSO' ? 'var(--red)' : '#fff' }">
                {{ formatKg(resultadosPBT.apurado) }}
              </strong>
            </div>
            <div class="infra-stat">
              <span class="infra-stat-label">Limite Legal</span>
              <strong>{{ formatKg(resultadosPBT.limiteLegal) }}</strong>
            </div>
            <div class="infra-stat">
              <span class="infra-stat-label">Com Tolerância</span>
              <strong style="color: var(--blue)">{{ formatKg(resultadosPBT.limiteMax) }}</strong>
            </div>
          </div>

          <!-- Alertas PBT -->
          <div v-if="resultadosPBT.status === 'LEGAL' && !resultadosEixos.temExcesso" class="sub-box mt-12" style="background: var(--green-dim); border-color: var(--green);">
            <div class="flex align-center gap-8">
              <span style="font-size: 20px;">✅</span>
              <div>
                <strong style="color: var(--green); display: block;">DENTRO DO LIMITE</strong>
                <span class="card-sub">Peso em conformidade com a legislação.</span>
              </div>
            </div>
          </div>

          <div v-if="resultadosPBT.status === 'TOLERANCIA'" class="sub-box mt-12" style="background: var(--amber-dim); border-color: var(--amarelo);">
            <div class="flex align-center gap-8">
              <span style="font-size: 20px;">⚠️</span>
              <div>
                <strong style="color: var(--amarelo); display: block;">DENTRO DA TOLERÂNCIA (PBT)</strong>
                <span class="card-sub">Excesso de {{ formatKg(resultadosPBT.excessoTotal) }}, mas dentro dos 5%.</span>
              </div>
            </div>
          </div>

          <div v-if="resultadosPBT.status === 'EXCESSO'" class="sub-box sub-box-red mt-12">
            <div class="flex align-center gap-8">
              <span style="font-size: 20px;">⚖️</span>
              <div>
                <strong style="color: var(--red); display: block;">EXCESSO PBT DETECTADO!</strong>
                <span class="card-sub">
                  Excesso Total: <strong>{{ formatKg(resultadosPBT.excessoTotal) }}</strong><br>
                  Acima da Tolerância: <strong>{{ formatKg(resultadosPBT.excessoTolerancia) }}</strong>
                </span>
              </div>
            </div>
          </div>

          <!-- Alerta Eixos -->
          <div v-if="resultadosEixos.temExcesso" class="sub-box sub-box-red mt-12">
            <div class="flex align-center gap-8">
              <span style="font-size: 20px;">⚖️</span>
              <div>
                <strong style="color: var(--red); display: block;">EXCESSO NOS EIXOS!</strong>
                <span class="card-sub">
                  Detectado excesso em {{ resultadosEixos.excedentes.length }} conjunto(s) de eixos.
                </span>
              </div>
            </div>
          </div>

          <!-- Enquadramento e Multa -->
          <div v-if="resultadosPBT.status === 'EXCESSO' || resultadosEixos.temExcesso" class="mt-16">
            <div class="infra-stat mb-12">
              <span class="infra-stat-label">Multa Estimada</span>
              <strong style="color: var(--amarelo); font-size: 1.2rem;">
                R$ {{ multaTotal.toFixed(2).replace('.', ',') }}
              </strong>
            </div>

            <label class="result-label">📑 Texto da Infração</label>
            <div class="result-text" style="white-space: pre-wrap;">{{ infracaoTextoPeso }}</div>
            <div class="result-actions">
              <button class="btn btn-primary btn-full" @click="copiarPBT">
                {{ copiedPBT ? '✅ Copiado!' : '📋 Copiar Dados' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- DIMENSIONS CONTENT -->
      <div v-else class="tab-content">
        <p class="card-sub mb-16">Limites de Dimensões (Res. 210/06 e 882/21)</p>

        <div class="form-grid">
          <div class="form-field">
            <label class="field-label">Tipo de Veículo / Comprimento</label>
            <select v-model="dimTipo">
              <option v-for="t in DIMENSION_TYPES" :key="t.value" :value="t.value">
                {{ t.label }}
              </option>
            </select>
          </div>

          <div class="form-row form-row-3">
            <div class="form-field">
              <label class="field-label">Largura (m)</label>
              <input type="number" step="0.01" v-model="dimLargura" placeholder="Máx 2.60" />
            </div>
            <div class="form-field">
              <label class="field-label">Altura (m)</label>
              <input type="number" step="0.01" v-model="dimAltura" placeholder="Máx 4.40" />
            </div>
            <div class="form-field">
              <label class="field-label">Comprimento (m)</label>
              <input type="number" step="0.01" v-model="dimComprimento" :placeholder="'Máx ' + dimTipo" />
            </div>
          </div>

          <div class="form-row form-row-2">
            <div class="form-field">
              <label class="field-label">Dist. Entre-Eixos (m)</label>
              <input type="number" step="0.01" v-model="dimEntreEixos" placeholder="P/ cálculo balanço" />
            </div>
            <div class="form-field">
              <label class="field-label">Balanço Traseiro (m)</label>
              <input type="number" step="0.01" v-model="dimBalanco" placeholder="Medido" />
            </div>
          </div>
        </div>

        <!-- Resultados Dimensões -->
        <div v-if="dimLargura > 0 || dimAltura > 0 || dimComprimento > 0" class="result-box visible">
          <div class="divider mt-16 mb-16"></div>
          
          <div class="infra-stat mb-12" v-if="dimEntreEixos > 0">
            <span class="infra-stat-label">Limite de Balanço Traseiro</span>
            <strong>{{ formatM(resultadosDim.limiteBalanco) }}</strong>
            <span class="card-sub">Menor entre 60% do entre-eixos e 3,50m.</span>
          </div>

          <!-- Alertas -->
          <div v-if="resultadosDim.isLegal" class="sub-box mt-12" style="background: var(--green-dim); border-color: var(--green);">
            <div class="flex align-center gap-8">
              <span style="font-size: 20px;">✅</span>
              <div>
                <strong style="color: var(--green); display: block;">DIMENSÕES LEGAIS</strong>
                <span class="card-sub">Veículo dentro dos limites permitidos.</span>
              </div>
            </div>
          </div>

          <div v-else class="sub-box sub-box-red mt-12">
            <div class="flex align-center gap-8">
              <span style="font-size: 20px;">⚠️</span>
              <div>
                <strong style="color: var(--red); display: block;">DIMENSÃO EXCEDENTE!</strong>
                <span class="card-sub">
                  <div v-for="err in resultadosDim.erros" :key="err.type">
                    • {{ {
                      'LARGURA': 'Largura',
                      'ALTURA': 'Altura',
                      'COMPRIMENTO': 'Comprimento',
                      'BALANCO': 'Balanço Traseiro'
                    }[err.type] }} excedente ({{ formatM(err.medido) }} > {{ formatM(err.limite) }})
                  </div>
                </span>
              </div>
            </div>
          </div>

          <div v-if="!resultadosDim.isLegal" class="mt-16">
            <label class="result-label">📑 Enquadramento Sugerido</label>
            <div class="result-text" style="white-space: pre-wrap;">{{ infracaoTextoDim }}</div>
            <div class="result-actions">
              <button class="btn btn-primary btn-full" @click="copiarDim">
                {{ copiedDim ? '✅ Copiado!' : '📋 Copiar Dados' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer class="footer-signature mt-16">
        Polícia Militar Rodoviária de Santa Catarina<br>
        Ferramenta de Apoio Operacional
      </footer>
    </div>
  </section>
</template>

<style scoped>
.mb-16 { margin-bottom: 16px; }
.mb-12 { margin-bottom: 12px; }
.mb-8 { margin-bottom: 8px; }
.mt-4 { margin-top: 4px; }
.m-0 { margin: 0; }
.py-16 { padding-top: 16px; padding-bottom: 16px; }
.align-center { align-items: center; }
.justify-between { justify-content: space-between; }
.text-center { text-align: center; }
.tab-content { animation: fadeIn 0.3s ease; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
