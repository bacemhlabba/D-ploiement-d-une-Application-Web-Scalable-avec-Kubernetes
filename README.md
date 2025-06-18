# Kubernetes Scalable Web Application

A production-ready full-stack web application demonstrating containerization with Docker and orchestration with Kubernetes, featuring auto-scaling, persistent data storage, and comprehensive deployment automation.

## 🏗️ Architecture

- **Frontend**: React application (nginx-served, port 8080)
- **Backend**: Node.js API server with health checks (port 3000) 
- **Database**: PostgreSQL with persistent storage and StatefulSet
- **Orchestration**: Kubernetes with HPA (Horizontal Pod Autoscaler)
- **Scaling**: Auto-scaling based on CPU utilization (50% threshold, 2-10 replicas)

## 🚀 Quick Start

### Prerequisites

- Docker installed and running
- Minikube installed and configured  
- kubectl installed and configured

### One-Command Deployment

```bash
./deploy.sh
```

This script will:
1. Start Minikube cluster
2. Build Docker images with optimized network configuration
3. Load images into Minikube environment
4. Deploy all Kubernetes resources with proper namespace isolation
5. Initialize PostgreSQL database with schema
6. Start persistent port-forwarding in background with nohup
7. Verify all pods are healthy and ready
8. Configure nginx proxy for frontend-backend communication

### Access Your Application

After deployment, access your application at:

```bash
# Frontend (React app with backend integration)
http://localhost:8080

# Backend API (with database connectivity)
http://localhost:3000/api

# Backend Health Check
http://localhost:3000/api/health
```

## 📁 Project Structure

```
k8s-scalable-app/
├── deploy.sh              # Complete deployment automation
├── port-forward.sh         # Port-forwarding management
├── status.sh              # Deployment status checker  
├── stop.sh                # Cleanup script
├── load-test.sh           # Load testing for HPA
├── frontend/
│   ├── Dockerfile         # Multi-stage React build
│   ├── nginx.conf         # Custom nginx config (port 8080)
│   └── src/               # React source code
├── backend/
│   ├── Dockerfile         # Node.js API server
│   └── src/
│       └── index.js       # Express server with DB connection
├── database/
│   └── init-scripts/
│       └── init.sql       # Database schema
├── k8s/
│   ├── namespace.yaml     # Isolated namespace
│   ├── secret-db.yaml     # Database credentials
│   ├── statefulset-db.yaml# PostgreSQL with persistent storage
│   ├── deployment-*.yaml  # App deployments
│   ├── service-*.yaml     # Service definitions
│   ├── hpa-backend.yaml   # Horizontal Pod Autoscaler
│   └── ingress.yaml       # Ingress configuration
└── docs/                  # Additional documentation
```

## 🎯 Management Commands

### Deployment Management
```bash
# Full deployment
./deploy.sh

# Check status  
./status.sh

# Stop everything
./stop.sh
```

### Port-Forwarding Management
```bash
# Start port-forwarding
./port-forward.sh start

# Check status
./port-forward.sh status

# Restart port-forwarding
./port-forward.sh restart

# Stop port-forwarding
./port-forward.sh stop
```

### Scaling Operations
```bash
# Manual scaling
kubectl scale deployment backend --replicas=5 -n scalable-app
kubectl scale deployment frontend --replicas=3 -n scalable-app

# Trigger auto-scaling with load test
./load-test.sh

# Monitor HPA
kubectl get hpa -n scalable-app -w
```

### Database Operations
```bash
# Connect to database
kubectl exec -it db-0 -n scalable-app -- psql -U postgres -d scalable_app

# Initialize schema (if needed)
kubectl exec -it db-0 -n scalable-app -- psql -U postgres -c "CREATE DATABASE scalable_app;"
```

## 🔍 Monitoring & Debugging

### Pod Status and Logs
```bash
# View all resources
kubectl get all -n scalable-app

# View pod logs
kubectl logs -f deployment/backend -n scalable-app
kubectl logs -f deployment/frontend -n scalable-app

# Describe problematic pods
kubectl describe pod <pod-name> -n scalable-app
```

### Health Checks
```bash
# Backend health
curl http://localhost:3000/api

# Frontend accessibility  
curl -I http://localhost:8080

# Database connectivity (via backend)
curl -s http://localhost:3000/api | jq '.database'
```

### Performance Testing
```bash
# Generate load for auto-scaling
./load-test.sh

# Watch scaling in action
kubectl get hpa -n scalable-app -w
kubectl get pods -n scalable-app -w
```

## 🛠️ Technical Features

### Docker Optimizations
- Multi-stage builds for minimal image sizes
- Host network mode for DNS resolution during builds
- Local image caching with `imagePullPolicy: Never`
- Nginx proxy configuration for frontend-backend communication
- Proper port mapping (frontend: 8080, backend: 3000, database: 5432)

### Kubernetes Features
- Namespace isolation (`scalable-app`)
- StatefulSet for database persistence
- HPA for automatic scaling (CPU-based)
- Service mesh ready configuration
- Resource limits and requests
- Health check endpoints

### Development Features
- Persistent port-forwarding with nohup
- Comprehensive status monitoring
- Automated load testing
- One-command deployment and cleanup
- Error handling and recovery scripts

## 🚨 Troubleshooting

### Common Issues

**Frontend shows "Error connecting to backend":**
```bash
# Rebuild React app and update containers
cd frontend && npm run build
kubectl cp build/. frontend-pod-name:/usr/share/nginx/html/ -n scalable-app
# Update all frontend pods with the new build
```

**Port-forwarding not working:**
```bash
./port-forward.sh restart
```

**Pods not starting:**
```bash
kubectl describe pod <pod-name> -n scalable-app
kubectl logs <pod-name> -n scalable-app
```

**Database connection issues:**
```bash
kubectl exec -it db-0 -n scalable-app -- psql -U postgres -l
```

**Nginx proxy not working:**
```bash
# Check nginx configuration in frontend pods
kubectl exec deployment/frontend -n scalable-app -- cat /etc/nginx/conf.d/default.conf
# Manually update nginx config if needed
kubectl exec deployment/frontend -n scalable-app -- nginx -s reload
```

**HPA not scaling:**
```bash
# Check metrics server
kubectl get pods -n kube-system | grep metrics-server
# Generate more load
./load-test.sh
```

### Reset Everything
```bash
./stop.sh  # Choose to delete all resources
minikube delete
minikube start --driver=docker
./deploy.sh
```

## 📈 Production Considerations

This setup demonstrates key production patterns:

- **High Availability**: Multiple replicas with auto-scaling
- **Persistent Storage**: StatefulSet with persistent volumes
- **Health Monitoring**: Liveness and readiness probes
- **Resource Management**: CPU/memory limits and requests
- **Security**: Namespace isolation and secret management
- **Observability**: Comprehensive logging and monitoring setup

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is licensed under the MIT License.
