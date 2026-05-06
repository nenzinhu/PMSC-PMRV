<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { RODOVIAS_REF_DATA } from '../js/rodovias_ref_data';
import { startGPSWatch, stopGPSWatch, calculateDistance } from '../js/gps';

const state = reactive({
  rodovia: 'SC-401',
  km: '',
  result: null,
  isTracking: false,
  currentPos: null,
  autoDetectedRod: null,
  lastKmUpdate: 0
});

// Encontra a rodovia e o KM mais próximo baseado na posição real
const findNearestRoadPoint = (lat, lng) => {
    let nearest = null;
    let minDistance = 500; // Raio de busca de 500 metros

    // Percorre todas as rodovias e referências para encontrar a mais próxima da posição atual
    for (const [id, data] of Object.entries(RODOVIAS_REF_DATA)) {
        data.refs.forEach(refPoint => {
            if (refPoint.lat && refPoint.lng) {
                const dist = calculateDistance(lat, lng, refPoint.lat, refPoint.lng);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearest = { id, km: refPoint.km };
                }
            }
        });
    }
    return nearest;
};

const handleGPSUpdate = (position) => {
    state.currentPos = position.coords;
    
    // Se o rastreamento automático estiver ligado
    if (state.isTracking) {
        const found = findNearestRoadPoint(position.coords.latitude, position.coords.longitude);
        if (found) {
            state.rodovia = found.id;
            // Só atualiza se mudou mais de 10 metros para evitar "pulo" no input
            if (Math.abs(found.km - state.lastKmUpdate) > 0.01) {
                state.km = found.km.toFixed(3).replace('.', ',');
                state.lastKmUpdate = found.km;
                localizar();
            }
        }
    }
};

const toggleTracking = () => {
    state.isTracking = !state.isTracking;
    if (state.isTracking) {
        startGPSWatch(handleGPSUpdate);
    } else {
        stopGPSWatch();
    }
};

const localizar = () => {
    const rawVal = state.km.replace(',', '.');
    const kmVal = parseFloat(rawVal);
    
    if (isNaN(kmVal)) {
        alert("Por favor, digite um KM válido.");
        return;
    }

    const rodData = RODOVIAS_REF_DATA[state.rodovia];
    if (!rodData) return;

    let anterior = null;
    let proximo = null;
    const refsSorted = [...rodData.refs].sort((a, b) => a.km - b.km);

    for (let i = 0; i < refsSorted.length; i++) {
        if (refsSorted[i].km <= kmVal) {
            anterior = refsSorted[i];
        }
        if (refsSorted[i].km > kmVal) {
            proximo = refsSorted[i];
            break;
        }
    }

    const diffAnt = anterior ? (kmVal - anterior.km) : 999;
    let descRef = "";
    let msgDist = "";
    let fotoUrl = null;

    if (anterior && Math.abs(diffAnt) < 0.010) { 
        descRef = anterior.desc;
        msgDist = "📍 Você está EXATAMENTE neste ponto de referência.";
        fotoUrl = anterior.foto;
    } else {
        if (anterior && proximo) {
            const metrosAnt = Math.round(diffAnt * 1000);
            const metrosProx = Math.round((proximo.km - kmVal) * 1000);
            descRef = `${anterior.desc} ↔️ ${proximo.desc}`;
            msgDist = `📏 Você está a **${metrosAnt}m** após o(a) ${anterior.desc}.<br>🔭 Faltam **${metrosProx}m** para chegar em: ${proximo.desc}.`;
            fotoUrl = anterior.foto || proximo.foto;
        } else if (anterior) {
            const metros = Math.round(diffAnt * 1000);
            descRef = anterior.desc;
            msgDist = `📏 Você está a **${metros}m** após o último marco (Crescente).`;
            fotoUrl = anterior.foto;
        } else if (proximo) {
            const metros = Math.round((proximo.km - kmVal) * 1000);
            descRef = proximo.desc;
            msgDist = `📏 Você está a **${metros}m** antes do primeiro marco (Decrescente).`;
            fotoUrl = proximo.foto;
        }
    }

    state.result = {
      rodovia: state.rodovia,
      km: kmVal.toFixed(3).replace('.', ','),
      desc: descRef,
      dist: msgDist,
      foto: fotoUrl,
      exact: (Math.round(kmVal * 1000) % 300 === 0), // Atualizado para 300m conforme pedido
      nome: rodData.nome
    };
};

onUnmounted(() => {
    stopGPSWatch();
});
</script>

<template>
  <section id="screen-rodovias-ref" class="screen active">
    <div class="back-row">
      <router-link to="/" class="btn">← Voltar</router-link>
      <router-link to="/ended" class="btn btn-danger">Sair</router-link>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">📍 Referências de Rodovias</h2>
          <p class="card-sub">Base de dados operacional (Marcos a cada 300m)</p>
        </div>
        <button 
            :class="['btn', state.isTracking ? 'btn-danger' : 'btn-success']" 
            @click="toggleTracking"
            style="font-size: 12px; padding: 8px 12px;"
        >
            {{ state.isTracking ? '📡 Parar GPS' : '🛰️ Rastrear KM' }}
        </button>
      </div>

      <div class="form-grid">
        <div class="form-row form-row-2">
          <div class="form-field">
            <label class="field-label">Rodovia</label>
            <select v-model="state.rodovia">
              <option v-for="(data, key) in RODOVIAS_REF_DATA" :key="key" :value="key">{{ key }}</option>
            </select>
          </div>
          <div class="form-field">
            <label class="field-label">KM Atual</label>
            <input type="text" v-model="state.km" placeholder="Ex: 12,500" @keyup.enter="localizar">
          </div>
        </div>
        
        <button class="btn btn-primary btn-full btn-lg" @click="localizar">🔍 Localizar Referência</button>

        <div v-if="state.result" class="result-box visible">
          <div class="result-label">Resultado da Localização</div>
          <div style="font-size:18px; font-weight:900; color:#fff; margin-bottom:10px;">
            {{ state.result.rodovia }} <span style="color:var(--primary);">• KM {{ state.result.km }}</span>
          </div>
          
          <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; border:1px solid var(--border);">
            <div style="font-size:14px; font-weight:700; color:var(--primary); margin-bottom:5px;">Referência próxima:</div>
            <div style="font-size:16px; color:#fff; line-height:1.4;" v-html="state.result.desc"></div>
            
            <div class="divider" style="margin:12px 0;"></div>
            
            <div style="font-size:13px; color:var(--muted); line-height:1.5;" v-html="state.result.dist"></div>
          </div>

          <div v-if="state.result.foto" class="mt-12" style="border-radius:12px; overflow:hidden; border:2px solid var(--primary);">
            <img :src="state.result.foto" style="width:100%; display:block;" alt="Foto de referência">
          </div>

          <p class="mt-12" style="font-size:11px; color:var(--muted); text-align:center;">
             <span v-if="state.result.exact">🎯 <strong>METRAGEM EXATA:</strong> Este KM coincide com um marco de 300 metros.</span>
             <span v-else>Rodovia: {{ state.result.nome }}</span>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
