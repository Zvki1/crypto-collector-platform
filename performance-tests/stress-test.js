/**
 * TEST DE STRESS
 *
 * Ce test augmente progressivement la charge pour trouver les LIMITES du système.
 * On monte jusqu'à ce que ça casse (ou qu'on atteigne la limite configurée).
 *
 * SCÉNARIO :
 * - Montée progressive : 0 → 100 utilisateurs sur 5 minutes
 * - Maintien du stress : 100 utilisateurs pendant 3 minutes
 * - Descente progressive : 100 → 0 sur 2 minutes

 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('custom_response_time');

export const options = {
  stages: [
    // Phase 1 : Ramp-up (montée en charge)
    { duration: '2m', target: 20 }, // 0 → 20 utilisateurs
    { duration: '2m', target: 50 }, // 20 → 50 utilisateurs
    { duration: '1m', target: 100 }, // 50 → 100 utilisateurs

    // Phase 2 : Maintien du stress
    { duration: '3m', target: 100 }, // Maintien a 100 utilisateurs

    // Phase 3 : Cool down (descente)
    { duration: '2m', target: 0 }, // Retour a 0
  ],

  thresholds: {
    // Seuils pour identifier quand le système commence à flancher
    http_req_duration: ['p(95)<2000'], // 2 secondes max pour 95% des requêtes
    http_req_failed: ['rate<0.1'], // Max 10% d'échecs
    errors: ['rate<0.1'],
  },
};

const BASE_URL = 'http://localhost:3000';

const CRYPTO_IDS = [
  'ed52e5c9-cfd8-4ffa-9d7e-a49d965ed257', // Bitcoin
  'c35ad5e6-5956-4e14-bc95-98e4035978fb', // Ethereum
  'badc1bbb-cf79-4345-8d81-557bbad84965', // Solana
  '5d91f503-d8e9-412f-99ab-6cc4a4b04bf5', // USDS
];

export default function () {
  // Simuler différents scénarios utilisateur
  const scenarios = [
    // Scénario 1 : Consultation simple (70% des users)
    () => {
      const response = http.get(`${BASE_URL}`);
      const success = check(response, {
        'API accessible': (r) => r.status === 200,
        'returns Hello World': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.success === true;
          } catch {
            return false;
          }
        },
      });
      errorRate.add(!success);
      responseTime.add(response.timings.duration);
      sleep(1);
    },

    // Scénario 2 : Liste des cryptos (20% des users)
    () => {
      const response = http.get(`${BASE_URL}/cryptos`);
      const success = check(response, {
        'cryptos ok': (r) => r.status === 200,
        'cryptos has data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.success === true && Array.isArray(body.data);
          } catch {
            return false;
          }
        },
      });
      errorRate.add(!success);
      responseTime.add(response.timings.duration);
      sleep(2);
    },

    // Scénario 3 : Détails d'une crypto (10% des users)
    () => {
      const cryptoId =
        CRYPTO_IDS[Math.floor(Math.random() * CRYPTO_IDS.length)];
      const response = http.get(`${BASE_URL}/cryptos/${cryptoId}`);
      const success = check(response, {
        'crypto details ok': (r) => r.status === 200,
        'crypto has data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.success === true && body.data && body.data.id;
          } catch {
            return false;
          }
        },
      });
      errorRate.add(!success);
      responseTime.add(response.timings.duration);
      sleep(1.5);
    },
  ];

  // Choisir un scénario selon la distribution
  const random = Math.random();
  if (random < 0.7) {
    scenarios[0](); // 70% - Consultation simple
  } else if (random < 0.9) {
    scenarios[1](); // 20% - Liste cryptos
  } else {
    scenarios[2](); // 10% - Détails crypto
  }
}

export function handleSummary(data) {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║        RÉSUMÉ DU TEST DE STRESS                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const metrics = data.metrics;

  console.log('SCALABILITÉ :');
  if (metrics.vus_max) {
    console.log(
      `   • Utilisateurs simultanés max : ${metrics.vus_max.values.max}`,
    );
  }

  console.log('\n⏱ LATENCE :');
  if (metrics.http_req_duration && metrics.http_req_duration.values) {
    const values = metrics.http_req_duration.values;
    const avg = values.avg ? values.avg.toFixed(2) : 'N/A';
    const p95 = values['p(95)'] ? values['p(95)'].toFixed(2) : 'N/A';
    const max = values.max ? values.max.toFixed(2) : 'N/A';

    console.log(`   • Moyenne : ${avg}ms`);
    console.log(
      `   • P95 : ${p95}ms ${p95 !== 'N/A' && p95 > 2000 ? '❌' : '✅'}`,
    );
    console.log(`   • Max : ${max}ms`);
  }

  console.log('\nVOLUME :');
  if (metrics.http_reqs) {
    const total = metrics.http_reqs.values.count;
    const rate = metrics.http_reqs.values.rate.toFixed(2);
    console.log(`   • Total de requêtes : ${total}`);
    console.log(`   • Requêtes/seconde : ${rate}`);
  }

  console.log('\nERREURS :');
  if (metrics.http_req_failed) {
    const failRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
    console.log(
      `   • Taux d'échec : ${failRate}% ${failRate > 10 ? '❌' : '✅'}`,
    );
  }

  

  return {
    stdout: '', // Le résumé a afficher
  };
}
