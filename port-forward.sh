#!/bin/bash
# Port-forwarding management script for k8s-scalable-app

echo "🌐 Managing port-forwarding for k8s-scalable-app..."

# Function to start port-forwarding
start_port_forwarding() {
    echo "Starting port-forwarding services..."
    
    # Kill existing port-forwards
    pkill -f "kubectl port-forward service/frontend" 2>/dev/null
    pkill -f "kubectl port-forward service/backend" 2>/dev/null
    
    # Wait a moment for processes to stop
    sleep 2
    
    # Start frontend port-forward
    echo "Starting frontend port-forward (8080:80)..."
    nohup kubectl port-forward service/frontend 8080:80 -n scalable-app > frontend-port-forward.log 2>&1 &
    FRONTEND_PF_PID=$!
    
    # Start backend port-forward
    echo "Starting backend port-forward (3000:3000)..."
    nohup kubectl port-forward service/backend 3000:3000 -n scalable-app > backend-port-forward.log 2>&1 &
    BACKEND_PF_PID=$!
    
    # Save PIDs for later reference
    echo $FRONTEND_PF_PID > .frontend-pf.pid
    echo $BACKEND_PF_PID > .backend-pf.pid
    
    echo "✅ Port-forwarding started successfully!"
    echo "   Frontend PID: $FRONTEND_PF_PID (logs: frontend-port-forward.log)"
    echo "   Backend PID: $BACKEND_PF_PID (logs: backend-port-forward.log)"
    echo ""
    echo "🌐 Access your app:"
    echo "   Frontend: http://localhost:8080"
    echo "   Backend:  http://localhost:3000/api"
}

# Function to stop port-forwarding
stop_port_forwarding() {
    echo "Stopping port-forwarding services..."
    pkill -f "kubectl port-forward service/frontend"
    pkill -f "kubectl port-forward service/backend"
    
    # Clean up PID files
    rm -f .frontend-pf.pid .backend-pf.pid
    
    echo "✅ Port-forwarding stopped!"
}

# Function to check status
check_status() {
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
    
    # Show log tail if available
    if [ -f frontend-port-forward.log ]; then
        echo ""
        echo "📋 Frontend logs (last 3 lines):"
        tail -n 3 frontend-port-forward.log
    fi
    
    if [ -f backend-port-forward.log ]; then
        echo ""
        echo "📋 Backend logs (last 3 lines):"
        tail -n 3 backend-port-forward.log
    fi
}

# Main script logic
case "${1:-start}" in
    start)
        start_port_forwarding
        ;;
    stop)
        stop_port_forwarding
        ;;
    restart)
        stop_port_forwarding
        sleep 2
        start_port_forwarding
        ;;
    status)
        check_status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        echo ""
        echo "Commands:"
        echo "  start   - Start port-forwarding (default)"
        echo "  stop    - Stop port-forwarding"
        echo "  restart - Restart port-forwarding"
        echo "  status  - Check port-forwarding status"
        exit 1
        ;;
esac
