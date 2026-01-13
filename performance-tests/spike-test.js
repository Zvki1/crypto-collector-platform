/**
 * TEST DE PIC DE CHARGE (SPIKE TEST)
 *
 * Ce test simule un pic soudain de trafic pour voir comment l'API réagit.
 * Par exemple : un tweet viral, une news importante sur une crypto
 *
 * SCÉNARIO :
 * - Démarrage : 2 utilisateurs
 * - Pic soudain : 50 utilisateurs pendant 1 minute
 * - Retour à la normale : 2 utilisateurs

 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  // Configuration des étapes (stages)
  stages: [
    { duration: '10s', target: 2 }, // Démarrage  avec 2 utilisateurs
    { duration: '10s', target: 50 }, // PIC ! Montée rapide à 50 utilisateurs
    { duration: '1m', target: 50 }, // Maintien du pic pendant 1 minute
    { duration: '10s', target: 2 }, // Retour à la normale
    { duration: '10s', target: 0 }, // Fin du test
  ],

  thresholds: {
    http_req_duration: ['p(95)<1000'],
    errors: ['rate<0.05'], // 5% d'erreurs acceptables pendant le pic
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Scenario réaliste : consultation rapide de plusieurs cryptos
  const endpoints = [
    '/cryptos',
    '/cryptos/ed52e5c9-cfd8-4ffa-9d7e-a49d965ed257',
    '/cryptos/c35ad5e6-5956-4e14-bc95-98e4035978fb',
  ];

  // Choix aléatoire d'un endpoint
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const response = http.get(`${BASE_URL}${endpoint}`);

  check(response, {
    'status is 200': (r) => r.status === 200,
    'no server errors': (r) => r.status < 500,
  }) || errorRate.add(1);

  // Pause courte (0.5-2 secondes) pour simuler des utilisateurs rapides
  sleep(Math.random() * 1.5 + 0.5);
}

export function handleSummary(data) {
  console.log('\n=== RÉSUMÉ DU TEST DE PIC DE CHARGE ===\n');
  console.log('Ce test simule un pic soudain de trafic (2 → 50 utilisateurs)');

  return {
    stdout: generateSummary(data),
  };
}

function generateSummary(data) {
  const metrics = data.metrics;
  let summary = '';

  if (metrics.http_req_duration) {
    summary += `Latence moyenne : ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += `Latence P95 : ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    summary += `Latence maximale : ${metrics.http_req_duration.values.max.toFixed(2)}ms\n`;
  }

  if (metrics.http_reqs) {
    summary += `Total requêtes : ${metrics.http_reqs.values.count}\n`;
  }

  if (metrics.errors) {
    const errorPercentage = (metrics.errors.values.rate * 100).toFixed(2);
    summary += `${errorPercentage > 5 ? '❌' : '✅'} Taux d'erreur : ${errorPercentage}%\n`;
  }

  return summary;
}
