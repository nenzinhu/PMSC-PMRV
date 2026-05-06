<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { CARRO_IMGS, MOTO_IMGS, DAN_DIAGRAMAS, V360_MOTO_PARTES } from '../js/danos-data';
import { showToast } from '../js/utils';

const router = useRouter();

// --- CONFIGURAÇÕES ---
const DAN_VISTA_LABELS = { frontal: 'Frente', traseira: 'Atrás', esquerda: 'Esq.', direita: 'Dir.' };
const DAN_DMG_TYPES = [
  { id: 'amassado', label: 'Amassado', emoji: '🔨', color: '#f97316' },
  { id: 'riscado', label: 'Riscado', emoji: '✏️', color: '#a78bfa' },
  { id: 'quebrado', label: 'Quebrado', emoji: '💥', color: '#ef4444' },
  { id: 'trincado', label: 'Trincado', emoji: '🔍', color: '#38bdf8' }
];

// --- ESTADO ---
const state = reactive({
  veiculos: [],
  veiculoAtivo: 0,
  step: 'select', // 'select', 'map'
  modalOpen: false,
  modalPoint: null,
  showResult: false,
  resultadoText: ''
});

// --- PERSISTÊNCIA ---
onMounted(() => {
  const saved = localStorage.getItem('pmrv_danos');
  if (saved) {
    state.veiculos = JSON.parse(saved);
  }
});

watch(() => state.veiculos, (newVal) => {
  localStorage.setItem('pmrv_danos', JSON.stringify(newVal));
}, { deep: true });

const currentVeiculo = computed(() => state.veiculos[state.veiculoAtivo]);

// --- LÓGICA ---
const initMotoDb = () => {
  const mk = (num, x, y) => {
    const p = V360_MOTO_PARTES.find(i => parseInt(i.n) === num);
    return { id: `M${num}`, num, label: p ? p.t : 'Parte', dano: null, x, y };
  };
  return {
    frontal: [mk(1, 52, 40), mk(2, 52, 60), mk(3, 52, 82), mk(5, 40, 53), mk(6, 64, 53)],
    traseira: [mk(12, 76, 54), mk(14, 76, 48), mk(24, 52, 71), mk(27, 52, 90), mk(33, 53, 42)],
    direita: [mk(11, 53, 31), mk(13, 22, 62), mk(29, 35, 48)],
    esquerda: [mk(4, 8, 71), mk(18, 54, 43), mk(21, 67, 63)]
  };
};

const addVeiculo = (tipo) => {
  state.veiculos.push({
    id: Date.now(),
    tipo,
    vista: 'frontal',
    danos: {}, // Para carro: { pontoId: typeId }
    motoDb: tipo === 'moto' ? initMotoDb() : null
  });
  state.veiculoAtivo = state.veiculos.length - 1;
  state.step = 'map';
  showToast('Veículo adicionado para mapeamento.', 'info');
};

const openDamageSelector = (point) => {
  state.modalPoint = point;
  state.modalOpen = true;
};

const setDamage = (typeId) => {
  const v = currentVeiculo.value;
  if (v.tipo === 'carro') {
    v.danos[state.modalPoint.id] = typeId;
  } else {
    const point = v.motoDb[v.vista].find(p => p.id === state.modalPoint.id);
    if (point) point.dano = typeId;
  }
  state.modalOpen = false;
  showToast('Dano registrado!', 'success');
};

const removeDamage = () => {
  const v = currentVeiculo.value;
  if (v.tipo === 'carro') {
    delete v.danos[state.modalPoint.id];
  } else {
    const point = v.motoDb[v.vista].find(p => p.id === state.modalPoint.id);
    if (point) point.dano = null;
  }
  state.modalOpen = false;
  showToast('Registro removido.', 'info');
};

const removeVeiculo = (idx) => {
  if (confirm('Remover este veículo e todos os seus danos?')) {
    state.veiculos.splice(idx, 1);
    if (state.veiculos.length === 0) state.step = 'select';
    else state.veiculoAtivo = 0;
    showToast('Veículo removido.', 'info');
  }
};

