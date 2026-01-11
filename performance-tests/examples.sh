#!/bin/bash

# Exemples de commandes pour lancer les tests de performance avec des options personnalisées

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  Exemples de Commandes - Tests de Performance            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

echo "📚 UTILISATION DE BASE"
echo "──────────────────────────────────────────────────────────"
echo ""

echo "1️⃣  Test basique par défaut (10 users, 30s)"
echo "   k6 run performance-tests/basic-load-test.js"
echo ""

echo "2️⃣  Test avec plus d'utilisateurs"
echo "   k6 run --vus 20 --duration 1m performance-tests/basic-load-test.js"
echo ""

echo "3️⃣  Test avec une autre URL d'API"
echo "   k6 run -e API_URL=http://localhost:3000 performance-tests/basic-load-test.js"
echo ""

echo ""
echo "🎨 OPTIONS AVANCÉES"
echo "──────────────────────────────────────────────────────────"
echo ""

echo "4️⃣  Générer un rapport HTML"
echo "   k6 run --out html=results/report.html performance-tests/basic-load-test.js"
echo ""

echo "5️⃣  Exporter les résultats en JSON"
echo "   k6 run --out json=results/metrics.json performance-tests/basic-load-test.js"
echo ""

echo "6️⃣  Mode silencieux (moins de logs)"
echo "   k6 run --quiet performance-tests/basic-load-test.js"
echo ""

echo "7️⃣  Mode verbose (plus de détails)"
echo "   k6 run --verbose performance-tests/basic-load-test.js"
echo ""

echo ""
echo "⚙️  PERSONNALISATION VIA VARIABLES D'ENVIRONNEMENT"
echo "──────────────────────────────────────────────────────────"
echo ""

echo "8️⃣  Changer l'URL de l'API"
echo "   API_URL=http://api.example.com k6 run performance-tests/basic-load-test.js"
echo ""

echo "9️⃣  Ajuster le nombre d'utilisateurs virtuels"
echo "   VUS=50 DURATION=2m k6 run performance-tests/basic-load-test.js"
echo ""

echo "🔟 Personnaliser le think time (temps d'attente entre requêtes)"
echo "   THINK_TIME_MIN=1 THINK_TIME_MAX=5 k6 run performance-tests/basic-load-test.js"
echo ""

echo ""
echo "📊 TESTS MULTIPLES"
echo "──────────────────────────────────────────────────────────"
echo ""

echo "1️⃣1️⃣  Lancer plusieurs tests en séquence"
echo "   npm run perf:test && npm run perf:spike && npm run perf:auth"
echo ""

echo "1️⃣2️⃣  Lancer tous les tests et générer des rapports"
echo "   for test in performance-tests/*.js; do"
echo "     k6 run --out json=results/\$(basename \$test .js).json \$test"
echo "   done"
echo ""

echo ""
echo "🔧 SCÉNARIOS SPÉCIFIQUES"
echo "──────────────────────────────────────────────────────────"
echo ""

echo "1️⃣3️⃣  Test de charge progressive (0 → 50 users sur 5min)"
echo "   k6 run --stage 5m:50 performance-tests/basic-load-test.js"
echo ""

echo "1️⃣4️⃣  Test avec pic soudain personnalisé"
echo "   SPIKE_TARGET=100 k6 run performance-tests/spike-test.js"
echo ""

echo "1️⃣5️⃣  Test de stress avec limite personnalisée"
echo "   STRESS_MAX=200 k6 run performance-tests/stress-test.js"
echo ""

echo ""
echo "📈 MONITORING EN TEMPS RÉEL"
echo "──────────────────────────────────────────────────────────"
echo ""

echo "1️⃣6️⃣  Afficher les métriques en temps réel"
echo "   k6 run --summary-trend-stats=\"avg,p(50),p(95),p(99),max\" performance-tests/basic-load-test.js"
echo ""

echo "1️⃣7️⃣  Envoyer les métriques à InfluxDB (si configuré)"
echo "   k6 run --out influxdb=http://localhost:8086/mydb performance-tests/basic-load-test.js"
echo ""

echo ""
echo "🚨 DÉBOGAGE"
echo "──────────────────────────────────────────────────────────"
echo ""

echo "1️⃣8️⃣  Mode debug (afficher toutes les requêtes)"
echo "   LOG_LEVEL=debug k6 run performance-tests/basic-load-test.js"
echo ""

echo "1️⃣9️⃣  Tester avec un seul utilisateur pour vérifier la logique"
echo "   k6 run --vus 1 --iterations 1 performance-tests/basic-load-test.js"
echo ""

echo ""
echo "💡 CONSEILS"
echo "──────────────────────────────────────────────────────────"
echo ""
echo "• Commencez toujours par le test basique"
echo "• Augmentez progressivement la charge"
echo "• Surveillez les ressources système (CPU, RAM, connexions DB)"
echo "• Testez sur un environnement similaire à la production"
echo "• Documentez vos résultats"
echo ""

echo "📚 DOCUMENTATION COMPLÈTE"
echo "──────────────────────────────────────────────────────────"
echo ""
echo "• Guide rapide    : performance-tests/QUICKSTART.md"
echo "• Documentation   : performance-tests/PERFORMANCE_TESTING.md"
echo "• Exemples        : performance-tests/EXAMPLES.md"
echo "• Config          : performance-tests/config.js"
echo ""
