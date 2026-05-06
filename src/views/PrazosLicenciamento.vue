<script setup>
import { ref, reactive, computed } from 'vue';

const CALENDARIOS_UF = {
    "SC": { nome: "Santa Catarina", datas: ["31 de Março", "30 de Abril", "31 de Maio", "30 de Junho", "31 de Julho", "31 de Agosto", "30 de Setembro", "31 de Outubro", "30 de Novembro", "15 de Dezembro"], obs: "Calendário padrão DETRAN/SC." },
    "SP": { nome: "São Paulo", datas: ["Julho", "Julho", "Agosto", "Agosto", "Setembro", "Setembro", "Outubro", "Outubro", "Novembro", "Dezembro"], obs: "Vencimento no último dia útil do mês." },
    "PR": { nome: "Paraná", datas: ["Agosto", "Agosto", "Setembro", "Setembro", "Outubro", "Outubro", "Novembro", "Novembro", "Dezembro", "Dezembro"], obs: "Dividido em grupos de dois finais de placa." },
    "RS": { nome: "Rio Grande do Sul", datas: ["30 de Junho", "30 de Junho", "30 de Junho", "30 de Junho", "30 de Junho", "31 de Julho", "31 de Julho", "31 de Julho", "31 de Julho", "31 de Julho"], obs: "Finais 1 a 5 vencem em Junho, 6 a 0 em Julho." },
    "RJ": { nome: "Rio de Janeiro", datas: ["31 de Maio", "31 de Maio", "31 de Maio", "30 de Junho", "30 de Junho", "30 de Junho", "31 de Julho", "31 de Julho", "31 de Julho", "31 de Julho"], obs: "Prazos podem variar conforme decreto anual." },
    "MG": { nome: "Minas Gerais", datas: ["31 de Março", "31 de Março", "31 de Março", "30 de Abril", "30 de Abril", "30 de Abril", "31 de Maio", "31 de Maio", "31 de Maio", "31 de Maio"], obs: "Geralmente os primeiros meses do ano." },
    "ES": { nome: "Espírito Santo", datas: ["Setembro", "Setembro", "Setembro", "Outubro", "Outubro", "Outubro", "Novembro", "Novembro", "Novembro", "Novembro"], obs: "Prazos para licenciamento anual." },
    "BA": { nome: "Bahia", datas: ["Maio", "Maio", "Junho", "Junho", "Julho", "Julho", "Agosto", "Agosto", "Setembro", "Outubro"], obs: "Calendário escalonado." },
    "PE": { nome: "Pernambuco", datas: ["Maio", "Maio", "Junho", "Junho", "Julho", "Julho", "Agosto", "Agosto", "Setembro", "Setembro"], obs: "Vencimento escalonado." },
    "CE": { nome: "Ceará", datas: ["Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"], obs: "Um mês para cada final de placa." },
    "DF": { nome: "Distrito Federal", datas: ["Setembro", "Setembro", "Outubro", "Outubro", "Outubro", "Novembro", "Novembro", "Novembro", "Dezembro", "Dezembro"], obs: "Prazos de validade do documento anterior." },
    "GO": { nome: "Goiás", datas: ["Setembro", "Setembro", "Outubro", "Outubro", "Outubro", "Novembro", "Novembro", "Novembro", "Dezembro", "Dezembro"], obs: "Prazos conforme placa." },
    "MT": { nome: "Mato Grosso", datas: ["Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"], obs: "Vencimento mensal." },
    "MS": { nome: "Mato Grosso do Sul", datas: ["Abril", "Maio", "Maio", "Junho", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Outubro"], obs: "Calendário oficial DETRAN/MS." },
    "PA": { nome: "Pará", datas: ["Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"], obs: "Um final por mês." },
    "AM": { nome: "Amazonas", datas: ["Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"], obs: "Vencimento mensal." },
    "AC": { nome: "Acre", datas: ["Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"], obs: "Calendário simplificado." },
    "AL": { nome: "Alagoas", datas: ["Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro", "Dezembro"], obs: "Prazos escalonados." },
    "AP": { nome: "Amapá", datas: ["Agosto", "Agosto", "Agosto", "Agosto", "Agosto", "Agosto", "Agosto", "Agosto", "Agosto", "Agosto"], obs: "Prazo único para todos os finais em Agosto." },
    "MA": { nome: "Maranhão", datas: ["Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"], obs: "Vencimento mensal." },
    "PB": { nome: "Paraíba", datas: ["Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"], obs: "Vencimento mensal." },
    "PI": { nome: "Piauí", datas: ["Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"], obs: "Vencimento mensal." },
    "RN": { nome: "Rio Grande do Norte", datas: ["Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"], obs: "Vencimento mensal." },
    "RO": { nome: "Rondônia", datas: ["Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"], obs: "Vencimento mensal." },
    "RR": { nome: "Roraima", datas: ["Maio", "Maio", "Maio", "Junho", "Junho", "Junho", "Julho", "Julho", "Julho", "Julho"], obs: "Prazos divididos por trimestre." },
    "SE": { nome: "Sergipe", datas: ["Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"], obs: "Vencimento mensal." },
    "TO": { nome: "Tocantins", datas: ["Outubro", "Outubro", "Outubro", "Outubro", "Outubro", "Outubro", "Outubro", "Outubro", "Outubro", "Outubro"], obs: "Prazo único para licenciamento em Outubro." }
};

const selectedUf = ref('SC');
const currentData = computed(() => CALENDARIOS_UF[selectedUf.value]);
const ordem = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
</script>

<template>
  <section id="screen-prazos-transito" class="screen active">
    <div class="back-row">
      <router-link to="/" class="btn">← Voltar</router-link>
      <router-link to="/ended" class="btn btn-danger">Sair</router-link>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title-with-icon">
          <img src="/prazos.png" alt="Icon" class="card-title-icon" />
          <h2 class="card-title">Prazos de Licenciamento</h2>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-field">
          <label class="field-label">Selecione a UF</label>
          <select v-model="selectedUf">
            <option v-for="(data, uf) in CALENDARIOS_UF" :key="uf" :value="uf">{{ data.nome }} ({{ uf }})</option>
          </select>
        </div>

        <div v-if="currentData" class="mt-16">
          <h3 class="field-label-orange" style="text-align:center; font-size:18px; margin-bottom:12px;">
            Licenciamento {{ currentData.nome }}
          </h3>
          <div class="infra-table-container">
            <table class="infra-table">
              <thead>
                <tr>
                  <th style="text-align:center;">Final de Placa</th>
                  <th style="text-align:center;">Data Limite</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(final, index) in ordem" :key="final">
                  <td style="text-align:center; font-weight:bold; color:var(--primary);">{{ final }}</td>
                  <td style="text-align:center;">{{ currentData.datas[index] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="mt-12" style="font-size:12px; color:var(--label); font-style:italic;">
            * {{ currentData.obs }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
