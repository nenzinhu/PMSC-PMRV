<script setup>
import { ref, onMounted, reactive, nextTick } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Assets constants
const SINISTROS_MANIFEST_URL = '/img/sinistros/manifest.json';

// State
const croquiSvg = ref(null);
const croquiVias = ref(null);
const croquiObjetos = ref(null);
const selectedId = ref(null);
const isDragging = ref(false);
const showIconModal = ref(false);
const iconCategory = ref('veiculos');
const manifest = ref([]);

let startX = 0;
let startY = 0;
let currentTransformX = 0;
let currentTransformY = 0;

// Icon mapping (Emojis as fallback/legacy)
const ICON_MAP = {
  'v1': { e: "🚗", l: "V1" },
  'v2': { e: "🚗", l: "V2", c: "filter: hue-rotate(90deg);" },
  'moto': { e: "🏍️", l: "MOTO" },
  'caminhao': { e: "🚚", l: "CAMINHÃO" },
  'onibus': { e: "🚌", l: "ÔNIBUS" },
  'bicicleta': { e: "🚲", l: "BIKE" },
  'viatura': { e: "🚓", l: "PMRV" },
  'ambulancia': { e: "🚑", l: "SAMU" },
  'reboque': { e: "🚛", l: "CARGA" },
  'cone': { e: "⚠️", l: "CONE", fs: 30 },
  'pare': { e: "🛑", l: "PARE", fs: 35 },
  'arvore': { e: "🌳", l: "ÁRVORE", fs: 35 },
  'poste': { e: "💡", l: "POSTE", fs: 30 },
  'norte': { e: "🧭", l: "NORTE", fs: 35 },
  'frenagem': { e: "⬛", l: "FRENAGEM", fs: 10 }
};

onMounted(async () => {
  try {
    const res = await fetch(SINISTROS_MANIFEST_URL);
    manifest.value = await res.json();
  } catch (err) {
    console.error('Failed to load sinistros manifest', err);
  }
});

// Actions
const goBack = () => router.push({ name: 'home' });

const adicionarVia = (tipo) => {
  const id = 'via-' + Date.now();
  let content = '';

  // Infrastructure logic
  switch (tipo) {
    case 'reta-2':
      content = `<rect width="300" height="100" fill="#333" /><line x1="0" y1="50" x2="300" y2="50" stroke="yellow" stroke-width="2" stroke-dasharray="10,10" /><line x1="0" y1="5" x2="300" y2="5" stroke="white" stroke-width="2" /><line x1="0" y1="95" x2="300" y2="95" stroke="white" stroke-width="2" />`;
      break;
    case 'reta-3':
      content = `<rect width="300" height="150" fill="#333" /><line x1="0" y1="50" x2="300" y2="50" stroke="white" stroke-width="2" /><line x1="0" y1="100" x2="300" y2="100" stroke="white" stroke-width="2" /><line x1="0" y1="25" x2="300" y2="25" stroke="yellow" stroke-width="1" stroke-dasharray="5,5" /><line x1="0" y1="125" x2="300" y2="125" stroke="yellow" stroke-width="1" stroke-dasharray="5,5" />`;
      break;
    case 'reta-4':
      content = `<rect width="300" height="200" fill="#333" /><line x1="0" y1="50" x2="300" y2="50" stroke="white" stroke-width="2" /><line x1="0" y1="100" x2="300" y2="100" stroke="yellow" stroke-width="2" stroke-dasharray="10,10" /><line x1="0" y1="150" x2="300" y2="150" stroke="white" stroke-width="2" />`;
      break;
    case 'ponte-1':
      content = `<rect width="300" height="80" fill="#444" /><line x1="0" y1="0" x2="300" y2="0" stroke="black" stroke-width="5" /><line x1="0" y1="80" x2="300" y2="80" stroke="black" stroke-width="5" />`;
      break;
    case 'ponte-4':
      content = `<rect width="300" height="200" fill="#444" /><line x1="0" y1="0" x2="300" y2="0" stroke="black" stroke-width="8" /><line x1="0" y1="200" x2="300" y2="200" stroke="black" stroke-width="8" />`;
      break;
    case 'curva-aberta-dir':
      content = `<path d="M 0 200 Q 100 0 300 0" fill="none" stroke="#333" stroke-width="100" />`;
      break;
    case 'curva-aberta-esq':
      content = `<path d="M 300 200 Q 200 0 0 0" fill="none" stroke="#333" stroke-width="100" />`;
      break;
    case 'curva-fechada-dir':
      content = `<path d="M 0 300 Q 0 0 300 0" fill="none" stroke="#333" stroke-width="100" />`;
      break;
    case 'curva-fechada-esq':
      content = `<path d="M 300 300 Q 300 0 0 0" fill="none" stroke="#333" stroke-width="100" />`;
      break;
  }

  createSvgElement(croquiVias.value, id, content, 'via', { x: 50, y: 150 });
};

