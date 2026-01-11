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
 *
 * OBJECTIF : Déterminer la capacité maximale de l'API
 *
 * COMMENT LE LANCER :
 * k6 run performance-tests/stress-test.js
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
    { duration: '1m', target: 100 }, // 50 → 100 utilisateurs (STRESS !)

    // Phase 2 : Maintien du stress
    { duration: '3m', target: 100 }, // Maintien à 100 utilisateurs

    // Phase 3 : Cool down (descente)
    { duration: '2m', target: 0 }, // Retour à 0
  ],

  thresholds: {
    // Seuils pour identifier quand le système commence à flancher
    http_req_duration: ['p(95)<2000'], // 2 secondes max pour 95% des requêtes
    http_req_failed: ['rate<0.1'], // Max 10% d'échecs
    errors: ['rate<0.1'],
  },
};

const BASE_URL = 'http://localhost:3001';

export default function () {
  // Simuler différents scénarios utilisateur
  const scenarios = [
    // Scénario 1 : Consultation simple (70% des users)
    () => {
      const response = http.get(`${BASE_URL}/health`);
      check(response, { 'health ok': (r) => r.status === 200 }) ||
        errorRate.add(1);
      responseTime.add(response.timings.duration);
      sleep(1);
    },

    // Scénario 2 : Liste des cryptos (20% des users)
    () => {
      const response = http.get(`${BASE_URL}/cryptos`);
      check(response, { 'cryptos ok': (r) => r.status === 200 }) ||
        errorRate.add(1);
      responseTime.add(response.timings.duration);
      sleep(2);
    },

    // Scénario 3 : Détails d'une crypto (10% des users)
    () => {
      const cryptos = ['bitcoin', 'ethereum', 'cardano', 'solana', 'polkadot'];
      const crypto = cryptos[Math.floor(Math.random() * cryptos.length)];
      const response = http.get(`${BASE_URL}/cryptos/${crypto}`);
      check(response, { 'crypto details ok': (r) => r.status === 200 }) ||
        errorRate.add(1);
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

  console.log('📈 SCALABILITÉ :');
  if (metrics.vus_max) {
    console.log(
      `   • Utilisateurs simultanés max : ${metrics.vus_max.values.max}`,
    );
  }

  console.log('\n⏱️  LATENCE :');
  if (metrics.http_req_duration) {
    const avg = metrics.http_req_duration.values.avg.toFixed(2);
    const p95 = metrics.http_req_duration.values['p(95)'].toFixed(2);
    const p99 = metrics.http_req_duration.values['p(99)'].toFixed(2);
    const max = metrics.http_req_duration.values.max.toFixed(2);

    console.log(`   • Moyenne : ${avg}ms`);
    console.log(`   • P95 : ${p95}ms ${p95 > 2000 ? '❌' : '✅'}`);
    console.log(`   • P99 : ${p99}ms ${p99 > 5000 ? '❌' : '✅'}`);
    console.log(`   • Max : ${max}ms`);
  }

  console.log('\n📊 VOLUME :');
  if (metrics.http_reqs) {
    const total = metrics.http_reqs.values.count;
    const rate = metrics.http_reqs.values.rate.toFixed(2);
    console.log(`   • Total de requêtes : ${total}`);
    console.log(`   • Requêtes/seconde : ${rate}`);
  }

  console.log('\n❌ ERREURS :');
  if (metrics.http_req_failed) {
    const failRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
    console.log(
      `   • Taux d'échec : ${failRate}% ${failRate > 10 ? '❌' : '✅'}`,
    );
  }

  console.log('\n💡 INTERPRÉTATION :');
  console.log('   • Si P95 < 500ms : Performance EXCELLENTE ✅');
  console.log('   • Si P95 < 1000ms : Performance BONNE ✅');
  console.log('   • Si P95 < 2000ms : Performance ACCEPTABLE ⚠️');
  console.log('   • Si P95 > 2000ms : Performance PROBLÉMATIQUE ❌');
  console.log('');

  return {
    stdout: '', // Le résumé est déjà affiché ci-dessus
  };
}
