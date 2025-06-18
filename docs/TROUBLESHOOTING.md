# Troubleshooting Guide

## Common Issues and Solutions

### 1. Frontend Shows "Error connecting to backend"

**Symptoms:**
- React app loads but displays: `{"message": "Error connecting to backend", "error": "Network Error"}`
- API calls from browser fail

**Root Causes:**
- React app build is outdated and using old API configuration
- Nginx proxy configuration missing or incorrect
- Port configuration mismatch between service and container

**Solution:**
```bash
# Step 1: Rebuild React app with current source code
cd frontend
npm run build

# Step 2: Update all frontend pods with new build
kubectl get pods -n scalable-app -l app=frontend
# Copy to each pod (replace pod-name with actual pod names)
kubectl cp build/. <frontend-pod-name>:/usr/share/nginx/html/ -n scalable-app

# Step 3: Verify nginx configuration includes /api proxy
kubectl exec deployment/frontend -n scalable-app -- cat /etc/nginx/conf.d/default.conf

# Step 4: If proxy missing, update nginx config
kubectl exec deployment/frontend -n scalable-app -- sh -c 'cat > /etc/nginx/conf.d/default.conf << EOF
server {
    listen 8080;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend.scalable-app.svc.cluster.local:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF'

# Step 5: Reload nginx configuration
kubectl exec deployment/frontend -n scalable-app -- nginx -s reload
```

### 2. Port Configuration Issues

**Symptoms:**
- 301 Redirects when accessing frontend
- Service connection timeouts

**Solution:**
Ensure port consistency across all configurations:

```yaml
# frontend/Dockerfile
EXPOSE 8080

# k8s/deployment-frontend.yaml
ports:
- containerPort: 8080

# k8s/service-frontend.yaml
ports:
  - port: 80
    targetPort: 8080

# frontend/nginx.conf
server {
    listen 8080;
    # ...
}
```

### 3. Port-Forwarding Issues

**Symptoms:**
- Cannot access services on localhost
- Connection refused errors

**Solution:**
```bash
# Check current port-forwards
ps aux | grep "kubectl port-forward"

# Restart port-forwarding
./port-forward.sh restart

# Or manually start
pkill -f "kubectl port-forward"
kubectl port-forward service/frontend 8080:80 -n scalable-app &
kubectl port-forward service/backend 3000:3000 -n scalable-app &
```

### 4. Image Update Issues

**Symptoms:**
- Changes to source code not reflected in running pods
- Old configuration persisting

**Solution:**
```bash
# Rebuild and reload images
docker build -t frontend:latest frontend/
docker build -t backend:latest backend/
minikube image load frontend:latest
minikube image load backend:latest

# Force pod restart to pick up new images
kubectl rollout restart deployment/frontend -n scalable-app
kubectl rollout restart deployment/backend -n scalable-app

# Wait for rollout to complete
kubectl rollout status deployment/frontend -n scalable-app
kubectl rollout status deployment/backend -n scalable-app
```

### 5. Database Connection Issues

**Symptoms:**
- Backend API returns database connection errors
- Database pods not ready

**Solution:**
```bash
# Check database pod status
kubectl get pods -n scalable-app -l app=db

# Check database logs
kubectl logs db-0 -n scalable-app

# Connect to database directly
kubectl exec -it db-0 -n scalable-app -- psql -U postgres

# Verify database exists
kubectl exec -it db-0 -n scalable-app -- psql -U postgres -l
```

### 6. Service Discovery Issues

**Symptoms:**
- Services cannot reach each other
- DNS resolution failures

**Solution:**
```bash
# Test service discovery from within pods
kubectl exec deployment/frontend -n scalable-app -- nslookup backend.scalable-app.svc.cluster.local
kubectl exec deployment/backend -n scalable-app -- nslookup db.scalable-app.svc.cluster.local

# Check service endpoints
kubectl get endpoints -n scalable-app

# Verify service selectors match pod labels
kubectl get svc frontend -n scalable-app -o yaml
kubectl get pods -n scalable-app -l app=frontend --show-labels
```

## Verification Commands

### Quick Health Check
```bash
# All-in-one status check
./status.sh

# Manual verification
kubectl get all -n scalable-app
curl -I http://localhost:8080/
curl -s http://localhost:8080/api | jq '.'
curl -s http://localhost:3000/api | jq '.'
```

### Detailed Debugging
```bash
# Pod logs
kubectl logs -f deployment/frontend -n scalable-app
kubectl logs -f deployment/backend -n scalable-app
kubectl logs -f db-0 -n scalable-app

# Describe problematic resources
kubectl describe pod <pod-name> -n scalable-app
kubectl describe svc <service-name> -n scalable-app

# Network testing
kubectl exec deployment/frontend -n scalable-app -- curl -s http://backend:3000/api
kubectl exec deployment/backend -n scalable-app -- curl -s http://db:5432
```

## Configuration Files Reference

### Correct nginx.conf
```nginx
server {
    listen 8080;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend.scalable-app.svc.cluster.local:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

### React App API Configuration
```javascript
// frontend/src/App.js
const response = await axios.get('/api'); // Use relative path for nginx proxy
```

## Emergency Reset

If all else fails, complete reset:
```bash
# Stop everything
./stop.sh
# Answer 'y' to delete all resources and stop minikube

# Start fresh
minikube start --driver=docker
./deploy.sh
```
