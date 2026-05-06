<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getGPSPosition, getGoogleMapsLink } from '../js/gps';
import { showToast } from '../js/utils';

const router = useRouter();

// --- DADOS ESTÁTICOS ---
const POLICIAIS_EFETIVO = [
  'Sub Ten JORGE LUIZ', 'Sub Ten OSORIO',
  '2o Sgt BARDT', '2o Sgt CAVALLAZZI', '3o Sgt DOUGLAS', '3o Sgt FIGUEIREDO',
  '3o Sgt FRANCISCO', '3o Sgt FRANCINE', '3o Sgt LEONARDO', '3o Sgt MARTINS',
  '3o Sgt WALTER', 'Cb ADEMIR', 'Cb ANDRADE', 'Cb CABRAL', 'Cb DIEGO',
  'Cb FABIANA', 'Cb JEFERSON', 'Cb JULIANA', 'Cb MATHEUS', 'Cb RODRIGUES',
  'Cb SANTOS', 'Cb SCARABELOT', 'Cb SILVA', 'Cb THIAGO'
];

const vtrGrid = ['0005', '0070', '5312', '6997', '5484', '5592', '5599'];
const tiposEscala = ['Ordinária', 'Apoio', 'Ponte', 'Evento', 'Futebol'];
const horarios = ['06h às 18h', '07h às 19h', '19h às 07h', '13h às 01h', '07h às 07h'];

// --- ESTADO ---
const currentStep = ref(1);
const isCapturandoGPS = ref(false);

const state = reactive({
  lotes: [], // Lista de guarnições adicionadas
  mesa: false,
  vtr: localStorage.getItem('pmrv_vtr_last') || '',
  vtrManual: false,
  tipo: 'Ordinária',
  policiaisSelecionados: JSON.parse(localStorage.getItem('pmrv_fav_team') || '[]'),
  horarioLote: '',
  localGeral: 'P19',
  lat: null,
  lng: null,
  resultado: ''
});

// --- LÓGICA DE AUTOMAÇÃO ---
const detectarTurno = () => {
  const hora = new Date().getHours();
  if (hora >= 6 && hora < 18) return '06h às 18h';
  if (hora >= 19 || hora < 7) return '19h às 07h';
  return '07h às 19h';
};

onMounted(() => {
  state.horarioLote = detectarTurno();
});

// --- AÇÕES ---
const nextStep = () => { if (currentStep.value < 3) currentStep.value++; };
const prevStep = () => { if (currentStep.value > 1) currentStep.value--; };

const alternarPolicial = (nome) => {
  const index = state.policiaisSelecionados.indexOf(nome);
  if (index >= 0) state.policiaisSelecionados.splice(index, 1);
  else if (state.policiaisSelecionados.length < 4) state.policiaisSelecionados.push(nome);
};

const adicionarGuarnicao = () => {
  if (state.policiaisSelecionados.length === 0) {
    showToast('Selecione ao menos um policial.', 'warning');
    return;
  }
  
  state.lotes.push({
    mesa: state.mesa,
    vtr: state.mesa ? 'MESA' : state.vtr,
    tipo: state.mesa ? 'Recepção' : state.tipo,
    horario: state.horarioLote,
    policiais: [...state.policiaisSelecionados]
  });

  // Limpar campos para próxima guarnição, mantendo o horário sugerido
  state.policiaisSelecionados = [];
  state.vtr = '';
  state.mesa = false;
  showToast('Guarnição adicionada à lista!', 'success');
};

const removerLote = (index) => {
  state.lotes.splice(index, 1);
  showToast('Guarnição removida.', 'info');
};

const capturarGPS = async () => {
  isCapturandoGPS.value = true;
  try {
    const pos = await getGPSPosition();
    state.lat = pos.coords.latitude;
    state.lng = pos.coords.longitude;
    showToast('GPS capturado com sucesso!', 'success');
  } catch (err) {
    showToast('Erro GPS: ' + err.message, 'error');
  } finally {
    isCapturandoGPS.value = false;
  }
};

const salvarFavorito = () => {
  localStorage.setItem('pmrv_fav_team', JSON.stringify(state.policiaisSelecionados));
  showToast('Equipe salva como favorita!', 'success');
};