const generateReport = () => {
  if (state.veiculos.length === 0) return;
  let txt = `📋 *RELATÓRIO DE DANOS APARENTES*\n📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`;

  state.veiculos.forEach((v, i) => {
    txt += `🚗 *VEÍCULO ${i + 1} (${v.tipo.toUpperCase()})*\n`;
    
    if (v.tipo === 'carro') {
      const views = ['frontal', 'traseira', 'esquerda', 'direita'];
      views.forEach(view => {
        const points = DAN_DIAGRAMAS.carro[view].pontos.filter(p => v.danos[p.id]);
        if (points.length > 0) {
          txt += `📍 ${DAN_VISTA_LABELS[view]}:\n`;
          points.forEach(p => {
            const damageId = v.danos[p.id];
            const damageLabel = DAN_DMG_TYPES.find(t => t.id === damageId)?.label || damageId;
            txt += `  • ${p.label}: ${damageLabel}\n`;
          });
        }
      });
    } else {
      Object.keys(v.motoDb).forEach(view => {
        const points = v.motoDb[view].filter(p => p.dano);
        if (points.length > 0) {
          txt += `📍 ${DAN_VISTA_LABELS[view]}:\n`;
          points.forEach(p => {
            const damageLabel = DAN_DMG_TYPES.find(t => t.id === p.dano)?.label || p.dano;
            txt += `  • ${p.label}: ${damageLabel}\n`;
          });
        }
      });
    }
    txt += `--------------------------\n`;
  });

  state.resultadoText = txt;
  state.showResult = true;
};
</script>

