import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use relative path for API calls - nginx will proxy to backend service
        // This works both in development (with proxy) and production (with nginx proxy)
        console.log('Attempting to connect to backend via proxy at: /api');
        const response = await axios.get('/api');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setData({ message: 'Error connecting to backend', error: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Kubernetes Scalable Web Application</h1>
        <div className="content">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div>
              <h2>Backend Response:</h2>
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
