#!/bin/bash
# Stop script for k8s-scalable-app

echo "🛑 Stopping k8s-scalable-app deployment..."

# Stop all port-forwarding processes
echo "📋 Stopping port-forwarding processes..."
pkill -f "kubectl port-forward service/frontend"
pkill -f "kubectl port-forward service/backend"

# Clean up log files
echo "📋 Cleaning up log files..."
rm -f frontend-port-forward.log backend-port-forward.log

# Option to delete Kubernetes resources
read -p "Do you want to delete all Kubernetes resources? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📋 Deleting Kubernetes resources..."
    kubectl delete namespace scalable-app
fi

# Option to stop Minikube
read -p "Do you want to stop Minikube? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📋 Stopping Minikube..."
    minikube stop
fi

echo "✅ Cleanup complete!"