<template>
  <section id="screen-danos" class="screen active">
    <div class="header-compact">
      <router-link to="/" class="btn-back">‹</router-link>
      <img src="/img/new_icons/danos.png" alt="Icon" class="header-icon" />
      <div class="header-title-group">
        <h1 class="header-title">Danos Aparentes</h1>
        <div class="step-indicator">{{ state.veiculos.length }} veículo(s) registrados</div>
      </div>
      <router-link to="/ended" class="btn-exit">Sair</router-link>
    </div>

    <div class="danos-container">
      <!-- STEP: SELEÇÃO DE VEÍCULO -->
      <div v-if="state.step === 'select'" class="animate-fade">
        <div class="card">
          <h2 class="card-section-title">🚗 Novo Veículo</h2>
          <div class="vehicle-type-grid">
            <button class="btn-type-card" @click="addVeiculo('carro')">
              <span class="icon">🚗</span>
              <span class="label">Carro / Caminhão</span>
            </button>
            <button class="btn-type-card" @click="addVeiculo('moto')">
              <span class="icon">🏍️</span>
              <span class="label">Motocicleta</span>
            </button>
          </div>

          <div v-if="state.veiculos.length > 0" class="mt-24">
            <label class="field-label">Veículos na Lista</label>
            <div class="v-list-stack">
              <div v-for="(v, idx) in state.veiculos" :key="v.id" class="v-list-item">
                <div class="v-info" @click="state.veiculoAtivo = idx; state.step = 'map'">
                  <span class="v-icon">{{ v.tipo === 'carro' ? '🚗' : '🏍️' }}</span>
                  <span class="v-name">Veículo {{ idx + 1 }}</span>
                </div>
                <button class="btn-del-v" @click="removeVeiculo(idx)">×</button>
              </div>
            </div>
            <button class="btn btn-success btn-full btn-lg mt-16" @click="generateReport">
              Gerar Relatório Final ⚡
            </button>
          </div>
        </div>
      </div>

      <!-- STEP: MAPEAMENTO -->
      <div v-if="state.step === 'map'" class="animate-fade">
        <div class="map-header-row">
          <button class="btn-text" @click="state.step = 'select'">❮ Voltar</button>
          <div class="v-active-badge">{{ currentVeiculo.tipo === 'carro' ? '🚗 Carro' : '🏍️ Moto' }} {{ state.veiculoAtivo + 1 }}</div>
        </div>

        <div class="card map-card">
          <div class="view-tabs">
            <button 
              v-for="(label, key) in DAN_VISTA_LABELS" 
              :key="key" 
              class="v-tab"
              :class="{ active: currentVeiculo.vista === key }"
              @click="currentVeiculo.vista = key"
            >
              {{ label }}
            </button>
          </div>

          <div class="diagram-canvas mt-16">
            <!-- DIAGRAMA CARRO -->
            <svg 
              v-if="currentVeiculo.tipo === 'carro'"
              :viewBox="DAN_DIAGRAMAS.carro[currentVeiculo.vista].vb"
              class="svg-diagram"
            >
              <image :href="CARRO_IMGS[currentVeiculo.vista]" x="0" y="0" width="100%" height="100%" />
              <g 
                v-for="p in DAN_DIAGRAMAS.carro[currentVeiculo.vista].pontos" 
                :key="p.id"
                class="svg-hit-area"
                @click="openDamageSelector(p)"
              >
                <circle 
                  :cx="(p.px/100) * 800" 
                  :cy="(p.py/100) * 450" 
                  r="22" 
                  class="point-circle"
                  :style="{ fill: currentVeiculo.danos[p.id] ? DAN_DMG_TYPES.find(t => t.id === currentVeiculo.danos[p.id]).color : '' }"
                />
                <text :x="(p.px/100) * 800" :cy="(p.py/100) * 450" class="point-text">{{ p.id.replace(/[A-Z]/, '') }}</text>
                <text v-if="currentVeiculo.danos[p.id]" :x="(p.px/100) * 800" :y="(p.py/100) * 450 - 28" class="point-emoji">
                  {{ DAN_DMG_TYPES.find(t => t.id === currentVeiculo.danos[p.id]).emoji }}
                </text>
              </g>
            </svg>

            <!-- DIAGRAMA MOTO -->
            <div v-else class="moto-canvas">
              <img :src="MOTO_IMGS['moto_' + currentVeiculo.vista]" class="moto-img-bg">
              <div 
                v-for="p in currentVeiculo.motoDb[currentVeiculo.vista]" 
                :key="p.id"
                class="moto-hit-point"
                :class="{ active: p.dano }"
                :style="{ 
                  left: p.x + '%', 
                  top: p.y + '%',
                  backgroundColor: p.dano ? DAN_DMG_TYPES.find(t => t.id === p.dano).color : ''
                }"
                @click="openDamageSelector(p)"
              >
                {{ p.num }}
                <span v-if="p.dano" class="moto-emoji-float">{{ DAN_DMG_TYPES.find(t => t.id === p.dano).emoji }}</span>
              </div>
            </div>
          </div>

          <div class="map-footer mt-16">
            <button class="btn btn-primary btn-full" @click="state.step = 'select'">Concluir Veículo ✓</button>
          </div>
        </div>
      </div>

      <!-- RELATÓRIO FINAL -->
      <div v-if="state.showResult" class="card result-card mt-16 animate-fade">
        <h2 class="card-section-title">✨ Relatório Consolidado</h2>
        <div class="preview-box-modern">
          <div class="preview-content">{{ state.resultadoText }}</div>
        </div>
        <div class="action-grid-modern">
          <button class="btn-action btn-copy" @click="() => { navigator.clipboard.writeText(state.resultadoText); showToast('Copiado!', 'success'); }">📋 Copiar</button>
          <button class="btn-action btn-whatsapp" @click="() => window.open(`https://wa.me/?text=${encodeURIComponent(state.resultadoText)}`, '_blank')">📲 WhatsApp</button>
        </div>
        <button class="btn btn-outline-danger btn-full mt-16" @click="() => { state.veiculos = []; state.showResult = false; state.step = 'select'; showToast('Dados limpos.', 'info'); }">🗑️ Limpar Tudo</button>
      </div>
    </div>

    <!-- MODAL DE SELEÇÃO DE DANO -->
    <div class="modal-damage" :class="{ open: state.modalOpen }" @click.self="state.modalOpen = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Dano em: {{ state.modalPoint?.label }}</h3>
          <button @click="state.modalOpen = false">×</button>
        </div>
        <div class="dmg-type-grid">
          <button 
            v-for="t in DAN_DMG_TYPES" 
            :key="t.id"
            class="btn-dmg-type"
            :style="{ '--c': t.color }"
            @click="setDamage(t.id)"
          >
            <span class="d-emoji">{{ t.emoji }}</span>
            <span class="d-label">{{ t.label }}</span>
          </button>
        </div>
        <button class="btn btn-danger btn-full mt-16" @click="removeDamage">🗑 Remover Registro</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.header-compact { display: flex; align-items: center; padding: 12px 16px; background: var(--card-bg); border-bottom: 1px solid var(--border-color); margin-bottom: 16px; gap: 12px; }
