<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { mascaraTelefone, capitalize, showToast } from '../js/utils';

const router = useRouter();

const ufs = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const envolvidos = ref([
  {
    tipo: 'ENVOLVIDO',
    contato: '',
    nome: '',
    veiculo: '',
    endereco: { rua: '', num: '', comp: '', bairro: '', cidade: '', uf: 'SC' },
    relato: '',
    fotos: []
  }
]);

// --- PERSISTÊNCIA ---
onMounted(() => {
  const saved = localStorage.getItem('pmrv_envolvidos');
  if (saved) {
    envolvidos.value = JSON.parse(saved);
  }
});

watch(envolvidos, (newVal) => {
  localStorage.setItem('pmrv_envolvidos', JSON.stringify(newVal));
}, { deep: true });

const adicionarEnvolvido = () => {
  envolvidos.value.push({
    tipo: 'ENVOLVIDO',
    contato: '',
    nome: '',
    veiculo: '',
    endereco: { rua: '', num: '', comp: '', bairro: '', cidade: '', uf: 'SC' },
    relato: '',
    fotos: []
  });
  showToast('Novo formulário de envolvido adicionado.', 'info');
};

const removerEnvolvido = (index) => {
  if (confirm('Remover este envolvido?')) {
    envolvidos.value.splice(index, 1);
    showToast('Envolvido removido da lista.', 'info');
  }
};

const handleInputTelefone = (index, event) => {
  envolvidos.value[index].contato = mascaraTelefone(event.target.value);
};

const handleBlurCapitalize = (index, field, isRelato = false) => {
  if (field.includes('.')) {
    const [obj, key] = field.split('.');
    envolvidos.value[index][obj][key] = capitalize(envolvidos.value[index][obj][key], isRelato);
  } else {
    envolvidos.value[index][field] = capitalize(envolvidos.value[index][field], isRelato);
  }
};

const handleFileChange = (index, event) => {
  const files = event.target.files;
  if (!files) return;
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => { envolvidos.value[index].fotos.push(e.target.result); };
    reader.readAsDataURL(file);
  });
  showToast('Fotos anexadas com sucesso!', 'success');
};

const montarTextoCompleto = () => {
  let txt = '*📋 RELATÓRIO DE ENVOLVIDOS (SINISTRO)*\n';
  txt += '📅 Data: ' + new Date().toLocaleDateString('pt-BR') + '\n';
  txt += '----------------------------------\n\n';

  envolvidos.value.forEach((env, i) => {
    const { rua, num, comp, bairro, cidade, uf } = env.endereco;
    let endereco = '';
    if (rua) endereco += rua;
    if (num) endereco += `, nº ${num}`;
    if (comp) endereco += ` (${comp})`;
    if (bairro) endereco += ` - ${bairro}`;
    if (cidade) endereco += ` - ${cidade}/${uf}`;

    txt += `*${i + 1}. [${env.tipo}]*\n`;
    if (env.nome)     txt += `👤 Nome: ${env.nome}\n`;
    if (env.veiculo)  txt += `🚗 Veículo: ${env.veiculo}\n`;
    if (env.contato)  txt += `📞 Contato: ${env.contato}\n`;
    if (endereco)     txt += `🏠 Residência: ${endereco}\n`;
    if (env.relato)   txt += `💬 Relato: ${env.relato}\n`;
    txt += '\n';
  });

  return txt.trim();
};

const copiar = () => {
  navigator.clipboard.writeText(montarTextoCompleto());
  showToast('Relatório copiado para transferência!', 'success');
};

