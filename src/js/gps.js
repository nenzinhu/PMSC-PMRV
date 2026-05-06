import { Geolocation } from '@capacitor/geolocation';

let watchId = null;

/**
 * Obtém a posição GPS atual do dispositivo com alta precisão.
 */
/**
 * Obtém a posição GPS atual do dispositivo com alta precisão e filtros de ruído.
 */
export async function getGPSPosition() {
  console.log('[GPS] Solicitando posição de alta precisão...');

  try {
    const permissions = await Geolocation.checkPermissions();
    if (permissions.location === 'denied') {
      throw new Error('Permissão de localização negada. Ative nas configurações do navegador.');
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0 // Garante posição atualizada, não do cache
    });
    
    // Filtro de Qualidade: Precisão mínima aceitável para uso policial (100m)
    if (position.coords.accuracy > 100 && window.location.hostname !== 'localhost') {
        console.warn('[GPS] Precisão insuficiente:', position.coords.accuracy, 'm');
    }

    console.log('[GPS] Posição obtida:', position.coords.latitude, position.coords.longitude, '(+/-', position.coords.accuracy.toFixed(1), 'm)');
    return position;
  } catch (error) {
    console.error('[GPS] Falha no hardware:', error);
    
    // Simulação para Localhost (Posto P19)
    if (window.location.hostname === 'localhost') {
      return {
        coords: { latitude: -27.4985, longitude: -48.4875, accuracy: 5, speed: 0 }
      };
    }
    throw error;
  }
}

/**
 * Converte coordenadas em nome de Local/Place priorizando estabelecimentos (POIs).
 */
export async function getPlaceName(lat, lng) {
    // 1. Prioridade Máxima: Estabelecimentos Próximos (Bares, Postos, Saúde, etc.)
    try {
        const { POI_DATA } = await import('./pois_data');
        let bestPOI = null;
        let minPoiDist = 800; // Raio de 800m para ser uma referência relevante

        POI_DATA.forEach(poi => {
            const d = calculateDistance(lat, lng, poi.lat, poi.lng);
            if (d < minPoiDist) {
                minPoiDist = d;
                bestPOI = poi;
            }
        });
        if (bestPOI) return bestPOI.name;
    } catch (e) { console.error('Erro POIs:', e); }

    // 2. Segunda Opção: Rodovias Oficiais
    try {
        const { RODOVIAS_SC_FULL } = await import('./rodovias_sc_data');
        let nearestRoad = null;
        let minRoadDist = 2000;

        for (const [id, data] of Object.entries(RODOVIAS_SC_FULL)) {
            data.refs.forEach(ref => {
                const d = calculateDistance(lat, lng, ref.lat, ref.lng);
                if (d < minRoadDist) {
                    minRoadDist = d;
                    nearestRoad = `${id} • KM ${ref.km.toFixed(1).replace('.', ',')}`;
                }
            });
        }
        if (nearestRoad) return nearestRoad;
    } catch (e) { console.error('Erro rodovias:', e); }

    // 3. Fallback: Nome da Rua/Bairro via Geocodificação
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        return data.address.road || data.address.suburb || data.address.city || "Local Identificado";
    } catch (e) {
        return "Florianópolis / Rodovia";
    }
}

/**
 * Inicia o monitoramento contínuo da posição (Ideal para viaturas em movimento).
 * @param {Function} callback Função chamada a cada atualização de posição
 */
export async function startGPSWatch(callback) {
  if (watchId !== null) {
    console.warn('[GPS] Watch já está em execução (ID:', watchId, ')');
    return;
  }

  console.log('[GPS] Iniciando Watch Position...');
  try {
    watchId = await Geolocation.watchPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0 
    }, (position, err) => {
      if (err) {
        console.error('[GPS] Erro no Watch:', err);
        return;
      }
      if (position) {
        console.log('[GPS] Update recebido:', position.coords.latitude, position.coords.longitude, 'Precisão:', position.coords.accuracy, 'm');
        
        // Filtro de Precisão: Ignora se a precisão for pior que 100 metros
        if (position.coords.accuracy > 100) {
            console.warn('[GPS] Posição ignorada: precisão baixa (', position.coords.accuracy, 'm)');
            return;
        }

        callback(position);
      }
    });
    console.log('[GPS] Watch iniciado com sucesso. ID:', watchId);
  } catch (error) {
    console.error('[GPS] Falha ao iniciar Watch:', error);
    alert('Erro ao iniciar rastreamento: ' + error.message);
  }
}

/**
 * Para o monitoramento do GPS.
 */
export async function stopGPSWatch() {
  if (watchId !== null) {
    await Geolocation.clearWatch({ id: watchId });
    watchId = null;
  }
}

/**
 * Calcula a distância entre dois pontos (Haversine) em metros.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function formatCoords(lat, lng) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export function getGoogleMapsLink(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
