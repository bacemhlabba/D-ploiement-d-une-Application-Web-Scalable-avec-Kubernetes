import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Utiliser un chemin relatif pour les appels API - nginx va faire le proxy vers le service backend
        // Cela fonctionne à la fois en développement (avec proxy) et en production (avec proxy nginx)
        console.log('Tentative de connexion au backend via proxy à : /api');
        const response = await axios.get('/api');
        setData(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
        setData({ message: 'Erreur de connexion au backend', error: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Application Web Kubernetes Évolutive</h1>
        <div className="content">
          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div>
              <h2>Réponse du Backend :</h2>
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
