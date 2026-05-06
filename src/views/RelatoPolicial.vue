<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getGPSPosition, getGoogleMapsLink } from '../js/gps';
import { showToast } from '../js/utils';

const router = useRouter();

// --- CONFIGURAÇÕES E DADOS ---
const PMRV_DINAMICAS = {
  '1.1': 'O veículo V1 transitava pela via quando atropelou um pedestre.',
  '1.2': 'O veículo V1 transitava pela via quando atropelou um animal.',
  '2.1': 'Os veículos transitavam no mesmo sentido quando ocorreu abalroamento longitudinal.',
  '2.2': 'Os veículos transitavam em sentidos opostos quando ocorreu abalroamento longitudinal.',
  '2.3': 'O veículo V1 abalroou transversalmente o veículo V2.',
  '3.1': 'Os veículos colidiram frontalmente.',
  '3.2': 'O veículo V1 colidiu na traseira do veículo V2.',
  '3.3': 'O veículo V1 colidiu com outros veículos, ocasionando engavetamento.',
  '4.1': 'O veículo V1 chocou-se contra um poste.',
  '4.6': 'O veículo V1 chocou-se contra uma defensa.',
  '4.9': 'O veículo V1 chocou-se contra [OBJETO].',
  '5.1': 'O veículo V1 perdeu o controle direcional e saiu da pista.',
  '5.3': 'O veículo V1 perdeu o controle direcional, saiu da pista e capotou.',
  '5.4': 'O veículo V1 perdeu o controle direcional, saiu da pista e tombou.',
  '6.1': 'O veículo V1 saiu da pista e chocou-se contra um poste.',
  '6.2': 'O veículo V1 saiu da pista e chocou-se contra um muro.',
  '6.3': 'O veículo V1 saiu da pista e chocou-se contra uma defensa.',
  '6.4': 'O veículo V1 saiu da pista e chocou-se contra [OBJETO].',
  '7.1': 'Ocorrência registrada como [OUTROS].'
};

const subtipos = [
  { id: '1.1', text: '1.1 Atropelamento de pedestre' },
  { id: '1.2', text: '1.2 Atropelamento de animal' },
  { id: '2.1', text: '2.1 Abalroamento longitudinal (mesmo sentido)' },
  { id: '2.2', text: '2.2 Abalroamento longitudinal (sentido oposto)' },
  { id: '2.3', text: '2.3 Abalroamento transversal' },
  { id: '3.1', text: '3.1 Colisão frontal' },
  { id: '3.2', text: '3.2 Colisão traseira' },
  { id: '3.3', text: '3.3 Colisão em engavetamento' },
  { id: '4.1', text: '4.1 Choque em poste' },
  { id: '4.6', text: '4.6 Choque em defensa / barreira' },
  { id: '4.9', text: '4.9 Choque em objeto fixo' },
  { id: '5.1', text: '5.1 Saída de pista simples' },
  { id: '5.3', text: '5.3 Saída de pista com capotamento' },
  { id: '5.4', text: '5.4 Saída de pista com tombamento' },
  { id: '6.1', text: '6.1 Saída de pista seguida de choque em poste' },
  { id: '6.2', text: '6.2 Saída de pista seguida de choque em muro' },
  { id: '6.3', text: '6.3 Saída de pista seguida de choque em defensa' },
  { id: '6.4', text: '6.4 Saída de pista seguida de choque em objeto' },
  { id: '7.1', text: '7.1 Outros' }
];

const floripaRodovias = ['SC-400','SC-401','SC-402','SC-403','SC-404','SC-405','SC-406'];

// --- ESTADO ---
const currentStep = ref(1);
const isCapturandoGPS = ref(false);

const state = reactive({
  sade: '',
  vtr: localStorage.getItem('pmrv_vtr_last') || '',
  cidade: 'Florianópolis/SC',
  rodovia: 'SC-401',
  km: '',
  conhecimento: 'pela Central',
  ocorrencia: 'Sinistro de trânsito com danos materiais',
  subtipo: '1.1',
  sentido: 'Centro–Bairro',
  sentidoManual: '',
  nomeObjeto: '',
  descricaoOutros: '',
  dinamicaTexto: '',
  horaAuto: true,
  inputHora: '',
  qtdLeve: 0,
  qtdGrave: 0,
  qtdGravissima: 0,
  lat: null,
  lng: null
});

