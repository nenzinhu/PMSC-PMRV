<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from '../js/utils';
import { getDiffMinutes, formatDuration } from '../js/tacografo-logic';

const router = useRouter();
const activeTab = ref('calc');

const state = reactive({
  descanso: { ini: '', fim: '', res: '', status: 'neutral' },
  conducao: { ini: '', fim: '', res: '', status: 'neutral' },
  utc: { inp: '', res: '' }
});

// --- PERSISTÊNCIA ---
onMounted(() => {
  const saved = localStorage.getItem('pmrv_tacografo_last');
  if (saved) {
    Object.assign(state, JSON.parse(saved));
  }
});

watch(state, (newVal) => {
  localStorage.setItem('pmrv_tacografo_last', JSON.stringify(newVal));
}, { deep: true });

// --- LÓGICA ---
const calcDescanso = () => {
  const diff = getDiffMinutes(state.descanso.ini, state.descanso.fim);
  if (diff === 0) return;

  const msg = `Duração: ${formatDuration(diff)}`;
  if (diff >= 660) {
    state.descanso.status = 'success';
    state.descanso.res = `${msg} ✅ DESCANSO OK`;
  } else {
    state.descanso.status = 'danger';
    state.descanso.res = `${msg} ⚠️ INSUFICIENTE (Mín. 11h)`;
  }
};

const calcConducao = () => {
  const diff = getDiffMinutes(state.conducao.ini, state.conducao.fim);
  if (diff === 0) return;

  const msg = `Duração: ${formatDuration(diff)}`;
  if (diff <= 330) {
    state.conducao.status = 'success';
    state.conducao.res = `${msg} ✅ DENTRO DO LIMITE`;
  } else {
    state.conducao.status = 'danger';
    state.conducao.res = `${msg} ⚠️ EXCEDEU 5H30 (Art. 67-C)`;
  }
};

const convUTC = () => {
  if (!state.utc.inp) return;
  const [h, m] = state.utc.inp.split(':').map(Number);
  let nh = h - 3;
  if (nh < 0) nh += 24;

  state.utc.res = `${String(nh).padStart(2, '0')}:${String(m).padStart(2, '0')} BRT`;
};

const copiarResultado = (tipo) => {
  let texto = '';
  if (tipo === 'descanso') texto = `Análise de Descanso: ${state.descanso.res}`;
  if (tipo === 'conducao') texto = `Análise de Condução: ${state.conducao.res}`;
  
  if (texto) {
    navigator.clipboard.writeText(texto);
    showToast('Resultado copiado!', 'success');
  }
};
</script>

