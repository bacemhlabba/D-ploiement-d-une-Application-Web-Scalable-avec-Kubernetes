# Application Web Kubernetes Évolutive

Une application web full-stack prête pour la production démontrant la conteneurisation avec Docker et l'orchestration avec Kubernetes, avec mise à l'échelle automatique, stockage de données persistant et automatisation complète du déploiement.

## � Objectif du Projet

Déployer une application web composée de plusieurs services (frontend, backend, base de données) sur un cluster Kubernetes, en assurant la **scalabilité automatique**, la **tolérance aux pannes** et la **gestion du cycle de vie des conteneurs**.

## �🏗️ Architecture

- **Frontend**: Application React (servie par nginx, port 8080)
- **Backend**: Serveur API Node.js avec vérifications de santé (port 3000) 
- **Base de données**: PostgreSQL avec stockage persistant et StatefulSet
- **Orchestration**: Kubernetes avec HPA (Horizontal Pod Autoscaler)
- **Mise à l'échelle**: Auto-scaling basé sur l'utilisation CPU/mémoire

### Schéma d'Architecture Détaillé
Consultez [docs/02-architecture.md](docs/02-architecture.md) pour le diagramme complet et les spécifications techniques.

## 📦 Livrables du Projet

### ✅ Code Source
- **Frontend**: Application React complète dans `web-APP/` avec composants UI modernes
- **Backend**: API REST Node.js dans `web-APP/backend/` avec authentification et gestion des congés
- **Base de données**: Scripts d'initialisation PostgreSQL dans `database/init-scripts/`

### ✅ Dockerfiles
- **Frontend**: `web-APP/Dockerfile` avec nginx et configuration proxy
- **Backend**: `web-APP/backend/Dockerfile` optimisé pour production
- **docker-compose.yml**: Configuration complète pour développement local

### ✅ Fichiers YAML Kubernetes
- **namespace.yaml**: Isolation des ressources
- **deployment-frontend.yaml**: Déploiement frontend avec health checks
- **deployment-backend.yaml**: Déploiement backend avec connexion DB
- **statefulset-db.yaml**: Base de données PostgreSQL persistante
- **service-*.yaml**: Services pour exposition des pods
- **hpa-*.yaml**: Auto-scaling horizontal pour frontend et backend
- **secret-db.yaml**: Gestion sécurisée des identifiants
- **configmap-init-scripts.yaml**: Scripts d'initialisation DB
- **ingress.yaml**: Routage du trafic externe

### ✅ Documentation
- **README.md**: Guide de démarrage rapide et vue d'ensemble
- **docs/01-etapes-deploiement.md**: Instructions de déploiement détaillées
- **docs/02-architecture.md**: Diagramme d'architecture et spécifications
- **docs/TROUBLESHOOTING.md**: Guide de résolution des problèmes
- **DEPLOYMENT_SUMMARY.md**: Résumé des mises à jour et corrections
- **FINAL_STATUS.md**: État final et validation du déploiement

### ✅ Captures d'écran
- **docs/03-screenshots/step1-setup-minikube.png**: Configuration Minikube
- **docs/03-screenshots/step2-get-pods.png**: État des pods déployés

## 🚀 Démarrage Rapide

### Prérequis

- Docker installé et en cours d'exécution
- Minikube installé et configuré  
- kubectl installé et configuré

### Déploiement en Une Commande

```bash
./deploy.sh
```

Ce script automatisé va :
1. ✅ Vérifier les prérequis (Docker, Minikube, kubectl)
2. 🚀 Démarrer le cluster Minikube avec configuration optimisée
3. 🔨 Construire les images Docker avec gestion d'erreurs
4. 📦 Charger les images dans l'environnement Minikube
5. 🏗️ Déployer toutes les ressources Kubernetes avec validation
6. 🗄️ Initialiser la base de données PostgreSQL avec schéma complet
7. ⏳ Attendre que tous les pods soient sains et prêts
8. 🌐 Démarrer le port-forwarding persistant en arrière-plan
9. 🏥 Vérifier la santé de tous les services déployés

### Accédez à Votre Application

Après le déploiement, accédez à votre application à :

```bash
# Frontend (Application React avec intégration backend)
http://localhost:8080

# API Backend (avec connectivité base de données)
http://localhost:3000/api

# Vérification de Santé Backend
http://localhost:3000/api/health
```

## 📁 Structure du Projet

```
k8s-scalable-app/
├── deploy.sh              # Automatisation complète du déploiement
├── port-forward.sh         # Gestion du port-forwarding
├── status.sh              # Vérificateur de statut du déploiement  
├── stop.sh                # Script de nettoyage
├── load-test.sh           # Test de charge pour HPA
├── frontend/
│   ├── Dockerfile         # Construction React multi-étapes
│   ├── nginx.conf         # Configuration nginx personnalisée (port 8080)
│   └── src/               # Code source React
├── backend/
│   ├── Dockerfile         # Serveur API Node.js
│   └── src/
│       └── index.js       # Serveur Express avec connexion DB
├── database/
│   └── init-scripts/
│       └── init.sql       # Schéma de base de données
├── k8s/
│   ├── namespace.yaml     # Espace de noms isolé
│   ├── secret-db.yaml     # Identifiants de base de données
│   ├── statefulset-db.yaml# PostgreSQL avec stockage persistant
│   ├── deployment-*.yaml  # Déploiements d'applications
│   ├── service-*.yaml     # Définitions de services
│   ├── hpa-backend.yaml   # Horizontal Pod Autoscaler
│   └── ingress.yaml       # Configuration Ingress
└── docs/                  # Documentation supplémentaire
```

