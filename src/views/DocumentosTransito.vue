<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
const goBack = () => router.push({ name: 'home' });

const docs = [
  {
    title: 'CNH (Carteira Nacional de Habilitação)',
    icon: '🪪',
    items: [
      'Porte obrigatório (físico ou digital via app Carteira Digital de Trânsito).',
      'Aceita em todo território nacional, mesmo vencida (até 30 dias).',
      'A versão digital tem o mesmo valor jurídico da física.',
      'Falta de porte: Art. 232 (Leve - Retenção até apresentação).'
    ],
    infra: 'Art. 162 I (Sem CNH) | Art. 162 II (Cassada/Suspensa)'
  },
  {
    title: 'CRLV-e (Licenciamento Digital)',
    icon: '📄',
    items: [
      'Documento único de licenciamento e transferência (antigo DUT + CRLV).',
      'Porte obrigatório (digital ou impresso em papel A4 comum).',
      'Dispensa do porte: Se o agente puder consultar o sistema no local.',
      'Não licenciado: Art. 230 V (Gravíssima - Remoção do veículo).'
    ],
    infra: 'Art. 230 V (Veículo não licenciado)'
  },
  {
    title: 'Documentos de Identificação',
    icon: '🆔',
    items: [
      'RG, Passaporte ou Carteira de Trabalho para passageiros e condutores.',
      'Documentos com foto que permitam a identificação inequívoca.',
      'Estrangeiros: CNH do país de origem + Passaporte (até 180 dias de estadia).'
    ],
    infra: 'Identificação civil para registro de boletim de ocorrência.'
  }
];

const regrasPorte = [
  { t: 'Porte Dispensado?', d: 'Sim, se o sistema estiver disponível para consulta via placa/chassi.' },
  { t: 'Digital Vale?', d: 'Sim, obrigatório aceitar em todo o Brasil (Resolução CONTRAN 809/20).' },
  { t: 'Cópia Autenticada?', d: 'Não substitui o documento original (físico ou digital oficial).' }
];
</script>

<template>
  <section class="screen active">
    <div class="back-row">
      <button class="btn btn-sm" @click="goBack">← Voltar</button>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title-with-icon">
          <img src="/ctb.png" alt="Icon" class="card-title-icon" />
          <div>
            <h2 class="card-title">Documentos de Trânsito</h2>
            <p class="card-sub">Guia rápida conforme CTB e Resoluções CONTRAN</p>
          </div>
        </div>
      </div>

      <!-- Resumo de Regras -->
      <div class="rules-grid mb-24">
        <div v-for="r in regrasPorte" :key="r.t" class="rule-card">
          <div class="rule-t">{{ r.t }}</div>
          <div class="rule-d">{{ r.d }}</div>
        </div>
      </div>

      <div class="docs-list">
        <div v-for="doc in docs" :key="doc.title" class="doc-card">
          <div class="doc-header">
            <span class="doc-icon">{{ doc.icon }}</span>
            <h3 class="doc-title-text">{{ doc.title }}</h3>
          </div>
          <ul class="doc-items">
            <li v-for="item in doc.items" :key="item">{{ item }}</li>
          </ul>
          <div class="doc-footer-infra">
            🚨 <strong>Infração Comum:</strong> {{ doc.infra }}
          </div>
        </div>
      </div>
      
      <div class="info-alert mt-24">
        💡 <strong>DICA OPERACIONAL:</strong> O condutor não pode ser autuado pelo Art. 232 (falta de porte) se o agente conseguir consultar o veículo/condutor nos sistemas oficiais (SNT) no momento da abordagem.
      </div>
    </div>
  </section>
</template>

<style scoped>
.rules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}
.rule-card {
  background: rgba(79, 70, 229, 0.1);
  border: 1px solid var(--primary);
  padding: 12px;
  border-radius: 12px;
}
.rule-t { font-size: 11px; font-weight: 900; color: var(--primary-light); text-transform: uppercase; margin-bottom: 4px; }
.rule-d { font-size: 12px; color: #fff; line-height: 1.3; }

.docs-list { display: flex; flex-direction: column; gap: 16px; }
.doc-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 20px;
}
.doc-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.doc-icon { font-size: 28px; }
.doc-title-text { font-size: 1.1rem; font-weight: 700; color: #fff; margin: 0; }

.doc-items { padding-left: 20px; margin-bottom: 16px; }
.doc-items li { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 6px; }

.doc-footer-infra {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 10px;
  border-radius: 8px;
  font-size: 12px;
  color: var(--danger);
}

.info-alert {
  background: rgba(245, 158, 11, 0.1);
  border-left: 4px solid var(--warning);
  padding: 16px;
  border-radius: 8px;
  font-size: 13px;
  color: #fff;
}
</style>