<template>
  <section id="screen-tacografo" class="screen active">
    <div class="header-compact">
      <router-link to="/" class="btn-back">‹</router-link>
      <img src="/img/new_icons/tacografo.png" alt="Icon" class="header-icon" />
      <div class="header-title-group">
        <h1 class="header-title">Tacógrafo & Jornada</h1>
        <div class="step-indicator">Lei 13.103/15 (Lei do Motorista)</div>
      </div>
      <router-link to="/ended" class="btn-exit">Sair</router-link>
    </div>

    <div class="tac-container">
      <div class="view-tabs">
        <button 
          class="v-tab" 
          :class="{ active: activeTab === 'calc' }" 
          @click="activeTab = 'calc'"
        >
          <img src="/img/new_icons/tacografo.png" alt="Calc" class="icon-sm" /> Calculadora
        </button>
        <button 
          class="v-tab" 
          :class="{ active: activeTab === 'guia' }" 
          @click="activeTab = 'guia'"
        >
          <img src="/img/new_icons/pesos.png" alt="Guia" class="icon-sm" /> Guia Rápido
        </button>
      </div>

      <!-- ABA: CALCULADORA -->
      <div v-if="activeTab === 'calc'" class="animate-fade mt-16">
        <!-- DESCANSO -->
        <div class="card mb-16">
          <h2 class="card-section-title">🛌 Descanso (Interjornada)</h2>
          <p class="card-sub-modern">Mínimo de 11 horas de descanso a cada 24 horas.</p>
          
          <div class="form-row-modern mt-12">
            <div class="form-field flex-1">
              <label class="field-label">Início</label>
              <input type="time" v-model="state.descanso.ini" @change="calcDescanso" class="input-modern">
            </div>
            <div class="form-field flex-1">
              <label class="field-label">Fim</label>
              <input type="time" v-model="state.descanso.fim" @change="calcDescanso" class="input-modern">
            </div>
          </div>

          <div v-if="state.descanso.res" class="result-box mt-16" :class="state.descanso.status">
            {{ state.descanso.res }}
            <button class="btn-copy-mini" @click="copiarResultado('descanso')">📋</button>
          </div>
        </div>

        <!-- CONDUÇÃO -->
        <div class="card mb-16">
          <h2 class="card-section-title">🚛 Condução Contínua</h2>
          <p class="card-sub-modern">Máximo de 5h30min ininterruptas ao volante.</p>
          
          <div class="form-row-modern mt-12">
            <div class="form-field flex-1">
              <label class="field-label">Início</label>
              <input type="time" v-model="state.conducao.ini" @change="calcConducao" class="input-modern">
            </div>
            <div class="form-field flex-1">
              <label class="field-label">Fim</label>
              <input type="time" v-model="state.conducao.fim" @change="calcConducao" class="input-modern">
            </div>
          </div>

          <div v-if="state.conducao.res" class="result-box mt-16" :class="state.conducao.status">
            {{ state.conducao.res }}
            <button class="btn-copy-mini" @click="copiarResultado('conducao')">📋</button>
          </div>
        </div>

        <!-- CONVERSOR UTC -->
        <div class="card">
          <h2 class="card-section-title">🌐 Conversor UTC (Geral p/ BRT)</h2>
          <p class="card-sub-modern">Subtrai 3 horas do horário UTC do disco/fita.</p>
          
          <div class="form-row-modern mt-12">
            <div class="form-field flex-1">
              <label class="field-label">Horário UTC</label>
              <input type="time" v-model="state.utc.inp" @input="convUTC" class="input-modern">
            </div>
            <div class="form-field flex-1">
              <label class="field-label">Brasília (-3h)</label>
              <input type="text" v-model="state.utc.res" readonly class="input-modern input-readonly">
            </div>
          </div>
        </div>
      </div>

      <!-- ABA: GUIA -->
      <div v-if="activeTab === 'guia'" class="animate-fade mt-16">
        <div class="card">
          <h2 class="card-section-title">📜 Resumo Lei 13.103/15</h2>
          
          <div class="guia-section">
            <div class="guia-item">
              <h3>🚛 Condução (Art. 67-C)</h3>
              <p>É vedado ao motorista profissional dirigir por mais de <strong>5h30min ininterruptas</strong>.</p>
            </div>
            
            <div class="guia-item">
              <h3>🛌 Descanso (Art. 67-C, § 1º)</h3>
              <p>Dentro do período de 24h, o motorista deve ter <strong>11h de descanso</strong> (pode ser fracionado, sendo 8h ininterruptas).</p>
            </div>

            <div class="guia-item">
              <h3>☕ Intervalo de Descanso</h3>
              <p>A cada 6h de trabalho, 30min de descanso (condução de passageiros: 5min a cada 4h).</p>
            </div>

            <div class="guia-item">
              <h3>📊 Tolerância</h3>
              <p>Em situações excepcionais (chegar a local seguro), o tempo pode ser estendido, mas deve ser justificado.</p>
            </div>
            
            <div class="guia-info-box mt-16">
              <strong>Nota:</strong> A fiscalização é feita pelo disco ou fita do cronotacógrafo. O não cumprimento acarreta infração média (Art. 230, XXIII do CTB).
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.icon-sm {
  width: 20px;
  height: 20px;
  margin-right: 8px;
  vertical-align: middle;
}
.header-compact { display: flex; align-items: center; padding: 12px 16px; background: var(--card-bg); border-bottom: 1px solid var(--border-color); margin-bottom: 16px; gap: 12px; }
.btn-back { font-size: 24px; text-decoration: none; color: var(--text-main); padding: 4px 8px; }
.header-title-group { flex: 1; }
.header-title { font-size: 16px; font-weight: 700; margin: 0; }
.step-indicator { font-size: 11px; color: var(--text-dim); }

.tac-container { max-width: 600px; margin: 0 auto; padding: 0 12px 100px; }

.view-tabs { display: flex; gap: 4px; background: var(--black-20); padding: 4px; border-radius: 10px; }
.v-tab {
  flex: 1; border: none; background: none; padding: 10px 4px; color: var(--text-dim);
  font-size: 13px; font-weight: 700; border-radius: 6px; cursor: pointer;
}
.v-tab.active { background: var(--blue-main); color: white; }

.card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 16px; }
.card-section-title { font-size: 16px; color: var(--blue-light); margin-bottom: 4px; }
.card-sub-modern { font-size: 12px; color: var(--text-dim); }

.form-row-modern { display: flex; gap: 12px; }
.flex-1 { flex: 1; }

.field-label { display: block; font-size: 11px; font-weight: 700; color: var(--text-dim); margin-bottom: 6px; text-transform: uppercase; }
.input-modern {
  width: 100%; background: var(--black-20); border: 1px solid var(--border-color);
  border-radius: 8px; padding: 12px; color: white; font-size: 16px; font-weight: 600;
}
.input-readonly { background: rgba(255, 255, 255, 0.05); color: var(--blue-light); }

.result-box {
  padding: 14px; border-radius: 10px; font-size: 14px; font-weight: 700;
  display: flex; justify-content: space-between; align-items: center;
  border: 1px solid var(--border-color);
}
.result-box.success { background: rgba(16, 185, 129, 0.1); border-color: #10b981; color: #10b981; }
.result-box.danger { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; color: #ef4444; }
.btn-copy-mini { background: none; border: none; cursor: pointer; font-size: 16px; filter: grayscale(1); }

.guia-section { display: flex; flex-direction: column; gap: 16px; margin-top: 12px; }
.guia-item h3 { font-size: 14px; color: var(--blue-light); margin-bottom: 4px; }
.guia-item p { font-size: 13px; color: var(--text-main); line-height: 1.4; margin: 0; }
.guia-info-box {
  background: rgba(59, 130, 246, 0.05); border: 1px dashed var(--blue-main);
  padding: 12px; border-radius: 8px; font-size: 12px; color: var(--text-dim);
}

.animate-fade { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.mb-16 { margin-bottom: 16px; }
.mt-12 { margin-top: 12px; }
.mt-16 { margin-top: 16px; }
</style>
