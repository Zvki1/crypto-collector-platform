/**
 * TEST DU FLUX D'AUTHENTIFICATION
 *
 * Ce test simule le parcours complet d'un utilisateur :
 * 1. Inscription (register)
 * 2. Connexion (login)
 * 3. Accès à des ressources protégées avec le token JWT
 *
 * OBJECTIF : Mesurer la performance du système d'authentification
 *
 * COMMENT LE LANCER :
 * k6 run performance-tests/scenarios/auth-flow.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';

const errorRate = new Rate('errors');
const successfulLogins = new Counter('successful_logins');

export const options = {
  vus: 5,
  duration: '30s',

  thresholds: {
    http_req_duration: ['p(95)<800'],
    errors: ['rate<0.05'],
  },
};

const BASE_URL = 'http://localhost:3000';

/**
 * Fonction pour générer un username unique
 */
function generateUsername() {
  const random = Math.floor(Math.random() * 100000);
  return `user${random}`;
}

/**
 * Fonction pour générer un email unique
 */
function generateEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `test_${timestamp}_${random}@example.com`;
}

export default function () {
  const email = generateEmail();
  const username = generateUsername();
  const password = 'TestPassword123';

  // ═══════════════════════════════════════════════════════════
  // ÉTAPE 1 : INSCRIPTION
  // ═══════════════════════════════════════════════════════════
  const registerPayload = JSON.stringify({
    email: email,
    username: username,
    password: password,
  });

  const registerParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const registerResponse = http.post(
    `${BASE_URL}/auth/register`,
    registerPayload,
    registerParams,
  );

  const registerSuccess = check(registerResponse, {
    '✓ Register status is 201': (r) => r.status === 201,
    '✓ Register returns user data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && body.data && body.data.id;
      } catch {
        return false;
      }
    },
  });

  if (!registerSuccess) {
    errorRate.add(1);
    console.log(
      `❌ Registration failed: ${registerResponse.status} - ${registerResponse.body}`,
    );
    return; // Arrêter ce scénario si l'inscription échoue
  }

  sleep(1);

  // ═══════════════════════════════════════════════════════════
  // ÉTAPE 2 : CONNEXION
  // ═══════════════════════════════════════════════════════════
  const loginPayload = JSON.stringify({
    email: email,
    password: password,
  });

  const loginResponse = http.post(
    `${BASE_URL}/auth/login`,
    loginPayload,
    registerParams,
  );

  const loginSuccess = check(loginResponse, {
    '✓ Login status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    '✓ Login response time < 500ms': (r) => r.timings.duration < 500,
    '✓ Login returns access token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && body.data && body.data.access_token;
      } catch {
        return false;
      }
    },
  });

  if (!loginSuccess) {
    errorRate.add(1);
    console.log(`❌ Login failed: ${loginResponse.status}`);
    return;
  }

  successfulLogins.add(1);

  // Extraire le token JWT
  let token;
  try {
    const loginBody = JSON.parse(loginResponse.body);
    token = loginBody.data.access_token;
  } catch (e) {
    console.log('❌ Failed to parse login response');
    errorRate.add(1);
    return;
  }

  sleep(1);

  // ═══════════════════════════════════════════════════════════
  // ÉTAPE 3 : ACCÈS À UNE RESSOURCE PROTÉGÉE
  // ═══════════════════════════════════════════════════════════
  const protectedParams = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Exemple : Accéder au profil utilisateur
  const profileResponse = http.get(`${BASE_URL}/users/me`, protectedParams);

  check(profileResponse, {
    '✓ Protected route status is 200': (r) => r.status === 200,
    '✓ Protected route response time < 300ms': (r) => r.timings.duration < 300,
  }) || errorRate.add(1);

  sleep(2);
}

export function handleSummary(data) {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log("║     RÉSUMÉ DU TEST D'AUTHENTIFICATION                  ║");
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const metrics = data.metrics;

  console.log('AUTHENTIFICATION :');
  if (metrics.successful_logins) {
    console.log(
      `   • Connexions réussies : ${metrics.successful_logins.values.count}`,
    );
  }

  console.log('\nPERFORMANCE :');
  if (metrics.http_req_duration) {
    const avg = metrics.http_req_duration.values.avg.toFixed(2);
    const p95 = metrics.http_req_duration.values['p(95)'].toFixed(2);
    console.log(`   • Temps de réponse moyen : ${avg}ms`);
    console.log(`   • Temps de réponse P95 : ${p95}ms`);
  }

  console.log('\nFIABILITÉ :');
  if (metrics.checks) {
    const checkRate = (metrics.checks.values.rate * 100).toFixed(2);
    console.log(`   • Taux de réussite : ${checkRate}%`);
  }

  if (metrics.errors) {
    const errorPercentage = (metrics.errors.values.rate * 100).toFixed(2);
    console.log(`   • Taux d'erreur : ${errorPercentage}%`);
  }

  console.log('');

  return {
    stdout: '',
  };
}
