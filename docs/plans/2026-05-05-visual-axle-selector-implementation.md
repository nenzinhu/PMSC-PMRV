# Visual Axle Selector Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement an interactive schematic for axle weight input in the Weights & Dimensions module.

**Architecture:** A new Vue component `VisualAxleSelector` that renders a stylized vehicle based on presets. It uses inline inputs for rapid data entry and provides real-time color feedback.

**Tech Stack:** Vue 3 (Composition API), Vanilla CSS, SVG-lite (inline shapes).

---

### Task 1: Update Configuration

**Files:**
- Modify: `src/js/pesos-config.js`

**Step 1: Add schema property to VEHICLE_PRESETS**
Update the presets to include an array of axle type keys.

```javascript
// src/js/pesos-config.js

export const VEHICLE_PRESETS = [
  { label: '🚚 2 Eixos (Toco) - 16t', value: 16000, schema: ['simples_2', 'simples_4'] },
  { label: '🚚 3 Eixos (Truck) - 23t', value: 23000, schema: ['simples_2', 'tandem_duplo'] },
  { label: '🚚 4 Eixos (Bitruck) - 29t', value: 29000, schema: ['direcional_duplo', 'tandem_duplo'] },
  { label: '🚛 3 Eixos (Cavalo Simples + 1) - 33t', value: 33000, schema: ['simples_2', 'simples_4', 'simples_4'] },
  { label: '🚛 4 Eixos (Cavalo Simples + 2) - 41.5t', value: 41500, schema: ['simples_2', 'simples_4', 'tandem_duplo'] },
  { label: '🚛 5 Eixos (Cavalo Truck + 2 ou Simples + 3) - 48.5t', value: 48500, schema: ['simples_2', 'tandem_duplo', 'tandem_duplo'] },
  { label: '🚛 6 Eixos (Cavalo Truck + 3) - 53t', value: 53000, schema: ['simples_2', 'tandem_duplo', 'tandem_triplo'] },
  { label: '🚛 7 Eixos (Bitrem) - 57t', value: 57000, schema: ['simples_2', 'tandem_duplo', 'tandem_duplo', 'tandem_duplo'] },
  { label: '🚛 9 Eixos (Rodotrem) - 74t', value: 74000, schema: ['simples_2', 'tandem_duplo', 'tandem_duplo', 'tandem_duplo', 'tandem_duplo'] }
];
```

**Step 2: Commit**
```bash
git add src/js/pesos-config.js
git commit -m "feat(pesos): add axle schema to vehicle presets"
```

---

### Task 2: Create VisualAxleSelector Component

**Files:**
- Create: `src/components/VisualAxleSelector.vue`

**Step 1: Implement template with schematic rendering**
Use a horizontal flexbox to render the cab and axle units.

**Step 2: Add CSS for axle status colors**
Define `.legal`, `.tolerancia`, and `.excesso` classes.

**Step 3: Add inline input logic**
Show a numeric input when an axle unit is clicked. Emit 'update:eixos' on change.

**Step 4: Commit**
```bash
git add src/components/VisualAxleSelector.vue
git commit -m "feat(pesos): create VisualAxleSelector component"
```

---

### Task 3: Integrate into PesosDimensoes.vue

**Files:**
- Modify: `src/views/PesosDimensoes.vue`

**Step 1: Import and register VisualAxleSelector**
Add the component to the template in the 'pbt' tab.

**Step 2: Add logic to pre-populate eixos on preset change**
Watch `configValue` and update `eixos` array based on the `schema`.

**Step 3: Run and Verify**
Select "3 Eixos (Truck)", enter 6000kg for the front axle, and verify the green highlight.

**Step 4: Commit**
```bash
git add src/views/PesosDimensoes.vue
git commit -m "feat(pesos): integrate visual axle selector into main view"
```
