#!/bin/bash

# Script de test pour vérifier l'intégration du login

echo "🧪 Test de l'intégration Login"
echo "================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Vérifier que le backend est accessible
echo "1️⃣ Test de connexion au backend..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend accessible sur http://localhost:3000${NC}"
else
    echo -e "${RED}✗ Backend non accessible. Démarrez-le avec: npm run start:api${NC}"
    exit 1
fi
echo ""

# Test 2: Vérifier l'endpoint de login
echo "2️⃣ Test de l'endpoint /auth/login..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrongpassword"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ Endpoint /auth/login fonctionne (401 attendu pour mauvais credentials)${NC}"
else
    echo -e "${YELLOW}⚠ Code HTTP: $HTTP_CODE${NC}"
fi
echo ""

# Test 3: Vérifier CORS
echo "3️⃣ Test de la configuration CORS..."
CORS_RESPONSE=$(curl -s -I -X OPTIONS http://localhost:3000/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST")

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✓ CORS configuré correctement${NC}"
else
    echo -e "${RED}✗ CORS non configuré${NC}"
fi
echo ""

# Test 4: Vérifier les fichiers frontend
echo "4️⃣ Vérification des fichiers frontend..."
FILES=(
    "Cryptocollectorfront/.env"
    "Cryptocollectorfront/src/config/api.ts"
    "Cryptocollectorfront/src/services/api.ts"
    "Cryptocollectorfront/src/services/auth.service.ts"
    "Cryptocollectorfront/src/types/api.types.ts"
)

ALL_FILES_EXIST=true
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}✗ $file (manquant)${NC}"
        ALL_FILES_EXIST=false
    fi
done
echo ""

# Test 5: Vérifier axios
echo "5️⃣ Vérification de la dépendance axios..."
if grep -q '"axios"' Cryptocollectorfront/package.json; then
    echo -e "${GREEN}✓ axios installé${NC}"
else
    echo -e "${RED}✗ axios non installé. Exécutez: cd Cryptocollectorfront && npm install axios${NC}"
fi
echo ""

# Résumé
echo "================================"
echo "📊 Résumé"
echo "================================"
echo ""
echo "Pour tester l'intégration complète:"
echo "1. Backend: ✓ Déjà en cours d'exécution"
echo "2. Frontend: Exécutez 'cd Cryptocollectorfront && npm run dev'"
echo "3. Ouvrez http://localhost:5173"
echo "4. Créez un compte ou connectez-vous"
echo ""
echo "Documentation:"
echo "- docs/LOGIN_INTEGRATION.md"
echo "- Cryptocollectorfront/README_INTEGRATION.md"
echo ""
