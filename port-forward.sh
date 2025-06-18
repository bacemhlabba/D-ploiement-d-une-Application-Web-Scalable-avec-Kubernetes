#!/bin/bash
# Script de gestion du port-forwarding pour k8s-scalable-app

echo "🌐 Gestion du port-forwarding pour k8s-scalable-app..."

# Fonction pour démarrer le port-forwarding
start_port_forwarding() {
    echo "Démarrage des services de port-forwarding..."
    
    # Arrêter les port-forwards existants
    pkill -f "kubectl port-forward service/frontend" 2>/dev/null
    pkill -f "kubectl port-forward service/backend" 2>/dev/null
    
    # Attendre un moment que les processus s'arrêtent
    sleep 2
    
    # Démarrer le port-forward frontend
    echo "Démarrage du port-forward frontend (8080:80)..."
    nohup kubectl port-forward service/frontend 8080:80 -n scalable-app > frontend-port-forward.log 2>&1 &
    FRONTEND_PF_PID=$!
    
    # Démarrer le port-forward backend
    echo "Démarrage du port-forward backend (3000:3000)..."
    nohup kubectl port-forward service/backend 3000:3000 -n scalable-app > backend-port-forward.log 2>&1 &
    BACKEND_PF_PID=$!
    
    # Sauvegarder les PIDs pour référence ultérieure
    echo $FRONTEND_PF_PID > .frontend-pf.pid
    echo $BACKEND_PF_PID > .backend-pf.pid
    
    echo "✅ Port-forwarding démarré avec succès !"
    echo "   PID Frontend : $FRONTEND_PF_PID (logs : frontend-port-forward.log)"
    echo "   PID Backend : $BACKEND_PF_PID (logs : backend-port-forward.log)"
    echo ""
    echo "🌐 Accédez à votre application :"
    echo "   Frontend : http://localhost:8080"
    echo "   Backend : http://localhost:3000/api"
}

# Fonction pour arrêter le port-forwarding
stop_port_forwarding() {
    echo "Arrêt des services de port-forwarding..."
    pkill -f "kubectl port-forward service/frontend"
    pkill -f "kubectl port-forward service/backend"
    
    # Nettoyer les fichiers PID
    rm -f .frontend-pf.pid .backend-pf.pid
    
    echo "✅ Port-forwarding arrêté !"
}

# Fonction pour vérifier le statut
check_status() {
    echo "🌐 Statut du Port-forwarding :"
    
    if pgrep -f "kubectl port-forward service/frontend" >/dev/null; then
        echo "   ✅ Port-forward frontend (8080) en cours d'exécution"
    else
        echo "   ❌ Port-forward frontend ne fonctionne pas"
    fi
    
    if pgrep -f "kubectl port-forward service/backend" >/dev/null; then
        echo "   ✅ Port-forward backend (3000) en cours d'exécution"
    else
        echo "   ❌ Port-forward backend ne fonctionne pas"
    fi
    
    # Afficher la fin des logs si disponible
    if [ -f frontend-port-forward.log ]; then
        echo ""
        echo "📋 Logs frontend (3 dernières lignes) :"
        tail -n 3 frontend-port-forward.log
    fi
    
    if [ -f backend-port-forward.log ]; then
        echo ""
        echo "📋 Logs backend (3 dernières lignes) :"
        tail -n 3 backend-port-forward.log
    fi
}

# Logique principale du script
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
        echo "Usage : $0 {start|stop|restart|status}"
        echo ""
        echo "Commandes :"
        echo "  start   - Démarrer le port-forwarding (par défaut)"
        echo "  stop    - Arrêter le port-forwarding"
        echo "  restart - Redémarrer le port-forwarding"
        echo "  status  - Vérifier le statut du port-forwarding"
        exit 1
        ;;
esac
