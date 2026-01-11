// ⚠️ DEPRECATED: Ce fichier n'est plus utilisé
// Les secrets JWT sont maintenant gérés via les variables d'environnement
//
// Configuration requise dans votre fichier .env :
// JWT_SECRET=votre-secret-super-securise
// JWT_EXPIRES_IN=7d
//
// Ce fichier est conservé uniquement pour référence historique.
// L'application utilise maintenant ConfigService pour charger JWT_SECRET depuis .env

export const jwtConstants = {
  secret: 'DEPRECATED - Use JWT_SECRET environment variable instead',
};