const inserirIcone = (tipo) => {
  const id = 'obj-' + Date.now();
  const cfg = ICON_MAP[tipo] || { e: "❓", l: "OBJ" };
  const fontSize = cfg.fs || 40;
  
  let content = `<text y="10" font-size="${fontSize}" text-anchor="middle" style="${cfg.c || ''}">${cfg.e}</text>`;
  if (tipo === 'frenagem') {
    content = `<rect x="-15" y="0" width="30" height="5" fill="#555" rx="2" />`;
  }

  const finalContent = `
    <g class="icon-body">${content}</g>
    <text y="-25" font-size="10" font-weight="bold" fill="rgba(255,255,255,0.8)" text-anchor="middle" class="icon-label">${cfg.l}</text>
  `;

  createSvgElement(croquiObjetos.value, id, finalContent, 'objeto', { x: 150, y: 150 });
  showIconModal.value = false;
};

const inserirSvg = async (filename) => {
  const id = 'svg-' + Date.now();
  try {
    const res = await fetch(`/img/sinistros/${filename}`);
    const svgText = await res.text();
    const cleanSvg = svgText.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
    
    const content = `<g class="icon-body" transform="translate(-15, -15) scale(1.5, 1.5)" style="filter: invert(1);">${cleanSvg}</g>`;
    createSvgElement(croquiObjetos.value, id, content, 'objeto', { x: 150, y: 150 });
  } catch (err) {
    console.error('Failed to load SVG icon', err);
  }
  showIconModal.value = false;
};

const createSvgElement = (parent, id, innerHTML, type, pos) => {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "g");
  el.setAttribute('id', id);
  el.setAttribute('data-type', type);
  el.setAttribute('transform', `translate(${pos.x}, ${pos.y}) rotate(0) scale(1, 1)`);
  el.style.cursor = 'move';
  el.innerHTML = innerHTML;
  parent.appendChild(el);
  selecionar(id);
};

// Selection & Drag
const selecionar = (id) => {
  selectedId.value = id;
};

const onStart = (e) => {
  const target = e.target.closest('g[id]');
  if (!target || target.id === 'croqui-vias' || target.id === 'croqui-objetos') {
    selectedId.value = null;
    return;
  }
  
  selecionar(target.id);
  isDragging.value = true;
  
  const coords = getCoords(e);
  startX = coords.x;
  startY = coords.y;
  
  const transform = target.getAttribute('transform') || 'translate(0,0)';
  const match = /translate\(([^, ]+)[, ]*([^)]+)\)/.exec(transform);
  if (match) {
    currentTransformX = parseFloat(match[1]);
    currentTransformY = parseFloat(match[2]);
  }
};

const onMove = (e) => {
  if (!isDragging.value || !selectedId.value) return;
  e.preventDefault();
  
  const el = document.getElementById(selectedId.value);
  if (!el) return;

  const coords = getCoords(e);
  const dx = coords.x - startX;
  const dy = coords.y - startY;
  const newX = currentTransformX + dx;
  const newY = currentTransformY + dy;
  
  const currentTransform = el.getAttribute('transform') || '';
  const otherTransforms = currentTransform.replace(/translate\([^)]+\)/, '').trim();
  el.setAttribute('transform', `translate(${newX}, ${newY}) ${otherTransforms}`);
};

const onEnd = () => {
  isDragging.value = false;
};

const getCoords = (e) => {
  const svg = croquiSvg.value;
  const CTM = svg.getScreenCTM();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (clientX - CTM.e) / CTM.a,
    y: (clientY - CTM.f) / CTM.d
  };
};

// Transformations
const girar = () => {
  if (!selectedId.value) return;
  const el = document.getElementById(selectedId.value);
  const transform = el.getAttribute('transform') || '';
  const rotateMatch = /rotate\(([^)]+)\)/.exec(transform);
  let angle = rotateMatch ? parseFloat(rotateMatch[1]) : 0;
  angle = (angle + 15) % 360;
  const otherTransforms = transform.replace(/rotate\([^)]+\)/, '').trim();
  el.setAttribute('transform', `${otherTransforms} rotate(${angle})`);
};

const escala = (delta) => {
  if (!selectedId.value) return;
  const el = document.getElementById(selectedId.value);
  const transform = el.getAttribute('transform') || '';
  const scaleMatch = /scale\(([^, )]+)[, ]*([^)]+)?\)/.exec(transform);
  
  let sx = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
  let sy = (scaleMatch && scaleMatch[2]) ? parseFloat(scaleMatch[2]) : sx;
  
  sx = Math.max(0.2, sx + delta);
  sy = Math.max(0.2, sy + delta);
  
  const otherTransforms = transform.replace(/scale\([^)]+\)/, '').trim();
  el.setAttribute('transform', `${otherTransforms} scale(${sx.toFixed(2)}, ${sy.toFixed(2)})`);
};