const gerarTexto = () => {
  if (state.lotes.length === 0) {
    showToast('Adicione ao menos uma guarnição na lista.', 'warning');
    return;
  }

  const linhas = [
    '🚔 *COMANDO DE POLÍCIA MILITAR RODOVIÁRIA*',
    '📍 *1º BPMRv / 1ª CIA / Posto 19*',
    '',
    '✅ *Guarnição iniciando serviço:*',
    ''
  ];

  state.lotes.forEach((lote, index) => {
    const titulo = lote.mesa ? '🪑 Recepção do P19' : `Viatura PM-${lote.vtr || '---'} [${lote.tipo}]`;
    linhas.push(`${index + 1}. *${titulo}*`);
    linhas.push(`👤 Policiais: ${lote.policiais.join(' / ')}`);
    linhas.push(`⏰ Horário: ${lote.horario}`);
    linhas.push('');
  });

  if (state.lat) {
    linhas.push(`📍 Local Início: ${getGoogleMapsLink(state.lat, state.lng)}`);
  } else {
    linhas.push(`📍 Localização: ${state.localGeral}`);
  }

  state.resultado = linhas.join('\n');
  nextStep();
};

const copiar = () => {
  navigator.clipboard.writeText(state.resultado);
  showToast('Texto copiado para transferência!', 'success');
};

