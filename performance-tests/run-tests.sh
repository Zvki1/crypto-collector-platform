#!/bin/bash

# Script pour installer k6 et lancer les tests de performance
# Usage: ./performance-tests/run-tests.sh [test-name]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🚀 Tests de Performance - Crypto Collector Platform      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Fonction pour afficher un message coloré
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Vérifier si k6 est installé
check_k6_installation() {
    if ! command -v k6 &> /dev/null; then
        print_message "$RED" "❌ k6 n'est pas installé"
        echo ""
        print_message "$YELLOW" "📦 Installation de k6..."
        
        # Détecter l'OS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew &> /dev/null; then
                brew install k6
            else
                print_message "$RED" "❌ Homebrew n'est pas installé. Installez-le d'abord: https://brew.sh"
                exit 1
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            sudo apt-get update
            sudo apt-get install k6
        else
            print_message "$RED" "❌ OS non supporté pour l'installation automatique"
            print_message "$YELLOW" "Veuillez installer k6 manuellement: https://k6.io/docs/getting-started/installation"
            exit 1
        fi
        
        print_message "$GREEN" "✅ k6 installé avec succès !"
        echo ""
    else
        print_message "$GREEN" "✅ k6 est déjà installé (version $(k6 version --short))"
        echo ""
    fi
}

# Vérifier si l'API est démarrée
check_api_running() {
    print_message "$BLUE" "🔍 Vérification de l'API..."
    
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_message "$GREEN" "✅ L'API est accessible sur http://localhost:3001"
        echo ""
        return 0
    else
        print_message "$YELLOW" "⚠️  L'API n'est pas accessible sur http://localhost:3001"
        print_message "$YELLOW" "   Démarrez l'API avec: npm run start:dev api"
        echo ""
        read -p "Voulez-vous continuer quand même ? (y/n) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Afficher le menu
show_menu() {
    echo "Choisissez un test à lancer :"
    echo ""
    echo "  1) Test de charge basique      (30s, 10 users)  ⭐ Recommandé"
    echo "  2) Test de pic de charge       (~2min, 2→50 users)"
    echo "  3) Test de stress              (~10min, 0→100 users)"
    echo "  4) Test authentification       (30s, 5 users)"
    echo "  5) Test endpoints cryptos      (~4min, 10→20 users)"
    echo "  6) Tous les tests              (Complet, long)"
    echo ""
    echo "  q) Quitter"
    echo ""
}

# Lancer un test
run_test() {
    local test_file=$1
    local test_name=$2
    
    print_message "$BLUE" "🚀 Lancement : $test_name"
    echo ""
    
    k6 run "$test_file"
    
    echo ""
    print_message "$GREEN" "✅ Test terminé : $test_name"
    echo ""
}

# Main
main() {
    # Vérifier l'installation de k6
    check_k6_installation
    
    # Vérifier si l'API est en cours d'exécution
    check_api_running
    
    # Si un argument est passé, lancer le test correspondant
    if [ $# -eq 1 ]; then
        case $1 in
            basic|1)
                run_test "performance-tests/basic-load-test.js" "Test de charge basique"
                ;;
            spike|2)
                run_test "performance-tests/spike-test.js" "Test de pic de charge"
                ;;
            stress|3)
                run_test "performance-tests/stress-test.js" "Test de stress"
                ;;
            auth|4)
                run_test "performance-tests/scenarios/auth-flow.js" "Test authentification"
                ;;
            cryptos|5)
                run_test "performance-tests/scenarios/crypto-endpoints.js" "Test endpoints cryptos"
                ;;
            all|6)
                print_message "$YELLOW" "⚠️  Attention : Tous les tests vont être lancés (~20 minutes)"
                read -p "Continuer ? (y/n) " -n 1 -r
                echo ""
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    run_test "performance-tests/basic-load-test.js" "Test de charge basique"
                    run_test "performance-tests/spike-test.js" "Test de pic de charge"
                    run_test "performance-tests/scenarios/auth-flow.js" "Test authentification"
                    run_test "performance-tests/scenarios/crypto-endpoints.js" "Test endpoints cryptos"
                fi
                ;;
            *)
                print_message "$RED" "❌ Test inconnu: $1"
                echo ""
                show_menu
                exit 1
                ;;
        esac
    else
        # Mode interactif
        while true; do
            show_menu
            read -p "Votre choix : " choice
            echo ""
            
            case $choice in
                1)
                    run_test "performance-tests/basic-load-test.js" "Test de charge basique"
                    ;;
                2)
                    run_test "performance-tests/spike-test.js" "Test de pic de charge"
                    ;;
                3)
                    run_test "performance-tests/stress-test.js" "Test de stress"
                    ;;
                4)
                    run_test "performance-tests/scenarios/auth-flow.js" "Test authentification"
                    ;;
                5)
                    run_test "performance-tests/scenarios/crypto-endpoints.js" "Test endpoints cryptos"
                    ;;
                6)
                    print_message "$YELLOW" "⚠️  Attention : Tous les tests vont être lancés (~20 minutes)"
                    read -p "Continuer ? (y/n) " -n 1 -r
                    echo ""
                    if [[ $REPLY =~ ^[Yy]$ ]]; then
                        run_test "performance-tests/basic-load-test.js" "Test de charge basique"
                        run_test "performance-tests/spike-test.js" "Test de pic de charge"
                        run_test "performance-tests/scenarios/auth-flow.js" "Test authentification"
                        run_test "performance-tests/scenarios/crypto-endpoints.js" "Test endpoints cryptos"
                        print_message "$GREEN" "✅ Tous les tests sont terminés !"
                    fi
                    ;;
                q|Q)
                    print_message "$BLUE" "👋 Au revoir !"
                    exit 0
                    ;;
                *)
                    print_message "$RED" "❌ Choix invalide"
                    echo ""
                    ;;
            esac
            
            read -p "Appuyez sur Entrée pour continuer..."
            clear
        done
    fi
}

# Lancer le script
main "$@"
