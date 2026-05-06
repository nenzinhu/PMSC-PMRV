# Design: Fluxo de Abordagem Ágil (OCR + Voz)

**Data:** 2026-05-05
**Status:** Validado
**Objetivo:** Implementar uma interface de alta velocidade para policiais rodoviários, utilizando OCR offline para captura de placas e comandos de voz para preenchimento de infrações e relatórios.

---

## 1. Visão Geral
O sistema visa reduzir o tempo de digitação e a necessidade de olhar para a tela durante uma abordagem. Ele combina a detecção automática de texto (placas) com o reconhecimento de fala estruturado por palavras-chave.

## 2. Componentes Técnicos

### 2.1 OCR de Placas (Offline)
- **Tecnologia:** `@capacitor-mlkit/text-recognition`.
- **Interface:** `OCRCamera.vue` - Uma sobreposição de câmera com um visor centralizado.
- **Lógica de Filtro:** `PlateValidator.js` utilizando Regex para identificar padrões Mercosul (`[A-Z]{3}[0-9][A-Z][0-9]{2}`) e padrão Cinza (`[A-Z]{3}-[0-9]{4}`).
- **Privacidade:** Processamento em tempo real nos frames da câmera; nenhuma imagem é armazenada permanentemente no dispositivo.

### 2.2 Assistente de Voz "Mãos Livres"
- **Tecnologia:** `Web Speech API` (`SpeechRecognition` para entrada e `SpeechSynthesis` para feedback).
- **Processador de Comandos:** `ApproachVoiceLogic.js` - Um analisador baseado em tokens e palavras-chave (Keywords).
- **Mapeamento de Palavras-Chave:**
    - "Veículo [cor]" -> `veiculo.cor = cor`
    - "Sem cinto" -> Busca Art. 167 no `infracoes-data.js` e adiciona.
    - "Pneu careca" -> Busca Art. 230, XVIII no `infracoes-data.js`.
- **Feedback (TTS):** Confirmação audível de cada dado inserido para que o policial saiba que o sistema registrou corretamente sem precisar olhar para o celular.

## 3. Fluxo de Dados e Integração

1. **Início:** O policial aciona o "Modo Abordagem".
2. **Captura:** O scanner de placa é ativado. Ao detectar uma placa válida, o app preenche o campo global de placa e emite um bipe/vibração.
3. **Ditado:** O microfone entra em modo de escuta. O policial narra as observações.
4. **Processamento:** O texto é analisado localmente. Termos que correspondam a infrações conhecidas ou campos do formulário são mapeados.
5. **Confirmação:** O app fala: "Placa ABC-1234. Infração adicionada: Cinto de Segurança. Deseja finalizar?".
6. **Persistência:** Os dados são salvos no `localStorage` via lógica existente do `core.js`.

## 4. Próximos Passos
1. Configuração do ambiente Capacitor para suporte ao ML Kit.
2. Implementação do protótipo do `OCRCamera.vue`.
3. Criação do dicionário de palavras-chave para o mapeamento de voz.
