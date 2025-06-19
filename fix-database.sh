#!/bin/bash
# Script de correction de la base de données pour k8s-scalable-app

echo "🔧 Correction du problème de base de données..."

# Appliquer la mise à jour du secret avec POSTGRES_DB
echo "📋 Mise à jour du secret de la base de données..."
kubectl apply -f k8s/secret-db.yaml

# Supprimer le StatefulSet de la base de données et le PVC pour force un redémarrage complet
echo "📋 Suppression de l'ancien déploiement de la base de données..."
kubectl delete statefulset db -n scalable-app --wait=false
kubectl delete pvc data-db-0 -n scalable-app --wait=false

# Attendre que tout soit supprimé
echo "⏳ Attente de la suppression des ressources..."
sleep 10
kubectl wait --for=delete pod/db-0 -n scalable-app --timeout=60s || true

# Réappliquer le StatefulSet
echo "📋 Redéploiement de la base de données avec la configuration mise à jour..."
kubectl apply -f k8s/statefulset-db.yaml

# Attendre que le pod de la base de données soit prêt
echo "⏳ Attente que la base de données soit prête..."
kubectl wait --for=condition=ready pod/db-0 -n scalable-app --timeout=120s

# Redémarrer les pods backend pour qu'ils se reconnectent à la nouvelle base de données
echo "📋 Redémarrage du backend pour se reconnecter à la base de données..."
kubectl rollout restart deployment backend -n scalable-app

# Attendre que le backend soit prêt
echo "⏳ Attente que le backend soit prêt..."
kubectl rollout status deployment/backend -n scalable-app

# Vérifier la connexion
echo "🔍 Vérification de la connexion à la base de données..."
echo "Attente de 10 secondes pour que tout se stabilise..."
sleep 10

# Obtenir le premier pod backend
BACKEND_POD=$(kubectl get pod -l app=backend -n scalable-app -o jsonpath='{.items[0].metadata.name}')

# Vérifier l'API
echo "Tentative de connexion au backend depuis l'intérieur du pod : $BACKEND_POD"
kubectl exec -it $BACKEND_POD -n scalable-app -- curl -s localhost:3000/api

echo ""
echo "✅ Correction terminée !"
echo "Vérifiez la sortie ci-dessus pour confirmer que la base de données est maintenant connectée."
echo "Vous devriez voir 'connected: true' au lieu de l'erreur précédente."
echo ""
echo "Si le problème persiste, essayez :"
echo "  kubectl exec -it db-0 -n scalable-app -- psql -U postgres -c \"CREATE DATABASE scalable_app;\""
