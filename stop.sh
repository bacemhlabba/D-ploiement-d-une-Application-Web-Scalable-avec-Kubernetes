#!/bin/bash
# Script d'arrêt pour k8s-scalable-app

echo "🛑 Arrêt du déploiement k8s-scalable-app..."

# Arrêter tous les processus de port-forwarding
echo "📋 Arrêt des processus de port-forwarding..."
pkill -f "kubectl port-forward service/frontend"
pkill -f "kubectl port-forward service/backend"

# Nettoyer les fichiers de logs
echo "📋 Nettoyage des fichiers de logs..."
rm -f frontend-port-forward.log backend-port-forward.log

# Option pour supprimer les ressources Kubernetes
read -p "Voulez-vous supprimer toutes les ressources Kubernetes ? (y/N) : " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📋 Suppression des ressources Kubernetes..."
    kubectl delete namespace scalable-app
fi

# Option pour arrêter Minikube
read -p "Voulez-vous arrêter Minikube ? (y/N) : " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📋 Arrêt de Minikube..."
    minikube stop
fi

echo "✅ Nettoyage terminé !"
