/**
 * Dados de Rodovias da Grande Florianópolis para Referência Rápida
 * Inclui nomes e marcos principais.
 */

export const RODOVIAS_REF_DATA = {
    "SC-401": {
        nome: "Rod. José Carlos Daux (Norte da Ilha)",
        refs: [
            { km: 0, desc: "Trevo do CIC / Início da Rodovia", lat: -27.5794, lng: -48.5135 },
            { km: 1.2, desc: "Viaduto de acesso ao João Paulo", lat: -27.5685, lng: -48.5085 },
            { km: 2.5, desc: "Floripa Shopping / Tok&Stok", lat: -27.5582, lng: -48.5042 },
            { km: 3.8, desc: "Passeio Primavera / ACATE", lat: -27.5465, lng: -48.4988 },
            { km: 5.3, desc: "Trevo de Cacupé", lat: -27.5342, lng: -48.4945 },
            { km: 6.5, desc: "Bairro Santo Antônio de Lisboa", lat: -27.5238, lng: -48.4912 },
            { km: 9.2, desc: "Posto PMRv (P19) / Comando", lat: -27.4985, lng: -48.4875 },
            { km: 13.5, desc: "Viaduto de Ratones", lat: -27.4682, lng: -48.4795 },
            { km: 17.2, desc: "Trevo de Jurerê / Vargem Pequena", lat: -27.4455, lng: -48.4685 },
            { km: 19.3, desc: "Fim da Rodovia / Trevo de Canasvieiras", lat: -27.4325, lng: -48.4612 }
        ]
    },
    "SC-403": {
        nome: "Rod. Armando Calil Bulos (Ingleses)",
        refs: [
            { km: 0, desc: "Entroncamento com SC-401", lat: -27.4325, lng: -48.4612 },
            { km: 1.5, desc: "Viaduto de Vargem do Bom Jesus", lat: -27.4385, lng: -48.4485 },
            { km: 3.2, desc: "Posto de Combustível (Entrada Ingleses)", lat: -27.4452, lng: -48.4325 },
            { km: 6.1, desc: "Final da Rodovia / Praia dos Ingleses", lat: -27.4428, lng: -48.3955 }
        ]
    },
    "SC-405": {
        nome: "Rod. Francisco Magno Vieira (Sul da Ilha)",
        refs: [
            { km: 0, desc: "Trevo da Seta / Início", lat: -27.6325, lng: -48.5185 },
            { km: 1.8, desc: "Trevo do Novo Aeroporto", lat: -27.6485, lng: -48.5142 },
            { km: 3.5, desc: "Trevo do Rio Tavares", lat: -27.6612, lng: -48.5085 },
            { km: 5.2, desc: "Elevado do Rio Tavares", lat: -27.6745, lng: -48.5025 }
        ]
    },
    "SC-406": {
        nome: "Rod. Admar Gonzaga / Barra da Lagoa",
        refs: [
            { km: 0, desc: "Itacorubi (Início)", lat: -27.5842, lng: -48.5025 },
            { km: 2.5, desc: "Mirante do Morro da Lagoa", lat: -27.5985, lng: -48.4885 },
            { km: 4.8, desc: "Centrinho da Lagoa", lat: -27.6042, lng: -48.4655 },
            { km: 10.5, desc: "Barra da Lagoa", lat: -27.5745, lng: -48.4325 }
        ]
    }
};

// Gerador automático de marcos a cada 300m para preencher os intervalos
Object.keys(RODOVIAS_REF_DATA).forEach(rod => {
    const mainRefs = RODOVIAS_REF_DATA[rod].refs;
    const maxKm = Math.max(...mainRefs.map(r => r.km));
    
    for (let i = 0.3; i <= maxKm; i += 0.3) {
        const roundedKm = Math.round(i * 10) / 10;
        if (!mainRefs.find(r => Math.abs(r.km - roundedKm) < 0.1)) {
            mainRefs.push({ km: roundedKm, desc: `Marco de ${Math.round(roundedKm * 1000)}m` });
        }
    }
    mainRefs.sort((a, b) => a.km - b.km);
});