// --- PERSISTÊNCIA ---
onMounted(() => {
  const saved = localStorage.getItem('pmrv_relato_last');
  if (saved) {
    const data = JSON.parse(saved);
    Object.assign(state, data);
  }
});

watch(state, (newVal) => {
  localStorage.setItem('pmrv_relato_last', JSON.stringify(newVal));
}, { deep: true });

// --- TRANSCRIBER POLICIAL (SPEECH IA) ---
const isRecording = ref(false);
const transcriptionBuffer = ref('');
let recognition = null;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        processarFala(event.results[i][0].transcript);
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
  };

  recognition.onerror = (event) => {
    console.error('Erro no Reconhecimento:', event.error);
    isRecording.value = false;
    showToast('Erro no microfone: ' + event.error, 'error');
  };

  recognition.onend = () => {
    isRecording.value = false;
  };
}

const toggleRecording = () => {
  if (!recognition) {
    alert('Seu navegador não suporta reconhecimento de voz.');
    return;
  }
  if (isRecording.value) {
    recognition.stop();
  } else {
    recognition.start();
    isRecording.value = true;
    showToast('Ouvindo... Fale a dinâmica do acidente.', 'info');
  }
};

// IA de Processamento de Termos Técnicos
const processarFala = (texto) => {
  let resultado = texto.toLowerCase();
  
  // Dicionário de Termos Policiais (IA Simples de Mapeamento)
  const termos = {
    'bateu na traseira': 'colidiu na traseira',
    'bateu de frente': 'colidiu frontalmente',
    'atropelou': 'transitava pela via quando atropelou',
    'capotou': 'perdeu o controle direcional, saiu da pista e capotou',
    'tombou': 'perdeu o controle direcional, saiu da pista e tombou',
    'fugiu': 'evadiu-se do local',
    'bebeu': 'apresentava sinais de embriaguez',
    'carro 1': 'veículo V1',
    'carro 2': 'veículo V2',
    'v1': 'veículo V1',
    'v2': 'veículo V2',
    'acidente': 'sinistro de trânsito'
  };

  Object.entries(termos).forEach(([fala, tecnico]) => {
    resultado = resultado.replace(new RegExp(fala, 'g'), tecnico);
  });

  // Capitaliza a primeira letra e adiciona ao campo
  resultado = resultado.charAt(0).toUpperCase() + resultado.slice(1) + '. ';
  state.dinamicaTexto += resultado;
};

// --- PERSISTÊNCIA ---
watch(() => state.vtr, (val) => {
  localStorage.setItem('pmrv_vtr_last', val);
});

// --- LÓGICA ---
const nextStep = () => { if (currentStep.value < 4) currentStep.value++; };
const prevStep = () => { if (currentStep.value > 1) currentStep.value--; };

import { RODOVIAS_SC_FULL } from '../js/rodovias_sc_data';
import { calculateDistance } from '../js/gps';

const capturarGPS = async () => {
  isCapturandoGPS.value = true;
  try {
    const pos = await getGPSPosition();
    const { latitude, longitude } = pos.coords;
    
    let nearest = null;
    let minDistance = 2000;

    for (const [id, data] of Object.entries(RODOVIAS_SC_FULL)) {
      data.refs.forEach(ref => {
        const dist = calculateDistance(latitude, longitude, ref.lat, ref.lng);
        if (dist < minDistance) {
          minDistance = dist;
          nearest = { id, km: ref.km };
        }
      });
    }

    if (nearest) {
      state.rodovia = nearest.id;
      state.km = nearest.km.toFixed(3).replace('.', ',');
      showToast(`Localizado: ${nearest.id} KM ${state.km}`, 'success');
    } else {
      showToast('Posição capturada (Rodovia não identificada)', 'info');
    }
    
    state.lat = latitude;
    state.lng = longitude;
  } catch (err) {
    showToast('Erro ao capturar GPS', 'error');
  } finally {
    isCapturandoGPS.value = false;
  }
};

