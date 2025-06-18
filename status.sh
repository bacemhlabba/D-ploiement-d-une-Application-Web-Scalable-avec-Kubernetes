#!/bin/bash
# Script de statut pour k8s-scalable-app

echo "📊 Rapport de Statut k8s-scalable-app"
echo "===================================="

# Vérifier le statut de Minikube
echo "🐳 Statut Minikube :"
minikube status
echo ""

# Vérifier si l'espace de noms existe
if kubectl get namespace scalable-app >/dev/null 2>&1; then
    echo "📦 Ressources Kubernetes dans l'espace de noms scalable-app :"
    kubectl get all -n scalable-app
    echo ""
    
    echo "📊 Détails des Ressources :"
    echo "Pods :"
    kubectl get pods -n scalable-app -o wide
    echo ""
    
    echo "Services :"
    kubectl get svc -n scalable-app -o wide
    echo ""
    
    echo "Statut HPA :"
    kubectl get hpa -n scalable-app
    echo ""
    
    # Vérifier la santé des pods
    echo "🏥 Vérification de Santé des Pods :"
    kubectl get pods -n scalable-app --field-selector=status.phase!=Running 2>/dev/null | tail -n +2 | wc -l | xargs -I {} echo "Pods non sains : {}"
    
    # Vérifier les processus de port-forwarding
    echo "🌐 Statut du Port-forwarding :"
    if pgrep -f "kubectl port-forward service/frontend" >/dev/null; then
        echo "   ✅ Port-forward frontend (8080) en cours d'exécution"
    else
        echo "   ❌ Port-forward frontend ne fonctionne pas"
    fi
    
    if pgrep -f "kubectl port-forward service/backend" >/dev/null; then
        echo "   ✅ Port-forward backend (3000) en cours d'exécution"
    else
        echo "   ❌ Port-forward backend ne fonctionne pas"
    fi
    
    echo ""
    echo "🌐 URLs d'Accès :"
    echo "   Frontend : http://localhost:8080"
    echo "   Backend : http://localhost:3000/api"
    echo "   Santé : http://localhost:3000/api/health"
    
else
    echo "❌ Espace de noms scalable-app introuvable. Exécutez ./deploy.sh d'abord."
fi

echo ""
echo "📋 Actions Rapides :"
echo "   Démarrer port-forwarding : kubectl port-forward service/frontend 8080:80 -n scalable-app &"
echo "   Arrêter tous les port-forwards : pkill -f 'kubectl port-forward'"
echo "   Mettre à l'échelle le backend : kubectl scale deployment backend --replicas=N -n scalable-app"
echo "   Voir les logs : kubectl logs -f deployment/backend -n scalable-app"
