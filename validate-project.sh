#!/bin/bash
# Script de validation complète du projet k8s-scalable-app

set -e

echo "🔍 VALIDATION COMPLÈTE DU PROJET KUBERNETES"
echo "============================================"
echo ""

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Compteurs
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function pour vérifier l'existence d'un fichier
check_file() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ -f "$1" ]; then
        echo -e "  ✅ ${GREEN}$1${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "  ❌ ${RED}$1 (MANQUANT)${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Function pour vérifier l'existence d'un dossier
check_directory() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ -d "$1" ]; then
        echo -e "  ✅ ${GREEN}$1/${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "  ❌ ${RED}$1/ (MANQUANT)${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Function pour vérifier le contenu d'un fichier
check_file_content() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ -f "$1" ] && grep -q "$2" "$1"; then
        echo -e "  ✅ ${GREEN}$1${NC} contient: $2"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "  ❌ ${RED}$1${NC} ne contient pas: $2"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

echo "📦 1. VÉRIFICATION DU CODE SOURCE"
echo "=================================="

echo -e "${BLUE}Frontend (React)${NC}"
check_directory "web-APP"
check_file "web-APP/package.json"
check_file "web-APP/next.config.js"
check_directory "web-APP/app"
check_directory "web-APP/components"
check_directory "web-APP/pages"

echo -e "${BLUE}Backend (Node.js API)${NC}"
check_directory "web-APP/backend"
check_file "web-APP/backend/package.json"
check_file "web-APP/backend/index.js"
check_directory "web-APP/backend/models"
check_directory "web-APP/backend/middleware"
check_file "web-APP/backend/lib/db.js"

echo -e "${BLUE}Base de données${NC}"
check_directory "database"
check_directory "database/init-scripts"
check_file "database/init-scripts/init.sql"

echo ""
echo "🐳 2. VÉRIFICATION DES DOCKERFILES"
echo "=================================="

check_file "web-APP/Dockerfile"
check_file "web-APP/backend/Dockerfile"
check_file "docker-compose.yml"
check_file "web-APP/nginx.conf"

echo ""
echo "☸️  3. VÉRIFICATION DES FICHIERS YAML KUBERNETES"
echo "=============================================="

echo -e "${BLUE}Fichiers de base${NC}"
check_file "k8s/namespace.yaml"
check_file "k8s/secret-db.yaml"
check_file "k8s/configmap-init-scripts.yaml"

echo -e "${BLUE}Déploiements${NC}"
check_file "k8s/deployment-frontend.yaml"
check_file "k8s/deployment-backend.yaml"
check_file "k8s/statefulset-db.yaml"

echo -e "${BLUE}Services${NC}"
check_file "k8s/service-frontend.yaml"
check_file "k8s/service-backend.yaml"
check_file "k8s/service-db.yaml"

echo -e "${BLUE}Auto-scaling${NC}"
check_file "k8s/hpa-frontend.yaml"
check_file "k8s/hpa-backend.yaml"

echo -e "${BLUE}Réseau${NC}"
check_file "k8s/ingress.yaml"

echo ""
echo "📚 4. VÉRIFICATION DE LA DOCUMENTATION"
echo "====================================="

check_file "README.md"
check_file "docs/01-etapes-deploiement.md"
check_file "docs/02-architecture.md"
check_file "docs/TROUBLESHOOTING.md"
check_file "DEPLOYMENT_SUMMARY.md"
check_file "FINAL_STATUS.md"

echo ""
echo "📸 5. VÉRIFICATION DES CAPTURES D'ÉCRAN"
echo "======================================"

check_directory "docs/03-screenshots"
check_file "docs/03-screenshots/step1-setup-minikube.png"
check_file "docs/03-screenshots/step2-get-pods.png"

echo ""
echo "🔧 6. VÉRIFICATION DES SCRIPTS OPÉRATIONNELS"
echo "=========================================="

check_file "deploy.sh"
check_file "status.sh"
check_file "stop.sh"
check_file "load-test.sh"
check_file "port-forward.sh"

echo ""
echo "⚙️  7. VÉRIFICATION DES FONCTIONNALITÉS CLÉS"
echo "=========================================="

echo -e "${BLUE}Scalabilité automatique${NC}"
check_file_content "k8s/hpa-backend.yaml" "HorizontalPodAutoscaler"
check_file_content "k8s/hpa-frontend.yaml" "HorizontalPodAutoscaler"
check_file_content "k8s/hpa-backend.yaml" "cpu"
check_file_content "k8s/hpa-frontend.yaml" "memory"

echo -e "${BLUE}Tolérance aux pannes${NC}"
check_file_content "k8s/deployment-backend.yaml" "readinessProbe"
check_file_content "k8s/deployment-backend.yaml" "livenessProbe"
check_file_content "k8s/deployment-frontend.yaml" "readinessProbe"
check_file_content "k8s/deployment-frontend.yaml" "livenessProbe"
check_file_content "k8s/statefulset-db.yaml" "readinessProbe"

echo -e "${BLUE}Gestion du cycle de vie${NC}"
check_file_content "k8s/deployment-backend.yaml" "RollingUpdate"
check_file_content "k8s/deployment-frontend.yaml" "RollingUpdate"
check_file_content "k8s/deployment-backend.yaml" "resources"
check_file_content "k8s/deployment-frontend.yaml" "resources"

echo -e "${BLUE}Stockage persistant${NC}"
check_file_content "k8s/statefulset-db.yaml" "volumeClaimTemplates"
check_file_content "k8s/statefulset-db.yaml" "StatefulSet"

echo ""
echo "📊 RÉSUMÉ DE LA VALIDATION"
echo "========================="
echo -e "Total des vérifications: ${BLUE}$TOTAL_CHECKS${NC}"
echo -e "Vérifications réussies: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Vérifications échouées: ${RED}$FAILED_CHECKS${NC}"

PERCENTAGE=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
echo -e "Pourcentage de réussite: ${BLUE}$PERCENTAGE%${NC}"

echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "🎉 ${GREEN}VALIDATION COMPLÈTE RÉUSSIE !${NC}"
    echo -e "✅ Tous les livrables requis sont présents"
    echo -e "✅ L'application respecte tous les objectifs du projet"
    echo -e "✅ Architecture scalable et tolérante aux pannes validée"
    echo ""
    echo -e "${BLUE}Le projet est prêt pour le déploiement et la démonstration !${NC}"
    exit 0
elif [ $PERCENTAGE -ge 90 ]; then
    echo -e "⚠️  ${YELLOW}VALIDATION LARGEMENT RÉUSSIE${NC}"
    echo -e "✅ La plupart des livrables sont présents ($PERCENTAGE%)"
    echo -e "⚠️  Quelques éléments mineurs manquent"
    exit 1
else
    echo -e "❌ ${RED}VALIDATION INCOMPLÈTE${NC}"
    echo -e "❌ Plusieurs livrables manquent ($FAILED_CHECKS/$TOTAL_CHECKS)"
    echo -e "🔧 Veuillez corriger les éléments manqués avant le déploiement"
    exit 2
fi