## 🎯 Commandes de Gestion

### Gestion du Déploiement
```bash
# Déploiement complet
./deploy.sh

# Vérifier le statut  
./status.sh

# Tout arrêter
./stop.sh
```

### Gestion du Port-Forwarding
```bash
# Démarrer le port-forwarding
./port-forward.sh start

# Vérifier le statut
./port-forward.sh status

# Redémarrer le port-forwarding
./port-forward.sh restart

# Arrêter le port-forwarding
./port-forward.sh stop
```

### Opérations de Mise à l'Échelle
```bash
# Mise à l'échelle manuelle
kubectl scale deployment backend --replicas=5 -n scalable-app
kubectl scale deployment frontend --replicas=3 -n scalable-app

# Déclencher l'auto-scaling avec test de charge
./load-test.sh

# Surveiller HPA
kubectl get hpa -n scalable-app -w
```

### Opérations de Base de Données
```bash
# Se connecter à la base de données
kubectl exec -it db-0 -n scalable-app -- psql -U postgres -d scalable_app

# Initialiser le schéma (si nécessaire)
kubectl exec -it db-0 -n scalable-app -- psql -U postgres -c "CREATE DATABASE scalable_app;"
```

## 🔍 Surveillance et Débogage

### Statut des Pods et Logs
```bash
# Voir toutes les ressources
kubectl get all -n scalable-app

# Voir les logs des pods
kubectl logs -f deployment/backend -n scalable-app
kubectl logs -f deployment/frontend -n scalable-app

# Décrire les pods problématiques
kubectl describe pod <nom-pod> -n scalable-app
```

### Vérifications de Santé
```bash
# Santé du backend
curl http://localhost:3000/api

# Accessibilité du frontend  
curl -I http://localhost:8080

# Connectivité base de données (via backend)
curl -s http://localhost:3000/api | jq '.database'
```

### Tests de Performance
```bash
# Générer de la charge pour l'auto-scaling
./load-test.sh

# Observer la mise à l'échelle en action
kubectl get hpa -n scalable-app -w
kubectl get pods -n scalable-app -w
```

## 🛠️ Fonctionnalités Techniques

### Optimisations Docker
- Constructions multi-étapes pour des tailles d'images minimales
- Mode réseau hôte pour la résolution DNS pendant les constructions
- Cache d'images local avec `imagePullPolicy: Never`
- Configuration de proxy nginx pour la communication frontend-backend
- Mappage de ports approprié (frontend: 8080, backend: 3000, base de données: 5432)

### Fonctionnalités Kubernetes
- Isolation des espaces de noms (`scalable-app`)
- StatefulSet pour la persistance de la base de données
- HPA pour la mise à l'échelle automatique (basée sur le CPU)
- Configuration prête pour le service mesh
- Limites et demandes de ressources
- Points de terminaison de vérification de santé

### Fonctionnalités de Développement
- Port-forwarding persistant avec nohup
- Surveillance complète du statut
- Tests de charge automatisés
- Déploiement et nettoyage en une commande
- Scripts de gestion et de récupération d'erreurs

## 🚨 Dépannage

### Problèmes Courants

**Le frontend affiche "Erreur de connexion au backend" :**
```bash
# Reconstruire l'application React et mettre à jour les conteneurs
cd frontend && npm run build
kubectl cp build/. nom-pod-frontend:/usr/share/nginx/html/ -n scalable-app
# Mettre à jour tous les pods frontend avec la nouvelle construction
```

**Le port-forwarding ne fonctionne pas :**
```bash
./port-forward.sh restart
```

**Les pods ne démarrent pas :**
```bash
kubectl describe pod <nom-pod> -n scalable-app
kubectl logs <nom-pod> -n scalable-app
```

**Problèmes de connexion à la base de données :**
```bash
kubectl exec -it db-0 -n scalable-app -- psql -U postgres -l
```

**Le proxy nginx ne fonctionne pas :**
```bash
# Vérifier la configuration nginx dans les pods frontend
kubectl exec deployment/frontend -n scalable-app -- cat /etc/nginx/conf.d/default.conf
# Mettre à jour manuellement la configuration nginx si nécessaire
kubectl exec deployment/frontend -n scalable-app -- nginx -s reload
```

**HPA ne met pas à l'échelle :**
```bash
# Vérifier le serveur de métriques
kubectl get pods -n kube-system | grep metrics-server
# Générer plus de charge
./load-test.sh
```

### Tout Réinitialiser
```bash
./stop.sh  # Choisir de supprimer toutes les ressources
minikube delete
minikube start --driver=docker
./deploy.sh
```

## 📈 Considérations de Production

Cette configuration démontre des modèles clés de production :

- **Haute Disponibilité** : Plusieurs répliques avec auto-scaling
- **Stockage Persistant** : StatefulSet avec volumes persistants
- **Surveillance de Santé** : Sondes de vivacité et de préparation
- **Gestion des Ressources** : Limites et demandes CPU/mémoire
- **Sécurité** : Isolation des espaces de noms et gestion des secrets
- **Observabilité** : Configuration complète de logs et de surveillance

## 🤝 Contribution

N'hésitez pas à soumettre des issues et des demandes d'amélioration !

## 📄 Licence

Ce projet est sous licence MIT.
