<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const helpSections = [
  {
    title: '🚔 Assunção de Serviço',
    content: 'Módulo para gerar o texto de início de serviço. Você pode selecionar os policiais do efetivo, a viatura e a escala (Ordinária, Apoio, etc). O sistema permite capturar o GPS para registrar o local exato do início do turno.'
  },
  {
    title: '👥 Prévia de Registro / Envolvidos',
    content: 'Registre dados de condutores, passageiros ou testemunhas. Inclui campos para nome, contato, veículo, endereço e relato. Você também pode anexar fotos específicas para cada envolvido.'
  },
  {
    title: '📝 Relato Policial',
    content: 'Ferramenta para montar o texto padrão da ocorrência (SADE). Escolha o tipo de sinistro (atropelamento, colisão, etc) para gerar a dinâmica automaticamente. Possui suporte a comando de voz para ditar o relato.'
  },
  {
    title: '🚗 Danos Aparentes',
    content: 'Mapeamento visual de avarias em carros e motocicletas. Toque nos pontos do diagrama para selecionar o tipo de dano (amassado, riscado, quebrado, trincado). Salve múltiplos veículos se necessário.'
  },
  {
    title: '⚖️ Pesos e Dimensões',
    content: 'Calculadora de PBT (Peso Bruto Total) e excesso por eixo. Suporta fiscalização por Nota Fiscal (5% tolerância) ou Balança (12.5% tolerância nos eixos). Também verifica dimensões excedentes conforme Res. 210/06.'
  },
  {
    title: '⏱️ Tacógrafo & Jornada',
    content: 'Auxiliar na análise de discos de cronotacógrafo. Calcula se o motorista cumpriu as 11h de descanso obrigatório e se respeitou o limite de 5h30 de condução contínua. Inclui conversor UTC para Brasília (-3h).'
  },
  {
    title: '📋 Relatório Completo',
    content: 'Consolida as informações de todos os outros módulos em um único texto para facilitar o envio via WhatsApp ou cópia para o sistema SADE.'
  }
];

const goBack = () => router.push({ name: 'home' });
</script>

<template>
  <section id="screen-help" class="screen active">
    <div class="header-compact">
      <button class="btn-back" @click="goBack">‹</button>
      <img src="/AJUDA.png" alt="Icon" class="header-icon" />
      <div class="header-title-group">
        <h1 class="header-title">Ajuda & Manual</h1>
        <div class="step-indicator">Instruções de Uso</div>
      </div>
    </div>

    <div class="help-container">
      <div class="card mb-16">
        <h2 class="card-section-title">💡 Como usar o aplicativo</h2>
        <p class="card-sub-modern">O Pmrv foi desenhado para agilizar o registro em campo. Siga o fluxo recomendado para um atendimento completo:</p>
        
        <div class="flow-steps mt-12">
          <div class="flow-step">1. Assunção de Serviço</div>
          <div class="flow-step">2. Registro de Envolvidos</div>
          <div class="flow-step">3. Relato Policial</div>
          <div class="flow-step">4. Danos Aparentes</div>
          <div class="flow-step">5. Relatório Completo</div>
        </div>
      </div>

      <div v-for="section in helpSections" :key="section.title" class="card mb-12">
        <h3 class="section-item-title">{{ section.title }}</h3>
        <p class="section-item-content">{{ section.content }}</p>
      </div>

      <div class="footer-note mt-24">
        <p>Desenvolvido para uso exclusivo da Polícia Militar Rodoviária de Santa Catarina.</p>
        <p>Versão 1.0.0 (Vue Migration)</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.header-compact { display: flex; align-items: center; padding: 12px 16px; background: var(--card-bg); border-bottom: 1px solid var(--border-color); margin-bottom: 16px; gap: 12px; }
.btn-back { background: none; border: none; font-size: 24px; color: var(--text-main); padding: 4px 8px; cursor: pointer; }
.header-title-group { flex: 1; }
.header-title { font-size: 16px; font-weight: 700; margin: 0; }
.step-indicator { font-size: 11px; color: var(--text-dim); }

.help-container { max-width: 600px; margin: 0 auto; padding: 0 12px 100px; }

.card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 16px; }
.card-section-title { font-size: 16px; color: var(--blue-light); margin-bottom: 8px; }
.card-sub-modern { font-size: 13px; color: var(--text-dim); line-height: 1.4; }

.flow-steps { display: flex; flex-direction: column; gap: 6px; }
.flow-step { background: var(--black-20); padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; color: var(--blue-light); border-left: 3px solid var(--blue-main); }

.section-item-title { font-size: 14px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; }
.section-item-content { font-size: 13px; color: var(--text-dim); line-height: 1.5; margin: 0; }

.footer-note { text-align: center; color: var(--text-dim); font-size: 11px; }

.mb-12 { margin-bottom: 12px; }
.mb-16 { margin-bottom: 16px; }
.mt-12 { margin-top: 12px; }
.mt-24 { margin-top: 24px; }
</style>
