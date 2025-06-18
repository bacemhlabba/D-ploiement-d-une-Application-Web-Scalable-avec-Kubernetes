#!/bin/bash
echo "Starting load test on backend service..."
echo "This will generate load to trigger the Horizontal Pod Autoscaler"

# Counter for requests
count=0

while true; do
    # Make concurrent requests to stress the backend
    for i in {1..10}; do
        curl -s http://localhost:3000/api > /dev/null &
    done
    
    count=$((count + 10))
    echo "Sent $count requests..."
    
    # Check every 100 requests
    if [ $((count % 100)) -eq 0 ]; then
        echo "--- HPA Status ---"
        kubectl get hpa -n scalable-app
        echo "--- Pod Status ---"
        kubectl get pods -n scalable-app | grep backend
        echo ""
    fi
    
    sleep 1
done
