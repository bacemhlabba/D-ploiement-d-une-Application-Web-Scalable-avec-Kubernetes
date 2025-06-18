#!/bin/bash
# Script de déploiement complet pour k8s-scalable-app

echo "🚀 Démarrage du déploiement complet de k8s-scalable-app..."

# Étape 1 : S'assurer que Minikube fonctionne
echo "📋 Étape 1 : Démarrage de Minikube..."
minikube start --driver=docker

# Étape 2 : Construire les images Docker
echo "📋 Étape 2 : Construction des images Docker..."
echo "Construction de l'image backend..."
DOCKER_BUILDKIT=1 docker build --network=host -t backend:latest backend/

echo "Construction de l'image frontend..."
DOCKER_BUILDKIT=1 docker build --network=host -t frontend:latest frontend/

# Étape 3 : Charger les images dans Minikube
echo "📋 Étape 3 : Chargement des images dans Minikube..."
minikube image load backend:latest
minikube image load frontend:latest
minikube image load postgres:15

# Étape 4 : Appliquer les manifests Kubernetes
echo "📋 Étape 4 : Application des manifests Kubernetes..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/

# Étape 5 : Attendre que les pods soient prêts
echo "📋 Étape 5 : Attente que les pods soient prêts..."
kubectl wait --for=condition=ready pod --all -n scalable-app --timeout=300s

# Étape 6 : Vérifier le déploiement
echo "📋 Étape 6 : Vérification du déploiement..."
kubectl get pods,svc,hpa -n scalable-app

echo "✅ Déploiement terminé !"
echo ""
echo "🌐 Démarrage des services de port-forwarding..."

# Démarrer le port-forwarding en arrière-plan avec nohup
echo "Démarrage du port-forward frontend (8080:80)..."
nohup kubectl port-forward service/frontend 8080:80 -n scalable-app > frontend-port-forward.log 2>&1 &
FRONTEND_PF_PID=$!

echo "Démarrage du port-forward backend (3000:3000)..."
nohup kubectl port-forward service/backend 3000:3000 -n scalable-app > backend-port-forward.log 2>&1 &
BACKEND_PF_PID=$!

echo "Port-forwarding démarré avec succès !"
echo "   PID Frontend : $FRONTEND_PF_PID (logs : frontend-port-forward.log)"
echo "   PID Backend : $BACKEND_PF_PID (logs : backend-port-forward.log)"
echo ""
echo "🌐 Accédez à votre application :"
echo "   Frontend : http://localhost:8080"
echo "   Backend : http://localhost:3000/api"
echo ""
echo "📋 Pour arrêter le port-forwarding :"
echo "   kill $FRONTEND_PF_PID $BACKEND_PF_PID"
echo "   ou utilisez : pkill -f 'kubectl port-forward'"