const whatsapp = () => {
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(state.resultado)}`, '_blank');
};

const resetTotal = () => {
  if (confirm('Limpar todo o serviço montado?')) {
    state.lotes = [];
    state.policiaisSelecionados = [];
    currentStep.value = 1;
    showToast('Campos limpos.', 'info');
  }
};
</script>

<template>
  <section id="screen-assumir" class="screen active">
    <div class="header-compact">
      <router-link to="/" class="btn-back">‹</router-link>
      <img src="/img/new_icons/assumir.png" alt="Icon" class="header-icon" />
      <div class="header-title-group">
        <h1 class="header-title">Iniciando Serviço</h1>
        <div class="step-indicator">Passo {{ currentStep }} de 3</div>
      </div>
      <router-link to="/ended" class="btn-exit">Sair</router-link>
    </div>

    <div class="wizard-container">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: (currentStep / 3) * 100 + '%' }"></div>
      </div>

      <!-- STEP 1: QUEM? -->
      <div v-if="currentStep === 1" class="wizard-step animate-fade">
        <div class="card">
          <div class="card-header-flex">
            <h2 class="card-section-title">👤 Quem está de serviço?</h2>
            <button class="btn-fav" @click="salvarFavorito" title="Salvar como favorito">⭐</button>
          </div>
          <p class="card-sub-modern">Selecione os policiais para esta guarnição.</p>

          <div class="pol-grid-modern">
            <button 
              v-for="pol in POLICIAIS_EFETIVO" 
              :key="pol"
              class="chip-pol"
              :class="{ active: state.policiaisSelecionados.includes(pol) }"
              @click="alternarPolicial(pol)"
            >
              {{ pol }}
            </button>
          </div>

          <div v-if="state.policiaisSelecionados.length > 0" class="selection-summary">
            <div class="field-label-orange">Selecionados ({{ state.policiaisSelecionados.length }}):</div>
            <div class="selection-tags">
              <span v-for="nome in state.policiaisSelecionados" :key="nome" class="tag-modern">
                {{ nome }} <button @click="alternarPolicial(nome)">×</button>
              </span>
            </div>
          </div>

          <button v-if="state.policiaisSelecionados.length > 0" class="btn btn-primary btn-full mt-16" @click="nextStep">
            Confirmar Policiais ❯
          </button>
        </div>

        <!-- LISTA DE LOTES JÁ ADICIONADOS -->
        <div v-if="state.lotes.length > 0" class="mt-16">
          <label class="field-label">Guarnições na Lista ({{ state.lotes.length }})</label>
          <div class="lotes-stack">
            <div v-for="(l, i) in state.lotes" :key="i" class="lote-card-modern">
              <div class="lote-info">
                <strong>{{ l.mesa ? '🪑 Recepção' : 'PM-' + l.vtr }}</strong>
                <span>{{ l.policiais.length }} pol. [{{ l.horario }}]</span>
              </div>
              <button @click="removerLote(i)">×</button>
            </div>
          </div>
          <button class="btn btn-success btn-full mt-12" @click="gerarTexto">Gerar Texto Final ⚡</button>
        </div>
      </div>

      <!-- STEP 2: ONDE E QUANDO? (PARA CADA LOTE) -->
      <div v-if="currentStep === 2" class="wizard-step animate-fade">
        <div class="card">
          <h2 class="card-section-title">🚔 Detalhes desta Guarnição</h2>

          <div class="form-field">
            <label class="field-label">Tipo de Posto</label>
            <div class="chip-group">
              <button class="chip chip-lg" :class="{ active: !state.mesa }" @click="state.mesa = false">🚔 Viatura</button>
              <button class="chip chip-lg" :class="{ active: state.mesa }" @click="state.mesa = true">🪑 Recepção P19</button>
            </div>
          </div>

          <div v-if="!state.mesa" class="animate-slide-down">
            <div class="form-field mt-16">
              <label class="field-label">Viatura</label>
              <div class="vtr-grid-modern">
                <button 
                  v-for="v in vtrGrid" 
                  :key="v"
                  class="chip-vtr"
                  :class="{ active: state.vtr === v }"
                  @click="state.vtr = v"
                >
                  {{ v }}
                </button>
                <button class="chip-vtr chip-vtr-manual" :class="{ active: state.vtrManual }" @click="state.vtrManual = !state.vtrManual">✏️</button>
              </div>
              <input v-if="state.vtrManual" v-model="state.vtr" type="text" placeholder="Outro prefixo" class="input-modern mt-8">
            </div>

            <div class="form-field mt-16">
              <label class="field-label">Escala</label>
              <div class="chip-group">
                <button v-for="t in tiposEscala" :key="t" class="chip" :class="{ active: state.tipo === t }" @click="state.tipo = t">{{ t }}</button>
              </div>
            </div>
          </div>

          <div class="form-field mt-16">
            <label class="field-label">Horário desta Equipe</label>
            <select v-model="state.horarioLote" class="input-modern">
              <option v-for="h in horarios" :key="h" :value="h">{{ h }}</option>
            </select>
          </div>

          <button class="btn btn-primary btn-full mt-16" @click="() => { adicionarGuarnicao(); currentStep = 1; }">
            + Adicionar Guarnição à Lista
          </button>
        </div>
      </div>

      <!-- STEP 3: FINALIZAR -->
      <div v-if="currentStep === 3" class="wizard-step animate-fade">
        <div class="card result-card">
          <h2 class="card-section-title">✨ Relato de Início</h2>
          <div class="preview-box-modern">
            <div class="preview-content">{{ state.resultado }}</div>
          </div>

          <div class="action-grid-modern">
            <button class="btn-action btn-copy" @click="copiar">
              <span class="icon">📋</span>
              <span class="label">Copiar Texto</span>
            </button>
            <button class="btn-action btn-whatsapp" @click="whatsapp">
              <span class="icon">📲</span>
              <span class="label">WhatsApp</span>
            </button>
          </div>
          
          <button class="btn btn-outline-danger btn-full mt-16" @click="resetTotal">🗑️ Limpar Tudo</button>
        </div>
      </div>

      <!-- NAV -->
      <div class="wizard-nav" v-if="currentStep < 3">
        <button v-if="currentStep > 1" class="btn btn-secondary" @click="prevStep">Voltar</button>
        <div v-else></div>
        
        <button v-if="state.lotes.length > 0" class="btn btn-primary btn-success" @click="gerarTexto">
          Finalizar Texto ({{ state.lotes.length }}) ⚡
        </button>
      </div>
    </div>

    <!-- GPS FLOAT (Fixed at bottom) -->
    <button v-if="currentStep < 3" class="btn-gps-float" @click="capturarGPS" :disabled="isCapturandoGPS">
      {{ state.lat ? '📍 GPS OK' : '📍 GPS' }}
    </button>
  </section>
</template>

<style scoped>
.header-compact {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 16px;
  gap: 12px;
}
.btn-back { font-size: 24px; text-decoration: none; color: var(--text-main); padding: 4px 8px; }
.header-title-group { flex: 1; }
.header-title { font-size: 16px; font-weight: 700; margin: 0; }
.header-icon { width: 32px; height: 32px; object-fit: contain; }
.step-indicator { font-size: 11px; color: var(--text-dim); }

.wizard-container { max-width: 600px; margin: 0 auto; padding: 0 12px 120px; }
.progress-bar { height: 4px; background: var(--black-10); border-radius: 2px; margin-bottom: 20px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--blue-main); transition: width 0.3s ease; }

.card-header-flex { display: flex; justify-content: space-between; align-items: flex-start; }
.card-section-title { font-size: 18px; margin-bottom: 8px; color: var(--blue-light); }
.card-sub-modern { font-size: 13px; color: var(--text-dim); margin-bottom: 16px; }

.pol-grid-modern {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
  padding: 4px;
}

.chip-pol {
  background: var(--black-20);
  border: 1px solid var(--border-color);
  color: var(--text-dim);
  padding: 10px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.chip-pol.active {
  background: var(--blue-main);
  color: white;
  border-color: var(--blue-main);
  box-shadow: 0 4px 12px rgba(245, 130, 32, 0.2);
}

.selection-summary {
  margin-top: 16px;
  padding: 12px;
  background: rgba(245, 130, 32, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(245, 130, 32, 0.1);
}

.selection-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.tag-modern {
  background: var(--blue-main);
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}
.tag-modern button { background: none; border: none; color: white; cursor: pointer; font-size: 14px; }

.vtr-grid-modern { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.chip-vtr {
  background: var(--black-20);
  border: 1px solid var(--border-color);
  color: var(--text-dim);
  padding: 12px 4px;
  border-radius: 10px;
  font-weight: 800;
  font-family: monospace;
}
.chip-vtr.active { background: var(--laranja); color: white; }

.chip-group { display: flex; gap: 8px; flex-wrap: wrap; }
.chip {
  background: var(--black-20);
  border: 1px solid var(--border-color);
  color: var(--text-dim);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
}
.chip.active { background: var(--blue-main); color: white; }
.chip-lg { padding: 14px 20px; flex: 1; font-size: 15px; font-weight: 700; }

.lotes-stack { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
.lote-card-modern {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; background: var(--black-20); border: 1px solid var(--border-color);
  border-radius: 12px;
}
.lote-info { display: flex; flex-direction: column; gap: 2px; }
.lote-info strong { font-size: 13px; color: var(--blue-light); }
.lote-info span { font-size: 11px; color: var(--text-dim); }
.lote-card-modern button { background: none; border: none; color: #ef4444; font-size: 20px; cursor: pointer; }

.btn-fav { background: none; border: none; font-size: 24px; cursor: pointer; padding: 0; }
.input-modern { width: 100%; background: var(--black-20); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; color: white; }

.preview-box-modern {
  background: #f8f9fa; color: #333; padding: 20px; border-radius: 12px;
  font-family: 'Courier New', Courier, monospace; font-size: 14px;
  white-space: pre-wrap; margin-bottom: 24px; border: 1px solid #ddd;
}

.action-grid-modern { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.btn-action { display: flex; flex-direction: column; align-items: center; padding: 16px; border-radius: 12px; border: none; cursor: pointer; gap: 8px; }
.btn-copy { background: #34a853; color: white; }
.btn-whatsapp { background: #25d366; color: white; }

.wizard-nav { position: fixed; bottom: 0; left: 0; right: 0; padding: 16px; background: var(--card-bg); border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; gap: 12px; z-index: 100; }

.btn-gps-float {
  position: fixed; bottom: 85px; right: 20px; width: 60px; height: 60px;
  border-radius: 50%; background: var(--blue-main); color: white; border: none;
  font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.4); z-index: 101; cursor: pointer;
}

.animate-fade { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.mt-12 { margin-top: 12px; }
.mt-16 { margin-top: 16px; }
.mt-8 { margin-top: 8px; }
</style>
