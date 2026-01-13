/**
 * Configuration des tests de performance
 *
 * Ce fichier permet de centraliser et personnaliser la configuration
 * de tous les tests de performance.
 */

// URL de base de l'API
export const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

// Configuration des seuils par défaut
export const DEFAULT_THRESHOLDS = {
  // 95% des requêtes doivent être < 500ms
  http_req_duration: ['p(95)<500'],

  // Taux d'erreur < 1%
  http_req_failed: ['rate<0.01'],

  // 95% des checks doivent passer
  checks: ['rate>0.95'],
};

// Configuration des utilisateurs virtuels
export const VUS_CONFIG = {
  basic: {
    vus: parseInt(__ENV.VUS || '10'),
    duration: __ENV.DURATION || '30s',
  },
  spike: {
    stages: [
      { duration: '10s', target: 2 },
      { duration: '10s', target: parseInt(__ENV.SPIKE_TARGET || '50') },
      { duration: '1m', target: parseInt(__ENV.SPIKE_TARGET || '50') },
      { duration: '10s', target: 2 },
      { duration: '10s', target: 0 },
    ],
  },
  stress: {
    stages: [
      { duration: '2m', target: 20 },
      { duration: '2m', target: 50 },
      { duration: '1m', target: parseInt(__ENV.STRESS_MAX || '100') },
      { duration: '3m', target: parseInt(__ENV.STRESS_MAX || '100') },
      { duration: '2m', target: 0 },
    ],
  },
};

// Liste des cryptos populaires pour les tests
export const POPULAR_CRYPTOS = [
  'bitcoin',
  'ethereum',
  'solana',
];

// Configuration des timeouts
export const TIMEOUTS = {
  default: 30000, // 30 secondes
  slow: 60000, // 1 minute
  fast: 5000, // 5 secondes
};

// Configuration des pauses (think time)
export const THINK_TIME = {
  min: parseFloat(__ENV.THINK_TIME_MIN || '0.5'),
  max: parseFloat(__ENV.THINK_TIME_MAX || '2'),
};

// Headers HTTP communs
export const COMMON_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'User-Agent': 'k6-performance-test',
};

// Configuration du logging
export const LOG_LEVEL = __ENV.LOG_LEVEL || 'info'; // debug, info, warn, error

// Afficher la configuration au démarrage
export function logConfig() {
  if (LOG_LEVEL === 'debug') {
    console.log('\n=== CONFIGURATION DES TESTS ===');
    console.log(`API URL: ${BASE_URL}`);
    console.log(`VUs: ${VUS_CONFIG.basic.vus}`);
    console.log(`Duration: ${VUS_CONFIG.basic.duration}`);
    console.log(`Think time: ${THINK_TIME.min}s - ${THINK_TIME.max}s`);
    console.log('================================\n');
  }
}

// Fonction helper pour générer un think time aléatoire
export function randomThinkTime() {
  return Math.random() * (THINK_TIME.max - THINK_TIME.min) + THINK_TIME.min;
}

// Fonction helper pour choisir une crypto aléatoire
export function randomCrypto() {
  return POPULAR_CRYPTOS[Math.floor(Math.random() * POPULAR_CRYPTOS.length)];
}

// Fonction helper pour générer un email de test
export function generateTestEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `test_${timestamp}_${random}@example.com`;
}

// Exporter tout
export default {
  BASE_URL,
  DEFAULT_THRESHOLDS,
  VUS_CONFIG,
  POPULAR_CRYPTOS,
  TIMEOUTS,
  THINK_TIME,
  COMMON_HEADERS,
  LOG_LEVEL,
  logConfig,
  randomThinkTime,
  randomCrypto,
  generateTestEmail,
};
