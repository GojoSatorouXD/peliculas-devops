const { Pool } = require('pg');

// La conexión se configura solo con variables de entorno (definidas en docker-compose.yml)
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Crea la tabla si no existe
pool.initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS peliculas (
      id SERIAL PRIMARY KEY,
      titulo VARCHAR(150) NOT NULL,
      director VARCHAR(100) NOT NULL,
      genero VARCHAR(50) NOT NULL,
      anio INTEGER NOT NULL
    )
  `);
};

module.exports = pool;