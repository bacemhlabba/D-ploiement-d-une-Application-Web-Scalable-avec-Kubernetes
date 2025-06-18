#!/bin/bash
echo "Démarrage du test de charge sur le service backend..."
echo "Cela va générer de la charge pour déclencher le Horizontal Pod Autoscaler"

# Compteur pour les requêtes
count=0

while true; do
    # Faire des requêtes simultanées pour stresser le backend
    for i in {1..10}; do
        curl -s http://localhost:3000/api > /dev/null &
    done
    
    count=$((count + 10))
    echo "Envoyé $count requêtes..."
    
    # Vérifier toutes les 100 requêtes
    if [ $((count % 100)) -eq 0 ]; then
        echo "--- Statut HPA ---"
        kubectl get hpa -n scalable-app
        echo "--- Statut des Pods ---"
        kubectl get pods -n scalable-app | grep backend
        echo ""
    fi
    
    sleep 1
done