const whatsapp = () => {
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(montarTextoCompleto())}`, '_blank');
};
</script>

<template>
  <section id="screen-envolvidos" class="screen active">
    <div class="header-compact">
      <router-link to="/" class="btn-back">‹</router-link>
      <img src="/img/new_icons/envolvidos.png" alt="Icon" class="header-icon" />
      <div class="header-title-group">
        <h1 class="header-title">Envolvidos</h1>
        <div class="step-indicator">{{ envolvidos.length }} pessoa(s) na lista</div>
      </div>
      <router-link to="/ended" class="btn-exit">Sair</router-link>
    </div>

    <div class="wizard-container">
      <div v-for="(env, index) in envolvidos" :key="index" class="card-modern-env animate-fade">
        <div class="env-card-header">
          <div class="env-badge">#{{ index + 1 }}</div>
          <div class="chip-group">
            <button class="chip" :class="{ active: env.tipo === 'ENVOLVIDO' }" @click="env.tipo = 'ENVOLVIDO'">Condutor</button>
            <button class="chip" :class="{ active: env.tipo === 'TESTEMUNHA' }" @click="env.tipo = 'TESTEMUNHA'">Testemunha</button>
          </div>
          <button v-if="envolvidos.length > 1" class="btn-del-mini" @click="removerEnvolvido(index)">×</button>
        </div>

        <div class="form-grid-modern">
          <div class="form-field">
            <label class="field-label">Nome Completo</label>
            <input type="text" v-model="env.nome" placeholder="Nome do envolvido" @blur="handleBlurCapitalize(index, 'nome')" class="input-modern">
          </div>

          <div class="form-row-modern">
            <div class="form-field flex-2">
              <label class="field-label">Veículo (Marca/Modelo/Placa)</label>
              <input type="text" v-model="env.veiculo" placeholder="Ex: VW GOL ABC-1234" @blur="handleBlurCapitalize(index, 'veiculo')" class="input-modern">
            </div>
            <div class="form-field flex-1">
              <label class="field-label">Contato</label>
              <input type="tel" v-model="env.contato" placeholder="(00) 00000-0000" maxlength="15" @input="handleInputTelefone(index, $event)" class="input-modern">
            </div>
          </div>

          <div class="address-section">
            <label class="field-label-orange">📍 Endereço Residencial</label>
            <div class="form-field mt-8">
              <input type="text" v-model="env.endereco.rua" placeholder="Rua / Logradouro" @blur="handleBlurCapitalize(index, 'endereco.rua')" class="input-modern">
            </div>
            <div class="form-row-modern mt-8">
              <input type="text" v-model="env.endereco.num" placeholder="Nº" class="input-modern flex-1">
              <input type="text" v-model="env.endereco.comp" placeholder="Complemento/Apto" class="input-modern flex-2">
            </div>
            <div class="form-row-modern mt-8">
              <input type="text" v-model="env.endereco.bairro" placeholder="Bairro" class="input-modern flex-1">
              <input type="text" v-model="env.endereco.cidade" placeholder="Cidade" class="input-modern flex-1">
              <select v-model="env.endereco.uf" class="input-modern flex-0" style="width: 80px;">
                <option v-for="uf in ufs" :key="uf" :value="uf">{{ uf }}</option>
              </select>
            </div>
          </div>

          <div class="form-field mt-16">
            <label class="field-label">Relato / Depoimento</label>
            <textarea v-model="env.relato" rows="3" placeholder="O que o envolvido relatou?" @blur="handleBlurCapitalize(index, 'relato', true)" class="input-modern textarea-relato"></textarea>
          </div>

          <!-- FOTOS -->
          <div class="photos-section mt-16">
            <label class="foto-label-modern">
              <span class="icon">📸</span> Anexar Fotos do Envolvido
              <input type="file" accept="image/*" multiple style="display:none;" @change="handleFileChange(index, $event)">
            </label>
            
            <div class="foto-grid-modern" v-if="env.fotos.length > 0">
              <div v-for="(foto, fIndex) in env.fotos" :key="fIndex" class="foto-item-modern">
                <img :src="foto">
                <button class="foto-del-btn" @click="env.fotos.splice(fIndex, 1)">×</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button class="btn btn-primary btn-full btn-lg mt-16" @click="adicionarEnvolvido">+ Adicionar Envolvido</button>

      <!-- RESULTADO FINAL -->
      <div class="result-actions-modern mt-24">
        <button class="btn-action-wide btn-copy-modern" @click="copiar">
          <span>📋 Copiar Relatório Completo</span>
        </button>
        <button class="btn-action-wide btn-whats-modern" @click="whatsapp">
          <span>📲 Enviar para WhatsApp</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.header-compact { display: flex; align-items: center; padding: 12px 16px; background: var(--card-bg); border-bottom: 1px solid var(--border-color); margin-bottom: 16px; gap: 12px; }
.btn-back { font-size: 24px; text-decoration: none; color: var(--text-main); padding: 4px 8px; }
.header-title-group { flex: 1; }
.header-title { font-size: 16px; font-weight: 700; margin: 0; }
.step-indicator { font-size: 11px; color: var(--text-dim); }

.wizard-container { max-width: 600px; margin: 0 auto; padding: 0 12px 100px; }

.card-modern-env {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.env-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--black-10);
}

.env-badge {
  background: var(--blue-main);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 12px;
}

.chip-group { display: flex; gap: 8px; flex: 1; }
.chip {
  background: var(--black-20);
  border: 1px solid var(--border-color);
  color: var(--text-dim);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.chip.active { background: var(--blue-main); color: white; border-color: var(--blue-main); }

.btn-del-mini { background: none; border: none; color: #ef4444; font-size: 24px; cursor: pointer; }

.form-grid-modern { display: flex; flex-direction: column; gap: 12px; }
.form-row-modern { display: flex; gap: 10px; }
.flex-1 { flex: 1; min-width: 0; }
.flex-2 { flex: 2; min-width: 0; }
.flex-0 { flex-shrink: 0; }

.input-modern {
  width: 100%; background: var(--black-20); border: 1px solid var(--border-color);
  border-radius: 8px; padding: 12px; color: white; font-size: 14px;
}
.input-modern:focus { border-color: var(--blue-main); outline: none; }

.address-section {
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid var(--black-10);
}

.textarea-relato { resize: vertical; min-height: 80px; font-family: inherit; }

.foto-label-modern {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px; background: rgba(59, 130, 246, 0.1); border: 1px dashed var(--blue-main);
  border-radius: 10px; color: var(--blue-light); font-size: 13px; font-weight: 700; cursor: pointer;
}

.foto-grid-modern {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px; margin-top: 12px;
}
.foto-item-modern { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); }
.foto-item-modern img { width: 100%; height: 100%; object-fit: cover; }
.foto-del-btn {
  position: absolute; top: 4px; right: 4px; background: rgba(239, 68, 68, 0.8);
  color: white; border: none; border-radius: 50%; width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center; font-size: 14px; cursor: pointer;
}

.result-actions-modern { display: flex; flex-direction: column; gap: 12px; }
.btn-action-wide {
  padding: 16px; border-radius: 12px; border: none; font-weight: 800; font-size: 15px; cursor: pointer;
  transition: transform 0.1s;
}
.btn-action-wide:active { transform: scale(0.98); }
.btn-copy-modern { background: #34a853; color: white; }
.btn-whats-modern { background: #25d366; color: white; }

.animate-fade { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.mt-8 { margin-top: 8px; }
.mt-16 { margin-top: 16px; }
.mt-24 { margin-top: 24px; }
</style>
