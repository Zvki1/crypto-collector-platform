#!/bin/bash

# 🧪 Script de test du système Docker
# Ce script vérifie que tous les services fonctionnent correctement

echo "================================"
echo "🧪 TEST DU SYSTÈME CRYPTO COLLECTOR"
echo "================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour tester un endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    echo -n "Testing $name... "
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" == "$expected_code" ]; then
        echo -e "${GREEN}✅ OK (HTTP $response)${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (HTTP $response, expected $expected_code)${NC}"
        return 1
    fi
}

# Fonction pour tester un service
test_service() {
    local name=$1
    local container=$2
    
    echo -n "Testing $name container... "
    if docker ps | grep -q "$container.*Up"; then
        echo -e "${GREEN}✅ Running${NC}"
        return 0
    else
        echo -e "${RED}❌ Not running${NC}"
        return 1
    fi
}

echo "📦 1. VÉRIFICATION DES CONTENEURS"
echo "================================"
test_service "PostgreSQL" "crypto_postgres"
test_service "Redis" "crypto_redis"
test_service "API" "crypto_api"
test_service "Collector" "crypto_collector"
test_service "Frontend" "crypto_frontend"
test_service "PgAdmin" "crypto_pgadmin"
test_service "Prometheus" "crypto_prometheus"
test_service "Grafana" "crypto_grafana"
echo ""

echo "🌐 2. VÉRIFICATION DES ENDPOINTS"
echo "================================"
test_endpoint "API Health" "http://localhost:3000/health"
test_endpoint "API Cryptos" "http://localhost:3000/cryptos"
test_endpoint "Frontend" "http://localhost:5173"
test_endpoint "PgAdmin" "http://localhost:5050" 302
test_endpoint "Prometheus" "http://localhost:9090"
test_endpoint "Grafana" "http://localhost:3001" 302
echo ""

echo "📊 3. VÉRIFICATION DES DONNÉES"
echo "================================"

# Test API - Cryptos
echo -n "Checking API cryptos data... "
cryptos_count=$(curl -s http://localhost:3000/cryptos 2>/dev/null | grep -o '"id"' | wc -l | tr -d ' ')
if [ "$cryptos_count" -gt 0 ]; then
    echo -e "${GREEN}✅ OK ($cryptos_count cryptos found)${NC}"
else
    echo -e "${RED}❌ No data${NC}"
fi

# Test Base de données
echo -n "Checking database connection... "
db_check=$(docker exec crypto_postgres psql -U crypto_user -d crypto_platform -c "SELECT COUNT(*) FROM \"Crypto\";" -t 2>/dev/null | tr -d ' ')
if [ "$db_check" -gt 0 ]; then
    echo -e "${GREEN}✅ OK ($db_check cryptos in DB)${NC}"
else
    echo -e "${YELLOW}⚠️  Empty database${NC}"
fi

# Test Redis
echo -n "Checking Redis connection... "
redis_check=$(docker exec crypto_redis redis-cli ping 2>/dev/null)
if [ "$redis_check" == "PONG" ]; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
fi

echo ""

echo "🔍 4. HEALTHCHECK STATUS"
echo "================================"
docker-compose ps --format "table {{.Name}}\t{{.Status}}"
echo ""

echo "📝 5. RÉSUMÉ"
echo "================================"
echo -e "Frontend:    ${GREEN}http://localhost:5173${NC}"
echo -e "API:         ${GREEN}http://localhost:3000${NC}"
echo -e "API Docs:    ${GREEN}http://localhost:3000/api${NC}"
echo -e "PgAdmin:     ${GREEN}http://localhost:5050${NC} (rzaki@hotmail.fr / admin)"
echo -e "Prometheus:  ${GREEN}http://localhost:9090${NC}"
echo -e "Grafana:     ${GREEN}http://localhost:3001${NC} (admin / admin)"
echo ""

echo "🎯 COMMANDES UTILES"
echo "================================"
echo "Logs API:       docker-compose logs -f api"
echo "Logs Collector: docker-compose logs -f collector"
echo "Logs Frontend:  docker-compose logs -f frontend"
echo "Tous les logs:  docker-compose logs -f"
echo "Redémarrer:     docker-compose restart"
echo "Arrêter:        docker-compose down"
echo ""

echo "✅ Test terminé !"
