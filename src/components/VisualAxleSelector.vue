<template>
  <div class="visual-axle-selector">
    <div class="vehicle-schematic">
      <!-- Unidade Tratora (Cab) -->
      <div class="cab-unit">
        <div class="cab-body"></div>
        <div class="axle-group">
          <div 
            class="axle-unit"
            :class="getAxleClass(0)"
            @click="editAxle(0)"
          >
            <div class="wheel left"></div>
            <div class="axle-line"></div>
            <div class="wheel right"></div>
            <div class="axle-weight text-xs">{{ formatKg(eixos[0]?.peso) }}</div>
          </div>
        </div>
      </div>

      <div class="coupling-line" v-if="schema.length > 2"></div>

      <!-- Unidades Tracionadas (Rear) -->
      <div class="rear-units">
        <div 
          v-for="(type, index) in schema.slice(1)" 
          :key="index + 1"
          class="rear-unit-wrapper"
        >
          <div class="unit-body"></div>
          <div class="axle-group">
            <div 
              class="axle-unit"
              :class="getAxleClass(index + 1)"
              @click="editAxle(index + 1)"
            >
              <template v-if="type.includes('tandem')">
                <div class="tandem-wheels">
                  <div class="wheel left"></div>
                  <div class="wheel left"></div>
                  <div class="wheel left" v-if="type.includes('triplo')"></div>
                </div>
                <div class="axle-line"></div>
                <div class="tandem-wheels">
                  <div class="wheel right"></div>
                  <div class="wheel right"></div>
                  <div class="wheel right" v-if="type.includes('triplo')"></div>
                </div>
              </template>
              <template v-else>
                <div class="wheel left"></div>
                <div class="axle-line"></div>
                <div class="wheel right"></div>
              </template>
              <div class="axle-weight text-xs">{{ formatKg(eixos[index + 1]?.peso) }}</div>
            </div>
          </div>
          <div class="coupling-line internal" v-if="index < schema.length - 2"></div>
        </div>
      </div>
    </div>

    <!-- Edit Overlay -->
    <div v-if="editingIndex !== null" class="axle-edit-overlay" @click.self="editingIndex = null">
      <div class="edit-modal">
        <h4 class="font-bold mb-2">{{ getAxleName(editingIndex) }}</h4>
        <p class="text-sm text-gray-600 mb-4">Limite Legal: {{ formatKg(getAxleLimit(editingIndex)) }}</p>
        <div class="input-group">
          <input 
            type="number" 
            v-model.number="tempWeight"
            ref="weightInput"
            @keyup.enter="saveWeight"
            placeholder="Peso em kg"
            class="w-full"
          >
          <div class="flex gap-2 mt-3">
            <button @click="saveWeight" class="btn-primary flex-1">Salvar</button>
            <button @click="editingIndex = null" class="btn-secondary">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { PES_LIMITES_EIXOS, PES_CONSTANTS } from '../js/pesos-config';

const props = defineProps({
  schema: {
    type: Array,
    required: true
  },
  eixos: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['update:eixos']);

const editingIndex = ref(null);
const tempWeight = ref(0);
const weightInput = ref(null);

const getAxleName = (index) => {
  const type = props.schema[index];
  return PES_LIMITES_EIXOS[type]?.nome || `Eixo ${index + 1}`;
};

const getAxleLimit = (index) => {
  const type = props.schema[index];
  return PES_LIMITES_EIXOS[type]?.limite || 0;
};

const getAxleClass = (index) => {
  const peso = props.eixos[index]?.peso || 0;
  if (peso <= 0) return '';
  
  const limite = getAxleLimit(index);
  const tol = 1 + PES_CONSTANTS.TOLERANCIA_EIXO;
  
  if (peso <= limite) return 'legal';
  if (peso <= limite * tol) return 'tolerancia';
  return 'excesso';
};

const formatKg = (val) => {
  if (!val) return '0 kg';
  return val.toLocaleString('pt-BR') + ' kg';
};

const editAxle = (index) => {
  editingIndex.value = index;
  tempWeight.value = props.eixos[index]?.peso || 0;
  nextTick(() => {
    weightInput.value?.focus();
    weightInput.value?.select();
  });
};

const saveWeight = () => {
  if (editingIndex.value === null) return;
  
  const updatedEixos = [...props.eixos];
  // Ensure the array is large enough
  while (updatedEixos.length < props.schema.length) {
    updatedEixos.push({ peso: 0 });
  }
  
  updatedEixos[editingIndex.value] = { 
    ...updatedEixos[editingIndex.value],
    peso: tempWeight.value 
  };
  
  emit('update:eixos', updatedEixos);
  editingIndex.value = null;
};
</script>

<style scoped>
.visual-axle-selector {
  margin: 1rem 0;
  padding: 1.5rem;
  background: #fdfdfd;
  border: 1px solid #eee;
  border-radius: 12px;
  overflow-x: auto;
}

.vehicle-schematic {
  display: flex;
  align-items: center;
  min-width: fit-content;
  justify-content: flex-start;
  padding: 1rem;
}

.cab-unit, .rear-unit-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.rear-unit-wrapper {
  flex-direction: row;
  align-items: center;
}

.cab-body {
  width: 50px;
  height: 35px;
  background: #475569;
  border-radius: 6px 12px 4px 4px;
  margin-bottom: 8px;
}

.unit-body {
  width: 80px;
  height: 30px;
  background: #94a3b8;
  border-radius: 4px;
  margin-bottom: 8px;
  display: none; /* Simplification: just show axles and spacing */
}

/* Let's refine the schematic to be more visual */
.rear-units {
  display: flex;
  align-items: center;
}

.coupling-line {
  width: 30px;
  height: 4px;
  background: #cbd5e1;
  margin: 0 -5px;
  z-index: 1;
}

.coupling-line.internal {
  width: 15px;
}

.axle-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
}

.axle-unit {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  transition: all 0.2s ease;
  min-width: 60px;
}

.axle-unit:hover {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.axle-line {
  width: 100%;
  height: 6px;
  background: #1e293b;
  border-radius: 2px;
}

.wheel {
  width: 10px;
  height: 16px;
  background: #0f172a;
  border-radius: 2px;
}

.tandem-wheels {
  display: flex;
  gap: 3px;
}

.wheel.left { margin-bottom: -4px; }
.wheel.right { margin-top: -4px; }

.axle-weight {
  margin-top: 10px;
  font-weight: 700;
  color: #334155;
}

/* Status Colors */
.axle-unit.legal { 
  border-color: #10b981; 
  background: #ecfdf5; 
}
.axle-unit.legal .axle-weight { color: #059669; }

.axle-unit.tolerancia { 
  border-color: #f59e0b; 
  background: #fffbeb; 
}
.axle-unit.tolerancia .axle-weight { color: #d97706; }

.axle-unit.excesso { 
  border-color: #ef4444; 
  background: #fef2f2; 
}
.axle-unit.excesso .axle-weight { color: #dc2626; }

/* Edit Overlay */
.axle-edit-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.edit-modal {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 90%;
  max-width: 320px;
}

input {
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1.1rem;
  text-align: center;
}

input:focus {
  outline: none;
  border-color: #3b82f6;
  ring: 2px solid rgba(59, 130, 246, 0.5);
}

.btn-primary {
  background: #2563eb;
  color: white;
  padding: 10px;
  border-radius: 8px;
  font-weight: 600;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  padding: 10px;
  border-radius: 8px;
}
</style>
