<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from '../js/utils';
import { DAN_DIAGRAMAS, V360_MOTO_PARTES } from '../js/danos-data';

const router = useRouter();

// Configurações locais para tradução no relatório consolidado
const DAN_DMG_MAP = {
  amassado: 'Amassado',
  riscado: 'Riscado',
  quebrado: 'Quebrado',
  trincado: 'Trincado'
};

// --- ESTADO ---
const state = reactive({
  envolvidos: [],
  danos: [],
  patrulhamento: [],
  pesos: null,
  tacografo: null,
  localFotos: [],
  resultado: ''
});

const showResult = ref(false);

// --- CARREGAMENTO DE DADOS ---
const carregarDados = () => {
  state.envolvidos = JSON.parse(localStorage.getItem('pmrv_envolvidos') || '[]');
  state.danos = JSON.parse(localStorage.getItem('pmrv_danos') || '[]');
  state.patrulhamento = JSON.parse(localStorage.getItem('pmrv_pat_batch') || '[]');
  state.pesos = JSON.parse(localStorage.getItem('pmrv_pesos_last') || 'null');
  state.tacografo = JSON.parse(localStorage.getItem('pmrv_tacografo_last') || 'null');
};

onMounted(() => {
  carregarDados();
});

// --- LÓGICA DE GERAÇÃO ---
const gerarRelatorio = () => {
  const data = new Date().toLocaleDateString('pt-BR');
  let txt = '📋 *RELATÓRIO OPERACIONAL CONSOLIDADO — Pmrv*\n';
  txt += 'Data: ' + data + '\n';
  txt += '━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

  // ── 🚔 PATRULHAMENTO ───────────────────
  if (state.patrulhamento.length > 0) {
    txt += '\n🚔 *INFRAÇÕES EM LOTE (PATRULHAMENTO)*\n';
    state.patrulhamento.forEach((v, i) => {
      txt += `${i + 1}. [${v.placa}] - ${v.infra} (${v.hora})\n`;
    });
    txt += '──────────────────────────\n';
  }

  // ── 👥 ENVOLVIDOS ────────────────────────────────
  txt += '\n👥 *ENVOLVIDOS NO SINISTRO*\n';
  if (state.envolvidos.length === 0) {
    txt += '(nenhum envolvido registrado)\n';
  } else {
    state.envolvidos.forEach((env, i) => {
      txt += `\n*${env.tipo} ${i + 1}:* ${env.nome || 'N/I'}\n`;
      if (env.veiculo) txt += `- Veículo: ${env.veiculo}\n`;
      if (env.relato)  txt += `- Relato: ${env.relato}\n`;
    });
  }

  // ── 🚗 DANOS APARENTES ──────────────────────────────────────
  if (state.danos.length > 0) {
    txt += '\n🚗 *DANOS APARENTES*\n';
    state.danos.forEach((v, idx) => {
      txt += `\n*V${idx + 1} (${v.tipo.toUpperCase()}):* `;
      let danosArr = [];
      
      if (v.tipo === 'carro') {
        // Mapear pontos de carro
        const todosPontos = [
          ...DAN_DIAGRAMAS.carro.frontal.pontos,
          ...DAN_DIAGRAMAS.carro.traseira.pontos,
          ...DAN_DIAGRAMAS.carro.esquerda.pontos,
          ...DAN_DIAGRAMAS.carro.direita.pontos
        ];
        
        Object.entries(v.danos || {}).forEach(([pontoId, dmgId]) => {
          const ponto = todosPontos.find(p => p.id === pontoId);
          const labelPeca = ponto ? ponto.label : pontoId;
          const labelDano = DAN_DMG_MAP[dmgId] || dmgId;
          danosArr.push(`${labelPeca}: ${labelDano}`);
        });
      } else {
        // Para moto, percorrer todas as vistas no motoDb
        Object.values(v.motoDb || {}).forEach(points => {
          points.forEach(p => {
            if (p.dano) {
              const labelDano = DAN_DMG_MAP[p.dano] || p.dano;
              danosArr.push(`${p.label}:${labelDano}`);
            }
          });
        });
      }
      txt += danosArr.length ? danosArr.join(', ') : 'Sem avarias registradas.';
      txt += '\n';
    });
  }

  // ── ⚖️ PESOS E DIMENSÕES ────────────────────────────────────
  if (state.pesos) {
    txt += '\n⚖️ *PESOS E DIMENSÕES*\n';
    txt += `- PBT Apurado: ${state.pesos.apurado} kg\n`;
    txt += `- Limite: ${state.pesos.limite} kg\n`;
    if (state.pesos.excesso > 0) {
      txt += `- Status: ⚠️ EXCESSO DE ${state.pesos.excesso} kg\n`;
    } else {
      txt += `- Status: ✅ OK\n`;
    }
  }

  // ── ⏱️ TACÓGRAFO ──────────────────────────────────
  if (state.tacografo) {
    const { descanso, conducao } = state.tacografo;
    if (descanso.res || conducao.res) {
      txt += '\n⏱️ *ANÁLISE DE TACÓGRAFO*\n';
      if (descanso.res) txt += `- Descanso: ${descanso.res}\n`;
      if (conducao.res) txt += `- Condução: ${conducao.res}\n`;
    }
  }

  txt += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  txt += '_Gerado via App Pmrv - Otimização & Agilidade_';
  
  state.resultado = txt;
  showResult.value = true;
};

