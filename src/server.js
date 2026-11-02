const app = require('./app');
const pool = require('./db');

const PORT = process.env.PORT || 3000;
pool.initDb()
  .then(() => app.listen(PORT, () => console.log(`App escuchando en puerto ${PORT}`)))
  .catch((e) => { console.error('No se pudo conectar a la BD', e); process.exit(1); });