#!/bin/bash
# Status script for k8s-scalable-app

echo "📊 k8s-scalable-app Status Report"
echo "================================="

# Check Minikube status
echo "🐳 Minikube Status:"
minikube status
echo ""

# Check if namespace exists
if kubectl get namespace scalable-app >/dev/null 2>&1; then
    echo "📦 Kubernetes Resources in scalable-app namespace:"
    kubectl get all -n scalable-app
    echo ""
    
    echo "📊 Resource Details:"
    echo "Pods:"
    kubectl get pods -n scalable-app -o wide
    echo ""
    
    echo "Services:"
    kubectl get svc -n scalable-app -o wide
    echo ""
    
    echo "HPA Status:"
    kubectl get hpa -n scalable-app
    echo ""
    
    # Check pod health
    echo "🏥 Pod Health Check:"
    kubectl get pods -n scalable-app --field-selector=status.phase!=Running 2>/dev/null | tail -n +2 | wc -l | xargs -I {} echo "Unhealthy pods: {}"
    
    # Check port-forwarding processes
    echo "🌐 Port-forwarding Status:"
    if pgrep -f "kubectl port-forward service/frontend" >/dev/null; then
        echo "   ✅ Frontend port-forward (8080) is running"
    else
        echo "   ❌ Frontend port-forward is not running"
    fi
    
    if pgrep -f "kubectl port-forward service/backend" >/dev/null; then
        echo "   ✅ Backend port-forward (3000) is running"
    else
        echo "   ❌ Backend port-forward is not running"
    fi
    
    echo ""
    echo "🌐 Access URLs:"
    echo "   Frontend: http://localhost:8080"
    echo "   Backend:  http://localhost:3000/api"
    echo "   Health:   http://localhost:3000/api/health"
    
else
    echo "❌ scalable-app namespace not found. Run ./deploy.sh first."
fi

echo ""
echo "📋 Quick Actions:"
echo "   Start port-forwarding: kubectl port-forward service/frontend 8080:80 -n scalable-app &"
echo "   Stop all port-forwards: pkill -f 'kubectl port-forward'"
echo "   Scale backend: kubectl scale deployment backend --replicas=N -n scalable-app"
echo "   View logs: kubectl logs -f deployment/backend -n scalable-app"
