#!/bin/bash
# Script de déploiement complet pour k8s-scalable-app

set -e  # Exit on any error

echo "🚀 Démarrage du déploiement complet de k8s-scalable-app..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for pods to be ready with better feedback
wait_for_pods() {
    echo "⏳ Attente que tous les pods soient prêts..."
    local timeout=300
    local elapsed=0
    
    while ! kubectl wait --for=condition=ready pod --all -n scalable-app --timeout=30s >/dev/null 2>&1; do
        elapsed=$((elapsed + 30))
        if [ $elapsed -ge $timeout ]; then
            echo "❌ Timeout: Les pods ne sont pas prêts après $timeout secondes"
            echo "📊 Statut actuel des pods:"
            kubectl get pods -n scalable-app
            exit 1
        fi
        echo "⏳ En attente... ($elapsed/$timeout secondes)"
    done
    echo "✅ Tous les pods sont prêts!"
}

# Prérequis
echo "📋 Vérification des prérequis..."
for cmd in docker minikube kubectl; do
    if ! command_exists "$cmd"; then
        echo "❌ Erreur: $cmd n'est pas installé ou n'est pas dans le PATH"
        exit 1
    fi
done
echo "✅ Tous les prérequis sont satisfaits"

# Étape 1 : S'assurer que Minikube fonctionne
echo "📋 Étape 1 : Démarrage de Minikube..."
if ! minikube status >/dev/null 2>&1; then
    echo "🔄 Démarrage de Minikube..."
    minikube start --driver=docker --cpus=2 --memory=4096
else
    echo "✅ Minikube est déjà en cours d'exécution"
fi

# Vérifier que kubectl peut communiquer avec le cluster
echo "🔍 Vérification de la connectivité kubectl..."
if ! kubectl cluster-info >/dev/null 2>&1; then
    echo "❌ Impossible de se connecter au cluster Kubernetes"
    exit 1
fi

# Étape 2 : Construire les images Docker
echo "📋 Étape 2 : Construction des images Docker..."

echo "🔨 Construction de l'image backend..."
if ! DOCKER_BUILDKIT=1 docker build --network=host -t backend:latest web-APP/backend/; then
    echo "❌ Échec de la construction de l'image backend"
    exit 1
fi

echo "🔨 Construction de l'image frontend..."
if ! DOCKER_BUILDKIT=1 docker build --no-cache --network=host -f web-APP/Dockerfile -t frontend:latest .; then
    echo "❌ Échec de la construction de l'image frontend"
    exit 1
fi

# Étape 3 : Charger les images dans Minikube
echo "📋 Étape 3 : Chargement des images dans Minikube..."
echo "📦 Chargement de l'image backend..."
minikube image load backend:latest

echo "📦 Chargement de l'image frontend..."
minikube image load frontend:latest

echo "📦 Chargement de l'image postgres..."
minikube image load postgres:15

# Étape 4 : Appliquer les manifests Kubernetes
echo "📋 Étape 4 : Application des manifests Kubernetes..."

# Créer l'espace de noms d'abord
echo "🏗️  Création de l'espace de noms..."
kubectl apply -f k8s/namespace.yaml

# Attendre que l'espace de noms soit créé
sleep 2

# Appliquer les autres manifests
echo "🏗️  Application des autres ressources..."
kubectl apply -f k8s/

# Étape 5 : Attendre que les pods soient prêts
echo "📋 Étape 5 : Attente que les pods soient prêts..."
wait_for_pods

# Étape 6 : Vérifier le déploiement
echo "📋 Étape 6 : Vérification du déploiement..."
kubectl get pods,svc,hpa -n scalable-app

echo "✅ Déploiement terminé !"
echo ""

# Vérifier la santé des services
echo "🏥 Vérification de la santé des services..."
backend_ready=$(kubectl get pods -n scalable-app -l app=backend -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | grep -o True | wc -l)
frontend_ready=$(kubectl get pods -n scalable-app -l app=frontend -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | grep -o True | wc -l)
db_ready=$(kubectl get pods -n scalable-app -l app=db -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | grep -o True | wc -l)

echo "📊 Résumé de santé:"
echo "   Backend: $backend_ready pods prêts"
echo "   Frontend: $frontend_ready pods prêts"
echo "   Database: $db_ready pods prêts"

echo ""
echo "🌐 Démarrage des services de port-forwarding..."

# Arrêter tout port-forwarding existant
pkill -f "kubectl port-forward" 2>/dev/null || true

# Attendre un peu pour que les anciens processus se terminent
sleep 2

# Démarrer le port-forwarding en arrière-plan avec nohup
echo "🔄 Démarrage du port-forward frontend (8080:8080)..."
nohup kubectl port-forward service/frontend 8080:8080 -n scalable-app > frontend-port-forward.log 2>&1 &
FRONTEND_PF_PID=$!

echo "🔄 Démarrage du port-forward backend (3000:3000)..."
nohup kubectl port-forward service/backend 3000:3000 -n scalable-app > backend-port-forward.log 2>&1 &
BACKEND_PF_PID=$!

# Attendre que les port-forwards soient établis
sleep 3

echo "✅ Port-forwarding démarré avec succès !"
echo "   📝 PID Frontend : $FRONTEND_PF_PID (logs : frontend-port-forward.log)"
echo "   📝 PID Backend : $BACKEND_PF_PID (logs : backend-port-forward.log)"
echo ""
echo "🌐 Accédez à votre application :"
echo "   🖥️  Frontend : http://localhost:8080"
echo "   🔗 Backend API : http://localhost:3000/api"
echo "   🏥 Health Check : http://localhost:3000/api/health"
echo ""
echo "📋 Commandes utiles :"
echo "   📊 Vérifier le statut : ./status.sh"
echo "   🛑 Arrêter l'application : ./stop.sh"
echo "   📈 Test de charge : ./load-test.sh"
echo "   🔧 Port-forwarding manuel :"
echo "      kill $FRONTEND_PF_PID $BACKEND_PF_PID"
echo "      ou utilisez : pkill -f 'kubectl port-forward'"
echo ""
echo "🎉 Déploiement complet terminé avec succès !"
