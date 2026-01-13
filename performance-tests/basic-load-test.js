/**
 * TEST DE CHARGE BASIQUE
 *
 * Ce test simule 10 utilisateurs qui font des requêtes pendant 30 secondes.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Métrique personnalisée pour suivre le taux d'erreur
const errorRate = new Rate('errors');

// Configuration du test
export const options = {
  vus: 20,

  duration: '30s',

  // Seuils
  thresholds: {
    http_req_duration: ['p(95)<800'],

    errors: ['rate<0.10'],

    // 95% des requêtes doivent réussir
    checks: ['rate>0.95'],
  },
};

const BASE_URL = 'http://localhost:3000';

/**
 * Fonction principale exécutée par chaque utilisateur virtuel
 */
export default function () {
  const healthResponse = http.get(`${BASE_URL}`);

  const healthCheck = check(healthResponse, {
    'API is accessible': (r) => r.status === 200,
    'API returns Hello World': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && body.data === 'Hello World!';
      } catch {
        return false;
      }
    },
  });
  errorRate.add(!healthCheck);

  // Petite pause (1 seconde)
  sleep(1);

  // TEST 2 : Récupérer la liste des cryptos
  const cryptosResponse = http.get(`${BASE_URL}/cryptos`);

  const cryptosCheck = check(cryptosResponse, {
    'cryptos status is 200': (r) => r.status === 200,
    'cryptos response has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return (
          body.success === true &&
          Array.isArray(body.data) &&
          body.data.length > 0
        );
      } catch {
        return false;
      }
    },
  });
  errorRate.add(!cryptosCheck);

  sleep(1);
// btc
  const bitcoinResponse = http.get(
    `${BASE_URL}/cryptos/ed52e5c9-cfd8-4ffa-9d7e-a49d965ed257`,
  );

  const bitcoinCheck = check(bitcoinResponse, {
    'bitcoin status is 200': (r) => r.status === 200,
    'bitcoin has correct data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && body.data && body.data.symbol === 'BTC';
      } catch {
        return false;
      }
    },
  });
  errorRate.add(!bitcoinCheck);

  sleep(1);
}


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
