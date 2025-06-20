# Étapes de déploiement

1. **Installer et démarrer Minikube**  
   ```bash
   minikube start --driver=docker
   ```

2. **Builder et charger les images Docker**  
   ```bash
   DOCKER_BUILDKIT=1 docker build --network=host -f web-APP/Dockerfile -t frontend:latest .
   DOCKER_BUILDKIT=1 docker build --network=host -t backend:latest web-APP/backend/
   minikube image load frontend:latest
   minikube image load backend:latest
   ```

3. **Appliquer les manifests Kubernetes**  
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/
   ```

4. **Attendre que les pods soient prêts**  
   ```bash
   kubectl wait --for=condition=ready pod --all -n scalable-app --timeout=300s
   ```

5. **Démarrer le port-forwarding**  
   ```bash
   kubectl port-forward service/frontend 8080:80 -n scalable-app &
   kubectl port-forward service/backend 3000:3000 -n scalable-app &
   ```

6. **Vérifier le statut**  
   ```bash
   kubectl get pods,svc,hpa -n scalable-app
   curl http://localhost:8080/api
   ```

7. **Test de montée en charge (optionnel)**  
   ```bash
   ./load-test.sh
   ```

## Résolution des problèmes courants

**Erreur "Error connecting to backend" dans le frontend:**
```bash
cd frontend && npm run build
kubectl cp build/. <frontend-pod>:/usr/share/nginx/html/ -n scalable-app
kubectl exec deployment/frontend -n scalable-app -- nginx -s reload
```

**Configuration nginx manquante:**
```bash
kubectl exec deployment/frontend -n scalable-app -- cat /etc/nginx/conf.d/default.conf
# Vérifier que la section location /api est présente
```
