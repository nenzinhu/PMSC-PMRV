<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
const goBack = () => router.push({ name: 'home' });

const contatos = [
  {
    categoria: 'Emergência (Nacional)',
    itens: [
      { nome: 'Polícia Militar (PMRv/PMSCc)', numero: '190', desc: 'Ocorrências policiais urgentes' },
      { nome: 'SAMU', numero: '192', desc: 'Atendimento médico de urgência' },
      { nome: 'Corpo de Bombeiros', numero: '193', desc: 'Incêndio, resgate e trauma' },
      { nome: 'Polícia Rodoviária Federal', numero: '191', desc: 'Emergências em Rodovias Federais' }
    ]
  },
  {
    categoria: 'Apoio e Operacional (SC)',
    itens: [
      { nome: 'Polícia Civil SC', numero: '181', desc: 'Disque Denúncia' },
      { nome: 'Defesa Civil', numero: '199', desc: 'Eventos climáticos e riscos' },
      { nome: 'Guarda Municipal (Floripa)', numero: '153', desc: 'Apoio urbano na capital' },
      { nome: 'Comando PMRv (P19)', numero: '(48) 3665-4560', desc: 'Posto Norte da Ilha' }
    ]
  },
  {
    categoria: 'Serviços e Concessionárias',
    itens: [
      { nome: 'Arteris Litoral Sul', numero: '0800 725 1771', desc: 'BR-101 Trecho Sul' },
      { nome: 'CCR ViaCosteira', numero: '0800 255 5550', desc: 'BR-101 Trecho Catarinense' },
      { nome: 'CELESC', numero: '0800 048 0196', desc: 'Emergências com rede elétrica' }
    ]
  }
];

const ligar = (numero) => {
  const limpo = numero.replace(/\D/g, '');
  window.location.href = `tel:${limpo}`;
};
</script>

<template>
  <section class="screen active">
    <div class="back-row">
      <button class="btn btn-sm" @click="goBack">← Voltar</button>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">📞 Telefones Úteis</h2>
          <p class="card-sub">Discagem rápida para emergência e apoio</p>
        </div>
      </div>

      <div class="phone-list">
        <div v-for="cat in contatos" :key="cat.categoria" class="cat-group">
          <h3 class="cat-title">{{ cat.categoria }}</h3>
          <div class="contact-grid">
            <button v-for="item in cat.itens" :key="item.nome" class="contact-btn" @click="ligar(item.numero)">
              <div class="contact-info">
                <div class="contact-name">{{ item.nome }}</div>
                <div class="contact-num">{{ item.numero }}</div>
                <div class="contact-desc">{{ item.desc }}</div>
              </div>
              <div class="call-icon">📞</div>
            </button>
          </div>
        </div>
      </div>
      
      <div class="info-alert mt-24" style="border-left: 4px solid var(--primary);">
        📢 <strong>IMPORTANTE:</strong> Em caso de rádio indisponível, utilize os números de emergência para coordenação rápida com a central.
      </div>
    </div>
  </section>
</template>

<style scoped>
.cat-group { margin-bottom: 24px; }
.cat-title { 
  font-size: 0.75rem; 
  font-weight: 900; 
  text-transform: uppercase; 
  color: var(--primary-light); 
  letter-spacing: 1px;
  margin-bottom: 12px;
  padding-left: 4px;
}

.contact-grid { display: flex; flex-direction: column; gap: 10px; }

.contact-btn {
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.contact-btn:hover {
  border-color: var(--primary);
  background: var(--bg-card);
  transform: translateX(4px);
}

.contact-name { font-size: 1rem; font-weight: 700; color: #fff; }
.contact-num { font-family: 'JetBrains Mono', monospace; font-size: 1.1rem; color: var(--primary-light); font-weight: 900; margin: 2px 0; }
.contact-desc { font-size: 0.75rem; color: var(--text-muted); }

.call-icon {
  width: 40px;
  height: 40px;
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.contact-btn:hover .call-icon {
  background: var(--success);
  color: white;
}

.info-alert {
  background: rgba(79, 70, 229, 0.05);
  padding: 16px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-main);
}
</style>
