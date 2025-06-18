#!/bin/bash
# Complete deployment script for k8s-scalable-app

echo "🚀 Starting complete deployment of k8s-scalable-app..."

# Step 1: Ensure Minikube is running
echo "📋 Step 1: Starting Minikube..."
minikube start --driver=docker

# Step 2: Build Docker images
echo "📋 Step 2: Building Docker images..."
echo "Building backend image..."
DOCKER_BUILDKIT=1 docker build --network=host -t backend:latest backend/

echo "Building frontend image..."
DOCKER_BUILDKIT=1 docker build --network=host -t frontend:latest frontend/

# Step 3: Load images into Minikube
echo "📋 Step 3: Loading images into Minikube..."
minikube image load backend:latest
minikube image load frontend:latest
minikube image load postgres:15

# Step 4: Apply Kubernetes manifests
echo "📋 Step 4: Applying Kubernetes manifests..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/

# Step 5: Wait for pods to be ready
echo "📋 Step 5: Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod --all -n scalable-app --timeout=300s

# Step 6: Verify deployment
echo "📋 Step 6: Verifying deployment..."
kubectl get pods,svc,hpa -n scalable-app

echo "✅ Deployment complete!"
echo ""
echo "🌐 Starting port-forwarding services..."

# Start port-forwarding in background with nohup
echo "Starting frontend port-forward (8080:80)..."
nohup kubectl port-forward service/frontend 8080:80 -n scalable-app > frontend-port-forward.log 2>&1 &
FRONTEND_PF_PID=$!

echo "Starting backend port-forward (3000:3000)..."
nohup kubectl port-forward service/backend 3000:3000 -n scalable-app > backend-port-forward.log 2>&1 &
BACKEND_PF_PID=$!

echo "Port-forwarding started successfully!"
echo "   Frontend PID: $FRONTEND_PF_PID (logs: frontend-port-forward.log)"
echo "   Backend PID: $BACKEND_PF_PID (logs: backend-port-forward.log)"
echo ""
echo "🌐 Access your app:"
echo "   Frontend: http://localhost:8080"
echo "   Backend:  http://localhost:3000/api"
echo ""
echo "📋 To stop port-forwarding:"
echo "   kill $FRONTEND_PF_PID $BACKEND_PF_PID"
echo "   or use: pkill -f 'kubectl port-forward'"