const copiar = () => {
  navigator.clipboard.writeText(state.resultado);
  showToast('Relatório copiado!', 'success');
};

const whatsapp = () => {
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(state.resultado)}`, '_blank');
};

const handleLocalFotos = (event) => {
  const files = event.target.files;
  if (!files) return;
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => { state.localFotos.push(e.target.result); };
    reader.readAsDataURL(file);
  });
};

const limparTudo = () => {
  if (confirm('Deseja limpar todos os dados de todos os módulos?')) {
    localStorage.removeItem('pmrv_envolvidos');
    localStorage.removeItem('pmrv_danos');
    localStorage.removeItem('pmrv_pat_batch');
    localStorage.removeItem('pmrv_pesos_last');
    localStorage.removeItem('pmrv_tacografo_last');
    state.localFotos = [];
    showResult.value = false;
    carregarDados();
    showToast('Todos os dados foram limpos.', 'info');
  }
};
</script>

<template>
  <section id="screen-relatorio" class="screen active">
    <div class="header-compact">
      <router-link to="/" class="btn-back">‹</router-link>
      <img src="/relatorio.png" alt="Icon" class="header-icon" />
      <div class="header-title-group">
        <h1 class="header-title">Relatório Completo</h1>
        <div class="step-indicator">Consolidação de Dados</div>
      </div>
      <router-link to="/ended" class="btn-exit">Sair</router-link>
    </div>

    <div class="relatorio-container">
      <div class="card mb-16">
        <h2 class="card-section-title">📸 Fotos do Local</h2>
        <p class="card-sub-modern">Anexe fotos gerais da ocorrência para o relatório.</p>
        
        <label class="foto-label-modern mt-12">
          <span class="icon">🖼️</span> Adicionar Fotos do Local
          <input type="file" accept="image/*" multiple style="display:none;" @change="handleLocalFotos">
        </label>

        <div class="foto-grid-modern mt-12" v-if="state.localFotos.length > 0">
          <div v-for="(foto, idx) in state.localFotos" :key="idx" class="foto-item-modern">
            <img :src="foto">
            <button class="foto-del-btn" @click="state.localFotos.splice(idx, 1)">×</button>
          </div>
        </div>
      </div>

      <div class="summary-card card mb-16">
        <h2 class="card-section-title">📊 Resumo de Dados</h2>
        <div class="summary-list">
          <div class="summary-item" :class="{ empty: state.envolvidos.length === 0 }">
            <span class="label">Envolvidos:</span>
            <span class="val">{{ state.envolvidos.length }}</span>
          </div>
          <div class="summary-item" :class="{ empty: state.danos.length === 0 }">
            <span class="label">Veículos c/ Danos:</span>
            <span class="val">{{ state.danos.length }}</span>
          </div>
          <div class="summary-item" :class="{ empty: state.patrulhamento.length === 0 }">
            <span class="label">Infrações em Lote:</span>
            <span class="val">{{ state.patrulhamento.length }}</span>
          </div>
          <div class="summary-item" :class="{ empty: !state.pesos }">
            <span class="label">Dados de Pesos:</span>
            <span class="val">{{ state.pesos ? 'Sim' : 'Não' }}</span>
          </div>
          <div class="summary-item" :class="{ empty: !state.tacografo }">
            <span class="label">Dados de Tacógrafo:</span>
            <span class="val">{{ state.tacografo ? 'Sim' : 'Não' }}</span>
          </div>
        </div>
      </div>

      <button class="btn btn-primary btn-full btn-lg" @click="gerarRelatorio">
        ⚡ GERAR RELATÓRIO CONSOLIDADO
      </button>

      <div v-if="showResult" class="card mt-24 animate-fade">
        <h2 class="card-section-title">✨ Texto Final</h2>
        <div class="preview-box-modern">
          <div class="preview-content">{{ state.resultado }}</div>
        </div>

        <div class="action-grid-modern">
          <button class="btn-action btn-copy" @click="copiar">
            <span class="icon">📋</span>
            <span class="label">Copiar</span>
          </button>
          <button class="btn-action btn-whatsapp" @click="whatsapp">
            <span class="icon">📲</span>
            <span class="label">WhatsApp</span>
          </button>
        </div>
      </div>

      <button class="btn btn-outline-danger btn-full mt-24" @click="limparTudo">
        🗑️ Limpar Todos os Módulos
      </button>
    </div>
  </section>
</template>

<style scoped>
.header-compact { display: flex; align-items: center; padding: 12px 16px; background: var(--card-bg); border-bottom: 1px solid var(--border-color); margin-bottom: 16px; gap: 12px; }
.btn-back { font-size: 24px; text-decoration: none; color: var(--text-main); padding: 4px 8px; }
.header-title-group { flex: 1; }
.header-title { font-size: 16px; font-weight: 700; margin: 0; }
.step-indicator { font-size: 11px; color: var(--text-dim); }

.relatorio-container { max-width: 600px; margin: 0 auto; padding: 0 12px 100px; }

.card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 16px; }
.card-section-title { font-size: 16px; color: var(--blue-light); margin-bottom: 4px; }
.card-sub-modern { font-size: 12px; color: var(--text-dim); }

.summary-list { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.summary-item { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-main); }
.summary-item.empty { opacity: 0.5; }
.summary-item .val { font-weight: 700; color: var(--blue-light); }

.foto-label-modern {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px; background: rgba(59, 130, 246, 0.1); border: 1px dashed var(--blue-main);
  border-radius: 10px; color: var(--blue-light); font-size: 13px; font-weight: 700; cursor: pointer;
}

.foto-grid-modern { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; }
.foto-item-modern { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); }
.foto-item-modern img { width: 100%; height: 100%; object-fit: cover; }
.foto-del-btn {
  position: absolute; top: 4px; right: 4px; background: rgba(239, 68, 68, 0.8);
  color: white; border: none; border-radius: 50%; width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center; font-size: 14px; cursor: pointer;
}

.preview-box-modern { background: #f8f9fa; color: #333; padding: 20px; border-radius: 12px; font-family: monospace; font-size: 13px; white-space: pre-wrap; margin-bottom: 20px; border: 1px solid #ddd; }
.action-grid-modern { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.btn-action { display: flex; flex-direction: column; align-items: center; padding: 16px; border-radius: 12px; border: none; cursor: pointer; gap: 8px; }
.btn-copy { background: #34a853; color: white; }
.btn-whatsapp { background: #25d366; color: white; }

.animate-fade { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.mb-16 { margin-bottom: 16px; }
.mt-12 { margin-top: 12px; }
.mt-24 { margin-top: 24px; }
</style>