const formatarKM = (val) => {
  if (!val) return '---';
  const num = parseFloat(String(val).replace(',', '.').replace(/[^\d.]/g, ''));
  return isNaN(num) ? '---' : num.toLocaleString('pt-BR', { minimumFractionDigits: 3 });
};

const gerarTexto = (negrito = false) => {
  const b = negrito ? '*' : '';
  const kmFormatado = formatarKM(state.km);
  const sentidoReal = state.sentido === 'MANUAL' ? state.sentidoManual : state.sentido;
  const selectedSubtipo = subtipos.find(s => s.id === state.subtipo);
  let tipoLabel = selectedSubtipo ? selectedSubtipo.text.split(' ').slice(1).join(' ') : '';
  
  if (state.subtipo === '7.1' && state.descricaoOutros) {
    tipoLabel = state.descricaoOutros;
  }

  let infoV = '';
  if (state.ocorrencia !== 'Sinistro de trânsito com danos materiais') {
    const partes = [];
    if (state.qtdLeve > 0) partes.push(`${String(state.qtdLeve).padStart(2,'0')} leve(s)`);
    if (state.qtdGrave > 0) partes.push(`${String(state.qtdGrave).padStart(2,'0')} grave(s)`);
    if (state.qtdGravissima > 0) partes.push(`${String(state.qtdGravissima).padStart(2,'0')} gravíssima(s)`);
    infoV = '\n' + b + 'Vítimas:' + b + ' ' + (partes.length ? partes.join(', ') : 'Qtd não informada');
  }

  const hora = state.horaAuto 
    ? new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : (state.inputHora || '---');

  const data = new Date().toLocaleDateString('pt-BR');

  let linkGPS = '';
  if (state.lat && state.lng) {
    linkGPS = `\n${b}Localização (Maps):${b} ${getGoogleMapsLink(state.lat, state.lng)}`;
  }

  return (
    `${b}COMANDO DE POLÍCIA MILITAR RODOVIÁRIA${b}\n` +
    `${b}1º BPMRv / 1ª CIA / Posto 19${b}\n` +
    `${b}Protocolo SADE:${b} ${state.sade || '---'}\n` +
    `${b}Data:${b} ${data}\n` +
    `${b}Hora:${b} ${hora}\n` +
    `${b}Rodovia:${b} ${state.rodovia} / ${b}KM:${b} ${kmFormatado}\n` +
    `${b}Cidade:${b} ${state.cidade}${linkGPS}\n` +
    `${b}Tipo de ocorrência:${b} ${state.ocorrencia}\n` +
    `${b}Tipo de sinistro:${b} ${tipoLabel}${infoV}\n` +
    `\n` +
    `A guarnição foi acionada ${state.conhecimento} para atendimento de sinistro na rodovia ${state.rodovia}, km ${kmFormatado}, sentido ${sentidoReal || '---'}, sendo empenhada a Viatura PM-${state.vtr || '---'}.\n` +
    `${state.dinamicaTexto}\n` +
    `\n` +
    `Foram adotadas as providências administrativas cabíveis.`
  );
};

const relatorioPreview = computed(() => gerarTexto(false));

watch(() => state.rodovia, (newRod) => {
  if (floripaRodovias.includes(newRod)) {
    state.cidade = 'Florianópolis/SC';
  } else if (newRod === 'SC-407') {
    state.cidade = 'Biguaçu/SC'; 
  } else if (newRod === 'SC-281') {
    state.cidade = 'São José/SC'; 
  }
});

watch([() => state.subtipo, () => state.nomeObjeto, () => state.descricaoOutros], () => {
  let texto = PMRV_DINAMICAS[state.subtipo] || '';
  if (state.subtipo === '4.9' || state.subtipo === '6.4') {
    texto = texto.replace('[OBJETO]', state.nomeObjeto || 'objeto fixo');
  }
  if (state.subtipo === '7.1') {
    texto = texto.replace('[OUTROS]', state.descricaoOutros || 'natureza não especificada');
  }
  state.dinamicaTexto = texto;
}, { immediate: true });