const espelhar = () => {
  if (!selectedId.value) return;
  const el = document.getElementById(selectedId.value);
  const transform = el.getAttribute('transform') || '';
  const scaleMatch = /scale\(([^, )]+)[, ]*([^)]+)?\)/.exec(transform);
  
  let sx = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
  let sy = (scaleMatch && scaleMatch[2]) ? parseFloat(scaleMatch[2]) : sx;
  
  sx = sx * -1;
  const otherTransforms = transform.replace(/scale\([^)]+\)/, '').trim();
  el.setAttribute('transform', `${otherTransforms} scale(${sx.toFixed(2)}, ${sy.toFixed(2)})`);
};

const camada = (dir) => {
  if (!selectedId.value) return;
  const el = document.getElementById(selectedId.value);
  const parent = el.parentNode;
  if (dir === 'frente' && el.nextElementSibling) {
    parent.appendChild(el);
  } else if (dir === 'tras' && el.previousElementSibling) {
    parent.insertBefore(el, parent.firstChild);
  }
};

const remover = () => {
  if (!selectedId.value) return;
  document.getElementById(selectedId.value)?.remove();
  selectedId.value = null;
};

const limpar = () => {
  if (confirm("Deseja limpar todo o croqui?")) {
    croquiVias.value.innerHTML = '';
    croquiObjetos.value.innerHTML = '';
    selectedId.value = null;
  }
};

const exportar = async () => {
  const svg = croquiSvg.value;
  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();
  
  canvas.width = svg.clientWidth * 2;
  canvas.height = svg.clientHeight * 2;
  
  const svgBlob = new Blob([svgData], {type: "image/svg+xml;charset=utf-8"});
  const url = URL.createObjectURL(svgBlob);
  
  img.onload = () => {
    ctx.fillStyle = "#222"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = "Croqui_PMRv_" + Date.now() + ".png";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };
  img.src = url;
};

</script>

