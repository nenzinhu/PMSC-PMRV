<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { getGPSPosition, getGoogleMapsLink, calculateDistance, getPlaceName } from '../js/gps';
import { POI_DATA, POI_ICONS } from '../js/pois_data';
import { APP_MODULES } from '../js/modules-config';

const router = useRouter();
const isSharing = ref(false);

// Estados para Contexto Operacional
const currentTime = ref('');
const currentData = ref('');
const currentLoc = ref('Obtendo localização...');
const nearestPOI = ref(null);
const weather = ref({ temp: '--', desc: 'Carregando clima...' });
let timer = null;

const updateClock = () => {
  const agora = new Date();
  currentTime.value = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  currentData.value = agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
};

const fetchWeather = async (lat, lon) => {
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const data = await response.json();
    if (data.current_weather) {
      weather.value = {
        temp: Math.round(data.current_weather.temperature) + '°C',
        desc: 'Tempo estável'
      };
    }
  } catch (err) {
    weather.value = { temp: '??', desc: 'Erro ao carregar clima' };
  }
};

const detectarContexto = async () => {
  try {
    const pos = await getGPSPosition();
    const { latitude, longitude } = pos.coords;
    
    // 1. Tenta encontrar o estabelecimento (Place) mais próximo primeiro
    let bestPOI = null;
    let minPoiDist = 1000; // Raio de 1km para ser a referência principal
    POI_DATA.forEach(poi => {
        const dist = calculateDistance(latitude, longitude, poi.lat, poi.lng);
        if (dist < minPoiDist) {
            minPoiDist = dist;
            bestPOI = { ...poi, dist: Math.round(dist) };
        }
    });

    if (bestPOI) {
      currentLoc.value = bestPOI.name;
      nearestPOI.value = bestPOI;
    } else {
      // Caso não tenha estabelecimento perto, usa a rodovia ou rua
      currentLoc.value = await getPlaceName(latitude, longitude);
      nearestPOI.value = null;
    }

    fetchWeather(latitude, longitude);
  } catch (err) {
    currentLoc.value = 'Localização não disponível';
  }
};

const go = (name) => {
  router.push({ name });
};

const compartilharLocalizacao = async () => {
  isSharing.value = true;
  try {
    const pos = await getGPSPosition();
    const link = getGoogleMapsLink(pos.coords.latitude, pos.coords.longitude);
    const texto = `📍 *Minha Localização Atual (PMRv):*\n${link}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
  } catch (err) {
    alert('Erro ao obter localização: ' + err.message);
  } finally {
    isSharing.value = false;
  }
};

onMounted(() => {
  updateClock();
  timer = setInterval(updateClock, 1000);
  detectarContexto();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <section class="screen active" aria-label="Menu principal">
    <!-- Header de Contexto Operacional -->
    <div class="context-header" style="background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 20px; padding: 24px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 16px; box-shadow: var(--shadow-lg);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div class="time-info">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 2.5rem; font-weight: 900; color: var(--primary-light); line-height: 1;">{{ currentTime }}</div>
          <div style="font-size: 14px; color: var(--text-muted); margin-top: 4px; text-transform: capitalize;">{{ currentData }}</div>
        </div>
        <div class="weather-info" style="text-align: right;">
          <div style="font-size: 28px; font-weight: 800; color: #fff;">{{ weather.temp }}</div>
          <div style="font-size: 12px; color: var(--text-muted);">{{ weather.desc }}</div>
        </div>
      </div>

      <div style="height: 1px; background: var(--border-light); width: 100%;"></div>

      <div class="location-details">
        <div style="font-size: 14px; color: var(--primary-light); font-weight: bold; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">📍</span> {{ currentLoc }}
        </div>
        
        <!-- Ponto de Interesse Próximo -->
        <div v-if="nearestPOI" class="mt-8" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 12px; border: 1px solid var(--border-light);">
          <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Local Próximo Detectado:</div>
          <div style="font-size: 14px; color: #fff; font-weight: 700; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">{{ POI_ICONS[nearestPOI.type] }}</span>
            {{ nearestPOI.name }}
          </div>
          <div style="font-size: 11px; color: var(--success); margin-top: 4px;">
             📏 Aproximadamente {{ nearestPOI.dist }}m de distância
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">O que você precisa?</h2>
          <p class="card-sub">Escolha o módulo para começar.</p>
        </div>
      </div>

      <div class="quick-actions" style="margin-bottom: 24px;">
        <button class="btn btn-primary btn-full btn-lg" @click="compartilharLocalizacao" :disabled="isSharing">
          {{ isSharing ? '📡 Obtendo posição...' : '📍 Compartilhar Localização Atual' }}
        </button>
      </div>

      <div class="menu-grid" role="navigation" aria-label="Módulos disponíveis">
        <button 
          v-for="mod in APP_MODULES" 
          :key="mod.id"
          class="menu-card" 
          :data-color="mod.color" 
          @click="go(mod.id)"
        >
          <div class="menu-icon">
            <img :src="mod.img" :alt="mod.title" class="menu-icon-img" :class="'menu-icon-img-' + mod.id" />
          </div>
          <div class="menu-title">{{ mod.title }}</div>
          <div class="menu-desc">{{ mod.desc }}</div>
        </button>
      </div>
    </div>
  </section>
</template>