const copiar = () => {
  navigator.clipboard.writeText(gerarTexto(false));
  showToast('Copiado para a área de transferência!', 'success');
};

const whatsapp = () => {
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(gerarTexto(true))}`, '_blank');
};

const limpar = () => {
  if (confirm('Deseja limpar todos os campos?')) {
    Object.assign(state, {
      sade: '',
      km: '',
      sentidoManual: '',
      nomeObjeto: '',
      descricaoOutros: '',
      qtdLeve: 0,
      qtdGrave: 0,
      qtdGravissima: 0,
      horaAuto: true,
      inputHora: '',
      lat: null,
      lng: null
    });
    currentStep.value = 1;
    showToast('Dados limpos.', 'info');
  }
};
</script>

<template>
  <section id="screen-pmrv" class="screen active">
    <div class="header-compact">
      <router-link to="/" class="btn-back">‹</router-link>
      <div class="header-emblem">
        <img src="/img/new_icons/pmrv.png" alt="Emblema PMRV" class="emblem-img" />
      </div>
      <div class="header-title-group">
        <h1 class="header-title">Relato Policial</h1>
        <div class="step-indicator">Passo {{ currentStep }} de 4</div>
      </div>
      <router-link to="/ended" class="btn-exit">Sair</router-link>
    </div>

    <div class="wizard-container">
      <!-- PROGRESS BAR -->
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: (currentStep / 4) * 100 + '%' }"></div>
      </div>

      <!-- STEP 1: LOCAL E PROTOCOLO -->
      <div v-if="currentStep === 1" class="wizard-step animate-fade">
        <div class="card">
          <h2 class="card-section-title">📍 Local e Protocolo</h2>
          
          <div class="form-grid">
            <div class="form-row">
              <div class="form-field">
                <label class="field-label">Protocolo SADE</label>
                <input type="text" v-model="state.sade" placeholder="Ex: 1234567" inputmode="numeric" class="input-modern">
              </div>
              <div class="form-field">
                <label class="field-label">Viatura PM-</label>
                <input type="text" v-model="state.vtr" placeholder="0000" maxlength="4" inputmode="numeric" class="input-modern">
              </div>
            </div>

            <div class="form-field">
              <button class="btn btn-gps btn-full" @click="capturarGPS" :disabled="isCapturandoGPS">
                <span v-if="!isCapturandoGPS">📍 {{ state.lat ? 'GPS Atualizado' : 'Capturar Localização GPS' }}</span>
                <span v-else>📡 Obtendo coordenadas...</span>
              </button>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label class="field-label">Rodovia</label>
                <select v-model="state.rodovia" class="input-modern">
                  <optgroup label="Posto 19">
                    <option v-for="r in floripaRodovias" :key="r" :value="r">{{ r }}</option>
                  </optgroup>
                  <optgroup label="Outras">
                    <option value="SC-407">SC-407</option>
                    <option value="SC-281">SC-281</option>
                    <option value="OUTRA">Outra...</option>
                  </optgroup>
                </select>
              </div>
              <div class="form-field">
                <label class="field-label">KM</label>
                <input type="text" v-model="state.km" placeholder="Ex: 12,500" class="input-modern">
              </div>
            </div>

            <div class="form-field">
              <label class="field-label">Sentido</label>
              <div class="chip-group">
                <button 
                  v-for="opt in ['Centro–Bairro', 'Bairro–Centro', 'Crescente', 'Decrescente', 'MANUAL']" 
                  :key="opt"
                  class="chip"
                  :class="{ active: state.sentido === opt }"
                  @click="state.sentido = opt"
                >
                  {{ opt === 'MANUAL' ? 'Outro' : opt }}
                </button>
              </div>
              <input v-if="state.sentido === 'MANUAL'" type="text" v-model="state.sentidoManual" class="input-modern mt-8" placeholder="Digite o sentido...">
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 2: CLASSIFICAÇÃO -->
      <div v-if="currentStep === 2" class="wizard-step animate-fade">
        <div class="card">
          <h2 class="card-section-title">📑 Classificação</h2>
          
          <div class="form-field">
            <label class="field-label">Tipo de Ocorrência</label>
            <div class="chip-group-vertical">
              <button 
                v-for="opt in [
                  {v: 'Sinistro de trânsito com danos materiais', l: 'Apenas Danos Materiais'},
                  {v: 'Sinistro de trânsito com vítima(s)', l: 'Com Vítima(s)'},
                  {v: 'Sinistro de trânsito com morte', l: 'Com Óbito no Local'}
                ]" 
                :key="opt.v"
                class="chip chip-large"
                :class="{ active: state.ocorrencia === opt.v }"
                @click="state.ocorrencia = opt.v"
              >
                {{ opt.l }}
              </button>
            </div>
          </div>

          <div v-if="state.ocorrencia !== 'Sinistro de trânsito com danos materiais'" class="vítimas-box animate-slide-down">
            <label class="field-label-orange">Quantidade de Vítimas</label>
            <div class="form-row-3">
              <div class="counter-field">
                <span>Leve</span>
                <input type="number" v-model="state.qtdLeve" min="0">
              </div>
              <div class="counter-field">
                <span>Grave</span>
                <input type="number" v-model="state.qtdGrave" min="0">
              </div>
              <div class="counter-field">
                <span>Óbito</span>
                <input type="number" v-model="state.qtdGravissima" min="0">
              </div>
            </div>
          </div>

          <div class="form-field mt-16">
            <label class="field-label">Natureza do Sinistro</label>
            <select v-model="state.subtipo" class="input-modern">
              <option v-for="s in subtipos" :key="s.id" :value="s.id">{{ s.text }}</option>
            </select>
          </div>

          <div v-if="['4.9', '6.4'].includes(state.subtipo)" class="form-field animate-fade">
            <label class="field-label">Qual o objeto?</label>
            <input type="text" v-model="state.nomeObjeto" placeholder="Ex: mureta, árvore..." class="input-modern">
          </div>
        </div>
      </div>

      <!-- STEP 3: DINÂMICA -->
      <div v-if="currentStep === 3" class="wizard-step animate-fade">
        <div class="card">
          <h2 class="card-section-title">📋 Dinâmica e Horário</h2>

          <!-- NOVO: BOTÃO TRANSCRIBER IA -->
          <div class="form-field mb-16">
            <label class="field-label">Narrar Dinâmica (IA Policial)</label>
            <button 
              class="btn btn-full" 
              :class="isRecording ? 'btn-danger pulse' : 'btn-primary'"
              @click="toggleRecording"
              style="height: 60px; font-size: 16px;"
            >
              {{ isRecording ? '🛑 Parar Transcrição...' : '🎙️ Falar Relato (IA)' }}
            </button>
            <p v-if="isRecording" class="help-text mt-8 text-center animate-pulse">Estou ouvindo... Fale como o acidente aconteceu.</p>
          </div>

          <div class="form-field">
            <label class="field-label">Texto da Dinâmica</label>
            <textarea v-model="state.dinamicaTexto" rows="8" class="input-modern textarea-relato" placeholder="Aguardando fala ou digitação..."></textarea>
            <p class="help-text">A IA converterá termos como 'bateu' em 'colidiu', 'fugiu' em 'evadiu-se', etc.</p>
          </div>

          <div class="form-field mt-16">
            <label class="field-label">Meio de Conhecimento</label>
            <select v-model="state.conhecimento" class="input-modern">
              <option value="pela Central">Pela Central (COPOME/CRE)</option>
              <option value="por populares">Por solicitação de populares</option>
              <option value="por iniciativa própria">Iniciativa própria (Patrulhamento)</option>
              <option value="pelo envolvido">Pelo próprio envolvido (no Posto)</option>
            </select>
          </div>

          <div class="form-field">
            <label class="field-label">Horário</label>
            <div class="chip-group">
              <button class="chip" :class="{ active: state.horaAuto }" @click="state.horaAuto = true">Automático</button>
              <button class="chip" :class="{ active: !state.horaAuto }" @click="state.horaAuto = false">Manual</button>
            </div>
            <input v-if="!state.horaAuto" type="time" v-model="state.inputHora" class="input-modern mt-8">
          </div>
        </div>
      </div>

      <!-- STEP 4: PREVIEW E ENVIO -->
      <div v-if="currentStep === 4" class="wizard-step animate-fade">
        <div class="card result-card">
          <h2 class="card-section-title">✨ Relato Finalizado</h2>
          
          <div class="preview-box">
            <div class="preview-content">{{ relatorioPreview }}</div>
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

          <button class="btn btn-outline-danger btn-full mt-16" @click="limpar">🗑️ Iniciar Novo Relato</button>
        </div>
      </div>

      <!-- NAVIGATION BUTTONS -->
      <div class="wizard-nav">
        <button v-if="currentStep > 1" class="btn btn-secondary" @click="prevStep">Anterior</button>
        <div v-else></div> <!-- spacer -->
        
        <button v-if="currentStep < 4" class="btn btn-primary btn-next" @click="nextStep">
          Próximo <span>›</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Estilos existentes mantidos e aprimorados */
.header-emblem {
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.emblem-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.header-compact { display: flex; align-items: center; padding: 12px 16px; background: var(--card-bg); border-bottom: 1px solid var(--border-color); margin-bottom: 16px; gap: 12px; }
.btn-back { font-size: 24px; text-decoration: none; color: var(--text-main); padding: 4px 8px; }
.header-title-group { flex: 1; }
.header-title { font-size: 16px; font-weight: 700; margin: 0; }
.step-indicator { font-size: 11px; color: var(--text-dim); }

.wizard-container { max-width: 600px; margin: 0 auto; padding: 0 12px 100px; }
.progress-bar { height: 4px; background: var(--black-10); border-radius: 2px; margin-bottom: 20px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--blue-main); transition: width 0.3s ease; }

.card-section-title { font-size: 18px; margin-bottom: 20px; color: var(--blue-light); }
.input-modern { width: 100%; background: var(--black-20); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; color: white; font-size: 15px; }

/* Transcriber Specific */
.pulse { animation: pulse-red 1.5s infinite; }
@keyframes pulse-red {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}
.animate-pulse { animation: pulse-opacity 2s infinite; }
@keyframes pulse-opacity { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

.chip-group { display: flex; gap: 8px; flex-wrap: wrap; }
.chip { background: var(--black-20); border: 1px solid var(--border-color); color: var(--text-dim); padding: 8px 16px; border-radius: 20px; font-size: 13px; cursor: pointer; }
.chip.active { background: var(--blue-main); color: white; }

.vítimas-box { margin-top: 16px; padding: 16px; background: rgba(255, 152, 0, 0.05); border: 1px solid rgba(255, 152, 0, 0.2); border-radius: 12px; }
.form-row-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.counter-field { display: flex; flex-direction: column; align-items: center; gap: 8px; }

.textarea-relato { font-family: monospace; font-size: 14px; line-height: 1.5; background: #000; border-color: #333; }

.wizard-nav { position: fixed; bottom: 0; left: 0; right: 0; padding: 16px; background: var(--card-bg); border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; gap: 12px; z-index: 100; }

.preview-box { background: #f8f9fa; color: #333; padding: 16px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 13px; white-space: pre-wrap; margin-bottom: 20px; max-height: 300px; overflow-y: auto; }
.action-grid-modern { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.btn-action { display: flex; flex-direction: column; align-items: center; padding: 16px; border-radius: 12px; border: none; cursor: pointer; gap: 8px; }
.btn-copy { background: #34a853; color: white; }
.btn-whatsapp { background: #25d366; color: white; }

.animate-fade { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.mb-16 { margin-bottom: 16px; }
.mt-8 { margin-top: 8px; }
</style>