<template>
  <section class="screen active" aria-label="Croqui Dinâmico">
    <div class="back-row">
      <button class="btn btn-sm" @click="goBack">← Voltar</button>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title-with-icon">
          <img src="/img/new_icons/croqui.png" alt="Icon" class="card-title-icon" />
          <div>
            <h2 class="card-title">Croqui Dinâmico</h2>
            <p class="card-sub">Monte o desenho técnico do sinistro para o relatório.</p>
          </div>
        </div>
      </div>

      <!-- Canvas Area -->
      <div class="croqui-container">
        <svg 
          ref="croquiSvg"
          id="croqui-svg" 
          viewBox="0 0 400 400" 
          width="100%" 
          height="100%"
          @mousedown="onStart"
          @mousemove="onMove"
          @mouseup="onEnd"
          @mouseleave="onEnd"
          @touchstart="onStart"
          @touchmove="onMove"
          @touchend="onEnd"
        >
          <rect width="400" height="400" fill="#222" />
          <g ref="croquiVias" id="croqui-vias"></g>
          <g ref="croquiObjetos" id="croqui-objetos"></g>
          
          <!-- Selection Highlight -->
          <template v-if="selectedId">
            <use :href="'#' + selectedId" style="pointer-events: none; opacity: 0.3; filter: blur(2px) brightness(2);" />
          </template>
        </svg>
      </div>

      <!-- Controls Toolbar -->
      <div class="croqui-toolbar mt-12">
        <div class="toolbar-group">
          <label class="field-label-orange">Vias</label>
          <div class="croqui-toolbar">
            <label class="field-label">Retas</label>
            <div class="grid grid-cols-3 gap-2 mb-4">
              <button class="btn btn-sm" @click="adicionarVia('reta-2')">2 Faixas</button>
              <button class="btn btn-sm" @click="adicionarVia('reta-3')">3 Faixas</button>
              <button class="btn btn-sm" @click="adicionarVia('reta-4')">4 Faixas</button>
            </div>

            <label class="field-label">Pontes</label>
            <div class="grid grid-cols-2 gap-2 mb-4">
              <button class="btn btn-sm" @click="adicionarVia('ponte-1')">Ponte 1 Faixa</button>
              <button class="btn btn-sm" @click="adicionarVia('ponte-4')">Ponte 4 Faixas</button>
            </div>

            <label class="field-label">Curvas</label>
            <div class="grid grid-cols-2 gap-2">
              <button class="btn btn-sm" @click="adicionarVia('curva-aberta-dir')">Aberta Direita</button>
              <button class="btn btn-sm" @click="adicionarVia('curva-aberta-esq')">Aberta Esquerda</button>
              <button class="btn btn-sm" @click="adicionarVia('curva-fechada-dir')">Fechada Direita</button>
              <button class="btn btn-sm" @click="adicionarVia('curva-fechada-esq')">Fechada Esquerda</button>
            </div>
          </div>
        </div>

        <div class="toolbar-group mt-12">
          <label class="field-label-orange">Elementos</label>
          <div class="flex gap-8">
            <button class="btn btn-sm btn-primary" @click="showIconModal = true">📂 Adicionar Ícone...</button>
          </div>
        </div>

        <!-- Transform Controls (Only if selected) -->
        <div v-if="selectedId" class="toolbar-group mt-12 animate-fade-in">
          <label class="field-label-orange">Ajustes Elemento</label>
          <div class="flex flex-wrap gap-8">
            <button class="btn btn-sm" @click="girar">🔄 Girar</button>
            <button class="btn btn-sm" @click="escala(0.1)">➕ Aumentar</button>
            <button class="btn btn-sm" @click="escala(-0.1)">➖ Diminuir</button>
            <button class="btn btn-sm" @click="espelhar">↔️ Espelhar</button>
            <button class="btn btn-sm" @click="camada('frente')">🔼 Topo</button>
            <button class="btn btn-sm" @click="camada('tras')">🔽 Fundo</button>
            <button class="btn btn-sm btn-danger" @click="remover">🗑 Remover</button>
          </div>
        </div>

        <div class="divider mt-16 mb-16"></div>

        <div class="flex gap-8">
          <button class="btn btn-success flex-1" @click="exportar">💾 Salvar Imagem (PNG)</button>
          <button class="btn btn-danger" @click="limpar">🗑 Limpar Tudo</button>
        </div>
      </div>
    </div>

    <!-- Icons Modal -->
    <div v-if="showIconModal" class="modal-overlay" @click.self="showIconModal = false">
      <div class="modal-content card">
        <div class="card-header">
          <h3 class="card-title">Biblioteca de Ícones</h3>
          <button class="btn btn-sm" @click="showIconModal = false">✕</button>
        </div>

        <div class="infra-tabs mt-8">
          <button class="infra-tab-btn" :class="{ active: iconCategory === 'veiculos' }" @click="iconCategory = 'veiculos'">
            <img src="/img/new_icons/envolvidos.png" alt="Veículos" class="icon-sm" /> Veículos
          </button>
          <button class="infra-tab-btn" :class="{ active: iconCategory === 'objetos' }" @click="iconCategory = 'objetos'">
            <img src="/img/new_icons/danos.png" alt="Objetos" class="icon-sm" /> Objetos
          </button>
          <button class="infra-tab-btn" :class="{ active: iconCategory === 'sinistros' }" @click="iconCategory = 'sinistros'">
            <img src="/img/new_icons/pmrv.png" alt="Sinistros" class="icon-sm" /> Sinistros
          </button>
        </div>

        <div class="icon-grid mt-16">
          <!-- Veículos -->
          <template v-if="iconCategory === 'veiculos'">
            <div v-for="(v, k) in ['v1', 'v2', 'moto', 'caminhao', 'onibus', 'bicicleta', 'viatura', 'ambulancia', 'reboque']" :key="k" 
                 class="icon-item" @click="inserirIcone(v)">
              <span class="icon-preview">{{ ICON_MAP[v].e }}</span>
              <span class="icon-name">{{ ICON_MAP[v].l }}</span>
            </div>
          </template>

          <!-- Objetos -->
          <template v-if="iconCategory === 'objetos'">
            <div v-for="(v, k) in ['cone', 'pare', 'arvore', 'poste', 'norte', 'frenagem']" :key="k" 
                 class="icon-item" @click="inserirIcone(v)">
              <span class="icon-preview">{{ ICON_MAP[v].e }}</span>
              <span class="icon-name">{{ ICON_MAP[v].l }}</span>
            </div>
          </template>

          <!-- Sinistros (Manifest) -->
          <template v-if="iconCategory === 'sinistros'">
            <div v-for="item in manifest" :key="item.code" class="icon-item" @click="inserirSvg(item.file.split('/').pop())">
              <img :src="'/' + item.file" class="icon-svg-preview" style="filter: invert(1);" />
              <span class="icon-name" style="font-size: 9px;">{{ item.title }}</span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.croqui-container {
  width: 100%;
  aspect-ratio: 1/1;
  background: #111;
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
  touch-action: none;
}

.croqui-toolbar {
  display: flex;
  flex-direction: column;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-content {
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.icon-item {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-item:hover {
  background: rgba(245,130,32,0.15);
  border-color: var(--laranja);
}

.icon-preview {
  font-size: 32px;
  margin-bottom: 4px;
}

.icon-svg-preview {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.icon-name {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--muted);
  text-align: center;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
