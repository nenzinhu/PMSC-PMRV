<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getGPSPosition } from '../js/gps';
import { showToast } from '../js/utils';

const router = useRouter();

// --- DADOS DAS INFRAÇÕES ---
const PAT_QUICK_INFRACOES = {
  '518-51': { nome: 'Condutor s/ cinto', codigo: '518-51', gravidade: 'Grave', icon: '👤' },
  '518-52': { nome: 'Passageiro s/ cinto', codigo: '518-52', gravidade: 'Grave', icon: '👥' },
  '736-62': { nome: 'Celular - Uso', codigo: '736-62', gravidade: 'Media', icon: '📱' },
  '763-31': { nome: 'Celular - Segurando', codigo: '763-31', gravidade: 'Gravissima', icon: '🤳' },
  '596-70': { nome: 'Linha Contínua', codigo: '596-70', gravidade: 'Gravissima (5x)', icon: '🚫' },
  '659-92': { nome: 'Não Licenciado', codigo: '659-92', gravidade: 'Gravissima', icon: '📄' },
  '667-00': { nome: 'Luz Queimada', codigo: '667-00', gravidade: 'Media', icon: '💡' },
  '658-00': { nome: 'Placa Ilegível', codigo: '658-00', gravidade: 'Gravissima', icon: '🆔' },
  '581-96': { nome: 'Desobedecer Agente', codigo: '581-96', gravidade: 'Grave', icon: '👮' }
};

// --- ESTADO ---
const plate = ref('');
const selectedInfra = ref(null);
const currentGPS = ref(null);
const batch = ref(JSON.parse(localStorage.getItem('pmrv_pat_batch') || '[]'));
const showResult = ref(false);
const resultText = ref('');
const isRecording = ref(false);

// --- TRANSCRIBER IA PARA PATRULHAMENTO ---
let recognition = null;
if ('webkitSpeechRecognition' in window) {
  const SpeechRecognition = window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.continuous = false; // Parar após cada comando de placa

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript.toUpperCase().replace(/\s/g, '');
    // Tenta detectar se é uma placa (7 caracteres)
    if (text.length >= 7) {
      plate.value = text.substring(0, 7);
      showToast('Placa detectada: ' + plate.value, 'success');
    }
  };
  recognition.onend = () => { isRecording.value = false; };
}

const toggleVoice = () => {
  if (isRecording.value) { recognition.stop(); }
  else {
    recognition.start();
    isRecording.value = true;
    showToast('Dite a placa...', 'info');
  }
};

// --- SIMULAÇÃO OCR (Prepara estrutura para futuro Tesseract/Vision) ---
const handleOCR = (event) => {
  const file = event.target.files[0];
  if (file) {
    showToast('Processando OCR de Placa...', 'info');
    // Aqui no futuro integraremos a biblioteca de OCR. 
    // Por enquanto, simulamos detecção em 2s
    setTimeout(() => {
      plate.value = "ABC1D23"; // Simulação
      showToast('Placa extraída da foto!', 'success');
    }, 2000);
  }
};

// --- LÓGICA GERAL ---
const plateType = computed(() => {
  if (plate.value.length < 7) return 'digitando';
  return /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(plate.value) ? 'mercosul' : 'brasil';
});

const handlePlateInput = (e) => {
  let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (val.length > 7) val = val.substring(0, 7);
  plate.value = val;
};

import { RODOVIAS_SC_FULL } from '../js/rodovias_sc_data';
import { calculateDistance } from '../js/gps';

const captureGPS = async () => {
  try {
    const pos = await getGPSPosition();
    const { latitude, longitude } = pos.coords;
    
    let locName = "Local não identificado";
    let minDistance = 2000;

    for (const [id, data] of Object.entries(RODOVIAS_SC_FULL)) {
      data.refs.forEach(ref => {
        const dist = calculateDistance(latitude, longitude, ref.lat, ref.lng);
        if (dist < minDistance) {
          minDistance = dist;
          locName = `${id} KM ${ref.km.toFixed(1)}`;
        }
      });
    }

    currentGPS.value = locName;
  } catch (err) {
    currentGPS.value = "GPS indisponível";
  }
};

