# Design Document: Visual Axle Selector for Weights Module

**Date:** 2026-05-05
**Topic:** Visual Axle Selector for PMRV Weights Module
**Status:** Validated / Ready for Implementation

## 1. Purpose
Improve the user experience (UX) for traffic officers when performing weight inspections. Instead of a text-only list, the application will provide an interactive schematic representation of the vehicle, making it more intuitive to input and visualize axle weights.

## 2. Architecture & Components

### 2.1 VisualAxleSelector Component
- A new interactive section within the `PesosDimensoes.vue` view.
- **Schematic View:** A horizontal container displaying a stylized vehicle skeleton.
- **Axle Units:** Individual or grouped circles representing axle types (Simple, Tandem Duplo, Tandem Triplo, etc.).
- **Inline Input:** A numeric input field that appears dynamically when an axle is selected.

### 2.2 Data Mapping
- Each `VEHICLE_PRESET` in `pesos-config.js` will include a `schema` property.
- `schema` is an array of axle type keys (e.g., `['simples_2', 'tandem_duplo']`).
- When a preset is selected, the `eixos` state is initialized with these types.

## 3. Visual & Interaction Design

### 3.1 Visual Feedback
- **Idle:** Grey borders, neutral.
- **Selected:** Blue highlight/glow.
- **Legal:** Green background (within limit).
- **Tolerated:** Yellow/Amber background (within 12.5% tolerance).
- **Excess:** Red background (above tolerance).

### 3.2 Interaction Flow
1. User selects a vehicle preset (e.g., "3 Eixos (Truck)").
2. The schematic automatically renders the corresponding axle configuration.
3. User taps on an axle group in the schematic.
4. An **Inline Quick-Input** appears below the axle.
5. User enters the weight (KG).
6. Schematic unit updates its color immediately based on the calculation.
7. Total PBT and fine estimates update in the main results panel.

## 4. Technical Implementation

### 4.1 Configuration Update (`pesos-config.js`)
Extend `VEHICLE_PRESETS` with the `schema` property:
```javascript
{ label: '🚚 3 Eixos (Truck) - 23t', value: 23000, schema: ['simples_2', 'tandem_duplo'] }
```

### 4.2 Logic Integration
- The `VisualAxleSelector` will use the existing `calcularEixos` logic from `pesos-logic.js`.
- It will synchronize with the `eixos` array in `PesosDimensoes.vue`.

## 5. Testing Strategy
- **Unit Tests:** Verify that different `schema` arrays generate the correct number of visual units.
- **Integration Tests:** Ensure that entering a weight in the visual selector updates the `eixos` state and triggers PBT recalculations.
- **UI/UX Check:** Verify that colors change correctly according to the 12.5% axle tolerance.