.btn-back { font-size: 24px; text-decoration: none; color: var(--text-main); padding: 4px 8px; }
.header-title-group { flex: 1; }
.header-title { font-size: 16px; font-weight: 700; margin: 0; }
.step-indicator { font-size: 11px; color: var(--text-dim); }

.danos-container { max-width: 600px; margin: 0 auto; padding: 0 12px 100px; }

/* SELEÇÃO DE TIPO */
.vehicle-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.btn-type-card {
  background: var(--black-20); border: 1px solid var(--border-color); border-radius: 16px;
  padding: 24px 16px; display: flex; flex-direction: column; align-items: center; gap: 12px;
  cursor: pointer; transition: all 0.2s;
}
.btn-type-card:active { transform: scale(0.96); }
.btn-type-card .icon { font-size: 32px; }
.btn-type-card .label { font-size: 13px; font-weight: 700; color: var(--text-dim); }

.v-list-stack { display: flex; flex-direction: column; gap: 8px; }
.v-list-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px;
}
.v-info { display: flex; align-items: center; gap: 12px; flex: 1; cursor: pointer; }
.v-icon { font-size: 20px; }
.v-name { font-weight: 700; color: var(--blue-light); }
.btn-del-v { background: none; border: none; color: #ef4444; font-size: 24px; cursor: pointer; }

/* MAPA */
.map-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.btn-text { background: none; border: none; color: var(--blue-main); font-weight: 800; cursor: pointer; }
.v-active-badge { background: var(--blue-main); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 800; }

.view-tabs { display: flex; gap: 4px; background: var(--black-20); padding: 4px; border-radius: 10px; }
.v-tab {
  flex: 1; border: none; background: none; padding: 8px 4px; color: var(--text-dim);
  font-size: 11px; font-weight: 700; border-radius: 6px; cursor: pointer;
}
.v-tab.active { background: var(--blue-main); color: white; }

.diagram-canvas { background: #07090f; border-radius: 12px; position: relative; border: 1px solid var(--border-color); }
.svg-diagram { width: 100%; height: auto; display: block; }
.point-circle { fill: rgba(59, 130, 246, 0.2); stroke: var(--blue-main); stroke-width: 2px; }
.point-text { fill: white; font-size: 14px; font-weight: 900; text-anchor: middle; dominant-baseline: central; pointer-events: none; }
.point-emoji { font-size: 24px; text-anchor: middle; pointer-events: none; }

.moto-canvas { position: relative; width: 100%; overflow: hidden; }
.moto-img-bg { width: 100%; display: block; }
.moto-hit-point {
  position: absolute; width: 28px; height: 28px; background: rgba(59, 130, 246, 0.4);
  border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  color: white; font-size: 11px; font-weight: 900; transform: translate(-50%, -50%); cursor: pointer;
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
}
.moto-hit-point.active { border-color: white; box-shadow: 0 0 15px currentColor; }
.moto-emoji-float { position: absolute; top: -20px; font-size: 20px; }

/* MODAL */
.modal-damage {
  position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 1000;
  display: none; align-items: center; justify-content: center; padding: 20px;
}
.modal-damage.open { display: flex; }
.modal-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 20px; width: 100%; max-width: 350px; padding: 20px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-header h3 { font-size: 16px; color: var(--blue-light); }
.modal-header button { background: none; border: none; color: white; font-size: 24px; }

.dmg-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.btn-dmg-type {
  background: var(--black-20); border: 2px solid var(--border-color); border-radius: 12px;
  padding: 16px 8px; display: flex; flex-direction: column; align-items: center; gap: 8px;
  cursor: pointer; border-color: var(--c);
}
.btn-dmg-type .d-emoji { font-size: 24px; }
.btn-dmg-type .d-label { font-size: 13px; font-weight: 700; color: white; }

.preview-box-modern { background: #f8f9fa; color: #333; padding: 20px; border-radius: 12px; font-family: monospace; font-size: 13px; white-space: pre-wrap; margin-bottom: 20px; border: 1px solid #ddd; }
.action-grid-modern { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.btn-action { padding: 16px; border-radius: 12px; border: none; font-weight: 800; cursor: pointer; }
.btn-copy { background: #34a853; color: white; }
.btn-whatsapp { background: #25d366; color: white; }

.animate-fade { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.mt-24 { margin-top: 24px; }
.mt-16 { margin-top: 16px; }
</style>