const addRecord = () => {
  if (plate.value.length < 7) { showToast('Informe a placa.', 'warning'); return; }
  if (!selectedInfra.value) { showToast('Selecione a infração.', 'warning'); return; }

  const infra = PAT_QUICK_INFRACOES[selectedInfra.value];
  batch.value.unshift({
    id: Date.now(),
    placa: plate.value,
    infra: infra.nome,
    codigo: infra.codigo,
    hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    local: currentGPS.value || 'Local não registrado'
  });

  localStorage.setItem('pmrv_pat_batch', JSON.stringify(batch.value));
  plate.value = '';
  selectedInfra.value = null;
  showToast('Adicionado ao lote!', 'success');
};

const generateReport = () => {
  if (batch.value.length === 0) return;
  let txt = `👮 *PATRULHAMENTO EM LOTE — PMRv SC*\n\n`;
  batch.value.forEach((v, i) => {
    txt += `${i + 1}. *[${v.placa}]* - ${v.infra}\n📍 ${v.local}\n`;
  });
  resultText.value = txt;
  showResult.value = true;
};

const clearAll = () => {
  if (confirm('Limpar lote?')) {
    batch.value = [];
    localStorage.removeItem('pmrv_pat_batch');
    showResult.value = false;
  }
};

onMounted(captureGPS);
</script>

<template>
  <section id="screen-patrulhamento" class="screen active">
    <div class="header-compact">
      <router-link to="/" class="btn-back">‹</router-link>
      <img src="/img/new_icons/patrulhamento.png" alt="Icon" class="header-icon" />
      <div class="header-title-group">
        <h1 class="header-title">Patrulhamento</h1>
        <div class="step-indicator">Autuação Inteligente em Lote</div>
      </div>
    </div>

    <div class="pat-container">
      <!-- MÓDULOS DE ENTRADA RÁPIDA -->
      <div class="card tech-input-card">
        <div class="plate-main-row">
          <div class="plate-box">
             <input type="text" :value="plate" @input="handlePlateInput" placeholder="ABC0000" maxlength="7">
             <div class="plate-badge" :class="plateType">{{ plateType.toUpperCase() }}</div>
          </div>
          
          <div class="tech-actions">
            <button class="btn-tech" :class="{active: isRecording}" @click="toggleVoice">
               🎙️ <span>Voz</span>
            </button>
            <label class="btn-tech">
               📷 <span>Foto</span>
               <input type="file" accept="image/*" capture="environment" @change="handleOCR" style="display:none">
            </label>
          </div>
        </div>
      </div>

      <!-- SELEÇÃO RÁPIDA -->
      <div class="card mt-16">
        <label class="field-label-tech">Infração Observada</label>
        <div class="infra-grid-tech">
          <button v-for="(infra, cod) in PAT_QUICK_INFRACOES" :key="cod"
            class="infra-btn-tech" :class="{ active: selectedInfra === cod }" @click="selectedInfra = cod">
            <span class="infra-emoji">{{ infra.icon }}</span>
            <span class="infra-label">{{ infra.nome }}</span>
          </button>
        </div>
      </div>

      <button class="btn btn-primary btn-full btn-lg mt-16" @click="addRecord" style="height:70px; font-size:20px; font-weight:900;">
        ⚡ REGISTRAR NO LOTE
      </button>

      <!-- LISTA DO LOTE -->
      <div v-if="batch.length > 0" class="mt-24">
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
          <label class="field-label-tech">Lote Atual ({{ batch.length }})</label>
          <button @click="clearAll" style="background:none; border:none; color:var(--danger); font-weight:bold; font-size:12px; cursor:pointer;">Limpar Lote</button>
        </div>
        
        <div class="batch-list-tech">
          <div v-for="rec in batch" :key="rec.id" class="batch-card-tech">
            <div class="b-plate">{{ rec.placa }}</div>
            <div class="b-info">
              <div class="b-infra">{{ rec.infra }}</div>
              <div class="b-meta">{{ rec.hora }} • {{ rec.local }}</div>
            </div>
          </div>
        </div>

        <button class="btn btn-success btn-full mt-16 btn-lg" @click="generateReport">GERAR RELATÓRIO DO LOTE 📋</button>
      </div>

      <!-- RESULTADO -->
      <div v-if="showResult" class="card mt-24 animate-fade">
        <h2 class="card-title">Relatório para Copiar</h2>
        <pre class="report-pre">{{ resultText }}</pre>
        <div class="action-grid-modern">
          <button class="btn-primary" @click="() => { navigator.clipboard.writeText(resultText); showToast('Copiado!', 'success'); }">📋 Copiar</button>
          <button class="btn-success" @click="() => { window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(resultText)}`, '_blank'); }">📲 Enviar</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pat-container { max-width: 600px; margin: 0 auto; padding: 0 12px 100px; }
