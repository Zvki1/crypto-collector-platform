/**
 * TEST DES ENDPOINTS CRYPTOS
 *
 * Ce test se concentre sur les endpoints liés aux cryptomonnaies,
 * qui sont probablement les plus utilisés de votre plateforme.
 *
 * ENDPOINTS TESTÉS :
 * - GET /cryptos              (liste complète)
 * - GET /cryptos/:id          (détails d'une crypto)
 * - GET /market-data/:id   (données de marché)
 *
 * OBJECTIF : Vérifier la performance des endpoints métier critiques
 *
 * COMMENT LE LANCER :
 * k6 run performance-tests/scenarios/crypto-endpoints.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const listCryptosTime = new Trend('list_cryptos_duration');
const getCryptoTime = new Trend('get_crypto_duration');
const marketDataTime = new Trend('market_data_duration');

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Montée à 10 utilisateurs
    { duration: '1m', target: 10 }, // Maintien à 10 utilisateurs
    { duration: '30s', target: 20 }, // Montée à 20 utilisateurs
    { duration: '1m', target: 20 }, // Maintien à 20 utilisateurs
    { duration: '30s', target: 0 }, // Descente
  ],

  thresholds: {
    // Seuils spécifiques par type d'opération
    list_cryptos_duration: ['p(95)<500'],
    get_crypto_duration: ['p(95)<300'],
    market_data_duration: ['p(95)<800'],

    // Seuils globaux
    http_req_duration: ['p(95)<1000'],
    errors: ['rate<0.02'],
  },
};

const BASE_URL = 'http://localhost:3000';

// Liste de cryptos populaires à tester
const POPULAR_CRYPTOS = ['bitcoin', 'ethereum', 'solana'];

export default function () {
  // Scénario réaliste d'utilisation

  // ════════════════════════════════════════════════════════
  // SCÉNARIO 1 : Consultation de la liste des cryptos (40%)
  // ════════════════════════════════════════════════════════
  if (Math.random() < 0.4) {
    const response = http.get(`${BASE_URL}/cryptos`);
    listCryptosTime.add(response.timings.duration);

    check(response, {
      '✓ List cryptos status is 200': (r) => r.status === 200,
      '✓ List cryptos has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body) && body.length > 0;
        } catch {
          return false;
        }
      },
      '✓ List cryptos response < 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);

    sleep(2);
  }

  // ════════════════════════════════════════════════════════
  // SCÉNARIO 2 : Consultation des données de marché (10%)
  // ════════════════════════════════════════════════════════
  else {
    const response = http.get(`${BASE_URL}/market-data/prices`);
    marketDataTime.add(response.timings.duration);

    check(response, {
      '✓ Market data status is 200': (r) => r.status === 200,
      '✓ Market data response < 800ms': (r) => r.timings.duration < 800,
    }) || errorRate.add(1);

    sleep(3);
  }
}

export function handleSummary(data) {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     RÉSUMÉ DES TESTS ENDPOINTS CRYPTOS                 ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const metrics = data.metrics;

  console.log('📊 PERFORMANCE PAR ENDPOINT :\n');

  // Liste des cryptos
  if (metrics.list_cryptos_duration) {
    const avg = metrics.list_cryptos_duration.values.avg.toFixed(2);
    const p95 = metrics.list_cryptos_duration.values['p(95)'].toFixed(2);
    console.log('   📋 GET /cryptos (liste)');
    console.log(`      • Moyenne : ${avg}ms`);
    console.log(`      • P95 : ${p95}ms ${p95 < 500 ? '✅' : '❌'}`);
  }

  // Détails d'une crypto
  if (metrics.get_crypto_duration) {
    const avg = metrics.get_crypto_duration.values.avg.toFixed(2);
    const p95 = metrics.get_crypto_duration.values['p(95)'].toFixed(2);
    console.log('\n   🔍 GET /cryptos/:id (détails)');
    console.log(`      • Moyenne : ${avg}ms`);
    console.log(`      • P95 : ${p95}ms ${p95 < 300 ? '✅' : '❌'}`);
  }

  // Données de marché
  if (metrics.market_data_duration) {
    const avg = metrics.market_data_duration.values.avg.toFixed(2);
    const p95 = metrics.market_data_duration.values['p(95)'].toFixed(2);
    console.log('\n   📈 GET /market-data/prices');
    console.log(`      • Moyenne : ${avg}ms`);
    console.log(`      • P95 : ${p95}ms ${p95 < 800 ? '✅' : '❌'}`);
  }

  console.log('\n📊 STATISTIQUES GLOBALES :\n');

  if (metrics.http_reqs) {
    const total = metrics.http_reqs.values.count;
    const rate = metrics.http_reqs.values.rate.toFixed(2);
    console.log(`   • Total de requêtes : ${total}`);
    console.log(`   • Requêtes par seconde : ${rate}`);
  }

  if (metrics.errors) {
    const errorPercentage = (metrics.errors.values.rate * 100).toFixed(2);
    const status = errorPercentage < 2 ? '✅' : '❌';
    console.log(`   • Taux d'erreur : ${errorPercentage}% ${status}`);
  }

  if (metrics.checks) {
    const checkRate = (metrics.checks.values.rate * 100).toFixed(2);
    console.log(`   • Taux de réussite : ${checkRate}%`);
  }

  console.log('\n💡 RECOMMANDATIONS :\n');

  // Analyser les performances et donner des recommandations
  let hasIssues = false;

  if (
    metrics.list_cryptos_duration &&
    metrics.list_cryptos_duration.values['p(95)'] > 500
  ) {
    console.log('   ⚠️  Liste des cryptos lente : Envisager une mise en cache');
    hasIssues = true;
  }

  if (
    metrics.get_crypto_duration &&
    metrics.get_crypto_duration.values['p(95)'] > 300
  ) {
    console.log('   ⚠️  Détails crypto lents : Optimiser les requêtes DB');
    hasIssues = true;
  }

  if (
    metrics.market_data_duration &&
    metrics.market_data_duration.values['p(95)'] > 800
  ) {
    console.log("   ⚠️  Données de marché lentes : Vérifier l'API externe");
    hasIssues = true;
  }

  if (!hasIssues) {
    console.log('   ✅ Toutes les performances sont dans les normes !');
  }

  console.log('');

  return {
    stdout: '',
  };
}
