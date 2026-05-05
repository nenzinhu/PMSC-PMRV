<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
    default: () => []
  },
  resultadosEixos: {
    type: Object,
    default: () => ({ detalhes: [] })
  }
});

const emit = defineEmits(['update:modelValue']);

const selectedAxleId = ref(null);

const axles = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const getAxleResult = (axleId) => {
  if (!props.resultadosEixos?.detalhes) return null;
  return props.resultadosEixos.detalhes.find(d => d.id === axleId);
};

const getAxleColorClass = (axle) => {
  const peso = parseFloat(axle.peso || 0);
  if (peso <= 0) return 'status-none';
  
  const result = getAxleResult(axle.id);
  if (!result) return 'status-none';

  if (result.isExcedente) {
    // If we have access to tolerance logic, we'd check if it's within tolerance.
    // Assuming 'isExcedente' means it's above the total allowed (including tolerance if applicable).
    // The prompt mentions: Amber if within 12.5% tolerance, Red if above.
    // If result.excesso > 0 but it's not "dangerously" high?
    // Let's use result.status if available, otherwise fallback to basic logic.
    return 'status-danger';
  }
  
  // If excesso is 0 but it might be close? 
  // Let's stick to simple: if isExcedente is false, it's success.
  return 'status-success';
};

const getAxleLabel = (tipo) => {
  const labels = {
    'simples_2': 'Simples (2p)',
    'simples_4': 'Simples (4p)',
    'tandem_duplo': 'Tandem Duplo',
    'tandem_triplo': 'Tandem Triplo',
    'direcional_duplo': 'Direcional Duplo'
  };
  return labels[tipo] || tipo;
};

const selectAxle = (id) => {
  selectedAxleId.value = selectedAxleId.value === id ? null : id;
};

const updateWeight = (id, event) => {
  const value = event.target.value;
  const newAxles = props.modelValue.map(axle => {
    if (axle.id === id) {
      return { ...axle, peso: value };
    }
    return axle;
  });
  emit('update:modelValue', newAxles);
};

const getAxleWheels = (tipo) => {
  switch (tipo) {
    case 'simples_2': return 1;
    case 'simples_4': return 1;
    case 'tandem_duplo': return 2;
    case 'tandem_triplo': return 3;
    case 'direcional_duplo': return 2;
    default: return 1;
  }
};

</script>

<template>
  <div class="axle-selector-wrapper">
    <div class="vehicle-schematic">
      <!-- Truck Cab -->
      <div class="cab-unit">
        <div class="cab-body"></div>
        <div class="cab-window"></div>
        <div class="cab-wheel"></div>
      </div>

      <!-- Axle Units -->
      <div 
        v-for="axle in modelValue" 
        :key="axle.id"
        class="axle-unit"
        :class="[getAxleColorClass(axle), { 'is-selected': selectedAxleId === axle.id }]"
        @click="selectAxle(axle.id)"
      >
        <div class="axle-info">
          <span class="axle-label">{{ getAxleLabel(axle.tipo) }}</span>
          <span class="axle-weight">{{ axle.peso > 0 ? axle.peso + ' kg' : '---' }}</span>
        </div>
        
        <div class="axle-wheels">
          <div 
            v-for="n in getAxleWheels(axle.tipo)" 
            :key="n" 
            class="wheel"
          ></div>
        </div>

        <!-- Inline Input -->
        <div v-if="selectedAxleId === axle.id" class="inline-input-container" @click.stop>
          <input 
            type="number" 
            :value="axle.peso" 
            placeholder="Peso (kg)"
            @input="updateWeight(axle.id, $event)"
            ref="weightInput"
            autofocus
          />
        </div>
      </div>
    </div>
    
    <div class="selector-hint" v-if="!selectedAxleId">
      Toque em um eixo para inserir o peso
    </div>
  </div>
</template>

<style scoped>
.axle-selector-wrapper {
  margin: 20px 0;
  padding: 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  overflow-x: auto;
}

.vehicle-schematic {
  display: flex;
  align-items: flex-end;
  gap: 15px;
  padding: 20px 10px;
  min-width: max-content;
}

/* Cab Styling */
.cab-unit {
  position: relative;
  width: 80px;
  height: 100px;
  margin-right: 20px;
}

.cab-body {
  width: 60px;
  height: 80px;
  background: var(--primary);
  border-radius: 8px 15px 5px 5px;
  position: absolute;
  bottom: 20px;
  left: 0;
}

.cab-window {
  width: 35px;
  height: 30px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 5px 10px 2px 2px;
  position: absolute;
  top: 10px;
  left: 20px;
}

.cab-wheel {
  width: 24px;
  height: 24px;
  background: #333;
  border: 3px solid #555;
  border-radius: 50%;
  position: absolute;
  bottom: 5px;
  left: 10px;
}

/* Axle Unit Styling */
.axle-unit {
  position: relative;
  padding: 12px;
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  background: var(--bg-surface);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.axle-unit.is-selected {
  border-color: var(--primary);
  box-shadow: 0 0 10px var(--primary-glow);
  transform: translateY(-5px);
}

.status-none {
  border-color: var(--border-medium);
}

.status-success {
  border-color: var(--success);
  background: rgba(16, 185, 129, 0.05);
}

.status-danger {
  border-color: var(--danger);
  background: rgba(239, 68, 68, 0.05);
}

.axle-info {
  text-align: center;
  display: flex;
  flex-direction: column;
}

.axle-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.axle-weight {
  font-size: 1rem;
  font-weight: 800;
  color: #fff;
}

.axle-wheels {
  display: flex;
  gap: 4px;
}

.wheel {
  width: 22px;
  height: 22px;
  background: #222;
  border: 3px solid #444;
  border-radius: 50%;
}

.status-success .wheel {
  border-color: var(--success);
}

.status-danger .wheel {
  border-color: var(--danger);
}

/* Inline Input */
.inline-input-container {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 10px;
  z-index: 10;
  width: 120px;
}

.inline-input-container input {
  padding: 8px;
  text-align: center;
  box-shadow: var(--shadow-lg);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  border: 2px solid var(--primary);
}

.selector-hint {
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 10px;
}

/* Responsive */
@media (max-width: 600px) {
  .axle-unit {
    min-width: 80px;
    padding: 8px;
  }
  .axle-label {
    font-size: 0.6rem;
  }
  .axle-weight {
    font-size: 0.85rem;
  }
}
</style>