.tech-input-card { padding: 12px; }
.plate-main-row { display: flex; gap: 12px; align-items: stretch; }

.plate-box {
  flex: 1; background: white; border: 3px solid #333; border-radius: 10px;
  display: flex; flex-direction: column; overflow: hidden;
}
.plate-box input {
  border: none; background: transparent; color: black; font-family: 'Segoe UI', sans-serif;
  font-size: 38px; font-weight: 900; text-align: center; padding: 5px 0;
}
.plate-badge { font-size: 10px; font-weight: 900; color: white; text-align: center; padding: 2px; }
.plate-badge.mercosul { background: #003399; }
.plate-badge.brasil { background: #111; }
.plate-badge.digitando { background: #999; }

.tech-actions { display: flex; flex-direction: column; gap: 8px; }
.btn-tech {
  background: var(--bg-surface); border: 1px solid var(--border-light);
  border-radius: 10px; display: flex; flex-direction: column; align-items: center;
  justify-content: center; width: 60px; padding: 8px 0; cursor: pointer; color: #fff;
}
.btn-tech.active { border-color: var(--danger); background: rgba(239, 68, 68, 0.1); color: var(--danger); }
.btn-tech span { font-size: 10px; font-weight: 700; margin-top: 4px; }

.field-label-tech { font-size: 11px; font-weight: 900; color: var(--primary-light); text-transform: uppercase; margin-bottom: 10px; display: block; }

.infra-grid-tech { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.infra-btn-tech {
  background: var(--bg-surface); border: 1px solid var(--border-light);
  border-radius: 12px; padding: 12px 6px; display: flex; flex-direction: column;
  align-items: center; gap: 6px; cursor: pointer; transition: all 0.2s;
}
.infra-btn-tech.active { border-color: var(--primary); background: var(--bg-card); box-shadow: 0 0 15px var(--primary-glow); }
.infra-emoji { font-size: 24px; }
.infra-label { font-size: 10px; font-weight: 700; color: var(--text-muted); text-align: center; }

.batch-list-tech { display: flex; flex-direction: column; gap: 8px; }
.batch-card-tech {
  background: var(--bg-card); border: 1px solid var(--border-light); border-left: 4px solid var(--primary);
  border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 14px;
}
.b-plate { font-family: monospace; font-size: 20px; font-weight: 900; color: var(--primary-light); }
.b-infra { font-size: 13px; font-weight: 700; color: white; }
.b-meta { font-size: 11px; color: var(--text-dim); }

.report-pre { background: #f8f9fa; color: #333; padding: 16px; border-radius: 8px; font-size: 13px; white-space: pre-wrap; margin: 16px 0; }
.action-grid-modern { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.action-grid-modern button { padding: 14px; border-radius: 10px; border: none; font-weight: 900; cursor: pointer; }
</style>
