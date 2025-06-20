# Architecture du Système Kubernetes Évolutif

## Vue d'ensemble

Cette application web full-stack déployée sur Kubernetes présente une architecture moderne avec auto-scaling, tolérance aux pannes et gestion complète du cycle de vie des conteneurs.

## Diagramme d'Architecture

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                              CLUSTER KUBERNETES                                │
├────────────────────────────────────────────────────────────────────────────────┤
│  Namespace: scalable-app                                                       │
│                                                                                │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐ │
│  │     FRONTEND        │    │      BACKEND        │    │     DATABASE        │ │
│  │                     │    │                     │    │                     │ │
│  │  ┌───────────────┐  │    │  ┌───────────────┐  │    │  ┌───────────────┐  │ │
│  │  │ React App     │  │    │  │ Node.js API   │  │    │  │ PostgreSQL 15 │  │ │
│  │  │ + nginx       │  │    │  │ + Express     │  │    │  │               │  │ │
│  │  │ Port: 8080    │  │    │  │ Port: 3000    │  │    │  │ Port: 5432    │  │ │
│  │  └───────────────┘  │    │  └───────────────┘  │    │  └───────────────┘  │ │
│  │                     │    │                     │    │                     │ │
│  │  Deployment         │    │  Deployment         │    │  StatefulSet        │ │
│  │  - 2-8 replicas     │    │  - 2-10 replicas    │    │  - 1 replica        │ │
│  │  - Rolling Updates  │    │  - Rolling Updates  │    │  - Persistent Vol   │ │
│  │  - Health Checks    │    │  - Health Checks    │    │  - Health Checks    │ │
│  │  - Resource Limits  │    │  - Resource Limits  │    │  - Resource Limits  │ │
│  └─────────────────────┘    └─────────────────────┘    └─────────────────────┘ │
│           │                           │                           │            │
│           ▼                           ▼                           ▼            │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐ │
│  │   Service           │    │   Service           │    │   Service           │ │
│  │   frontend:8080     │    │   backend:3000      │    │   db:5432           │ │
│  └─────────────────────┘    └─────────────────────┘    └─────────────────────┘ │
│           │                           │                           │            │
│           ▼                           ▼                           ▼            │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐ │
│  │   HPA Frontend      │    │   HPA Backend       │    │   ConfigMap         │ │
│  │   CPU: 60%          │    │   CPU: 50%          │    │   Init Scripts      │ │
│  │   Memory: 70%       │    │   Memory: 60%       │    │                     │ │
│  └─────────────────────┘    └─────────────────────┘    └─────────────────────┘ │
│                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           INGRESS CONTROLLER                            │   │
│  │  Route: /     → Frontend Service                                        │   │
│  │  Route: /api  → Backend Service                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                             SECRETS                                     │   │
│  │  - Database Credentials (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB) │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────┘

                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ACCÈS UTILISATEUR                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Port-Forwarding Local:                                                         │
│  • http://localhost:8080  → Frontend (Application React)                        │
│  • http://localhost:3000  → Backend API (Points de terminaison REST)            │
│  • http://localhost:3000/api/health → Vérification de santé                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Composants Clés

### 1. Frontend (React + nginx)
- **Technologie**: Application React servie par nginx
- **Replicas**: 2-8 (auto-scaling basé sur CPU/mémoire)
- **Port**: 8080
- **Fonctionnalités**:
  - Configuration proxy pour communication avec le backend
  - Health checks (readiness/liveness)
  - Rolling updates
  - Resource limits configurés

### 2. Backend (Node.js + Express)
- **Technologie**: API REST Node.js avec Express
- **Replicas**: 2-10 (auto-scaling basé sur CPU/mémoire)
- **Port**: 3000
- **Fonctionnalités**:
  - Points de terminaison API REST
  - Connexion sécurisée à la base de données
  - Health checks (/api/health)
  - Rolling updates
  - Resource limits configurés

### 3. Base de Données (PostgreSQL)
- **Technologie**: PostgreSQL 15
- **Type**: StatefulSet avec stockage persistant
- **Port**: 5432
- **Fonctionnalités**:
  - Stockage persistant (1Gi)
  - Scripts d'initialisation automatique
  - Health checks
  - Secrets pour les identifiants

## Fonctionnalités de Scalabilité

### Horizontal Pod Autoscaler (HPA)
- **Frontend HPA**:
  - Min: 2 replicas, Max: 8 replicas
  - Seuils: CPU 60%, Mémoire 70%
  
- **Backend HPA**:
  - Min: 2 replicas, Max: 10 replicas
  - Seuils: CPU 50%, Mémoire 60%

### Rolling Updates
- Stratégie de déploiement sans interruption
- maxUnavailable: 1, maxSurge: 1
- Garantit la disponibilité continue du service

## Tolérance aux Pannes

### Health Checks
- **Readiness Probes**: Vérifient si les pods sont prêts à recevoir du trafic
- **Liveness Probes**: Redémarrent automatiquement les pods défaillants
- **Timeouts et seuils**: Configurés pour une détection rapide des pannes

### Resource Limits
- Limits CPU/mémoire pour éviter les sur-consommations
- Requests configurées pour garantir les ressources minimales

### Persistence
- StatefulSet pour la base de données
- PersistentVolumeClaim pour le stockage des données
- ConfigMap pour les scripts d'initialisation

## Gestion du Cycle de Vie

### Initialisation
1. Démarrage du cluster Minikube
2. Construction et chargement des images Docker
3. Déploiement des ressources Kubernetes
4. Initialisation automatique de la base de données
5. Vérification de la santé des services

### Monitoring
- Script de statut (`status.sh`) pour surveillance
- Logs centralisés des port-forwards
- Métriques HPA pour l'auto-scaling

### Maintenance
- Script d'arrêt propre (`stop.sh`)
- Nettoyage automatique des ressources
- Tests de charge (`load-test.sh`) pour validation

## Technologies Utilisées

- **Orchestration**: Kubernetes (via Minikube)
- **Conteneurisation**: Docker
- **Frontend**: React, nginx
- **Backend**: Node.js, Express
- **Base de données**: PostgreSQL 15
- **Monitoring**: kubectl, HPA metrics
- **CI/CD**: Scripts automatisés (deploy.sh, stop.sh, status.sh)
