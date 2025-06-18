const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connexion à la base de données
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'scalable_app'
});

// Point de terminaison de vérification de santé
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Point de terminaison API principal
app.get('/api', async (req, res) => {
  try {
    // Tester la connexion à la base de données
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    client.release();
    
    res.json({
      message: 'API Backend fonctionne !',
      hostname: require('os').hostname(),
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        current_time: result.rows[0].current_time,
        version: result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]
      }
    });
  } catch (error) {
    console.error('Erreur de connexion à la base de données :', error);
    res.json({
      message: 'API Backend fonctionne !',
      hostname: require('os').hostname(),
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: error.message
      }
    });
  }
});

// Point de terminaison de données d'exemple pour les tests de charge
app.get('/api/data', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT COUNT(*) as count FROM information_schema.tables');
    client.release();
    
    res.json({
      data: 'Données d\'exemple pour test de charge',
      timestamp: new Date().toISOString(),
      hostname: require('os').hostname(),
      random: Math.random(),
      table_count: result.rows[0].count
    });
  } catch (error) {
    res.json({
      data: 'Données d\'exemple pour test de charge',
      timestamp: new Date().toISOString(),
      hostname: require('os').hostname(),
      random: Math.random(),
      database_error: error.message
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Serveur backend fonctionnant sur le port ${port}`);
  console.log(`Environnement : ${process.env.NODE_ENV || 'development'}`);
});
