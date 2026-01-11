/**
 * TEST DE CHARGE BASIQUE
 *
 * Ce test simule 10 utilisateurs qui font des requêtes pendant 30 secondes.
 * C'est le test le plus simple pour commencer.
 *
 * OBJECTIF : Vérifier que l'API répond correctement sous une charge normale
 *
 * COMMENT LE LANCER :
 * k6 run performance-tests/basic-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Métrique personnalisée pour suivre le taux d'erreur
const errorRate = new Rate('errors');

// Configuration du test
export const options = {
  // Nombre d'utilisateurs virtuels (VUs)
  vus: 10,

  // Durée du test
  duration: '30s',

  // Seuils de performance à respecter
  thresholds: {
    // 95% des requêtes doivent être < 500ms
    http_req_duration: ['p(95)<500'],

    // Taux d'erreur doit être < 1%
    errors: ['rate<0.01'],

    // 95% des requêtes doivent réussir
    checks: ['rate>0.95'],
  },
};

// URL de base de l'API (à ajuster selon votre configuration)
const BASE_URL = 'http://localhost:3001';

/**
 * Fonction principale exécutée par chaque utilisateur virtuel
 */
export default function () {
  // TEST 1 : Vérifier que l'API est accessible
  const healthResponse = http.get(`${BASE_URL}/health`);

  check(healthResponse, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  // Petite pause (1 seconde) pour simuler un utilisateur réel
  sleep(1);

  // TEST 2 : Récupérer la liste des cryptos
  const cryptosResponse = http.get(`${BASE_URL}/cryptos`);

  check(cryptosResponse, {
    'cryptos status is 200': (r) => r.status === 200,
    'cryptos response time < 500ms': (r) => r.timings.duration < 500,
    'cryptos response has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) && body.length > 0;
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(1);

  // TEST 3 : Récupérer les détails d'une crypto spécifique (Bitcoin)
  const bitcoinResponse = http.get(`${BASE_URL}/cryptos/bitcoin`);

  check(bitcoinResponse, {
    'bitcoin status is 200': (r) => r.status === 200,
    'bitcoin response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);
}

/**
 * Fonction exécutée à la fin du test pour afficher un résumé
 */
export function handleSummary(data) {
  console.log('\n=== RÉSUMÉ DU TEST DE CHARGE BASIQUE ===\n');

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

// Fonction helper pour créer un résumé textuel
function textSummary(data, options) {
  const indent = options.indent || '';
  const colors = options.enableColors;

  let summary = '';

  // Métriques principales
  const metrics = data.metrics;

  if (metrics.http_req_duration) {
    summary += `${indent}✓ Temps de réponse moyen : ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += `${indent}✓ Temps de réponse P95 : ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  }

  if (metrics.http_reqs) {
    summary += `${indent}✓ Total de requêtes : ${metrics.http_reqs.values.count}\n`;
    summary += `${indent}✓ Requêtes par seconde : ${metrics.http_reqs.values.rate.toFixed(2)}\n`;
  }

  if (metrics.checks) {
    const checkRate = (metrics.checks.values.rate * 100).toFixed(2);
    summary += `${indent}✓ Taux de réussite : ${checkRate}%\n`;
  }

  return summary;
}
