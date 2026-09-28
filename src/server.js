const express = require('express');
const path = require('path');
const pool = require('./db');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));

const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

// READ (listar)
app.get('/', wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM peliculas ORDER BY id');
  res.render('index', { peliculas: rows });
}));

// CREATE
app.post('/peliculas', wrap(async (req, res) => {
  const { titulo, director, genero, anio } = req.body;
  await pool.query(
    'INSERT INTO peliculas (titulo, director, genero, anio) VALUES ($1,$2,$3,$4)',
    [titulo, director, genero, anio]
  );
  res.redirect('/');
}));

// UPDATE (formulario)
app.get('/peliculas/:id/editar', wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM peliculas WHERE id=$1', [req.params.id]);
  if (!rows.length) return res.redirect('/');
  res.render('editar', { pelicula: rows[0] });
}));

// UPDATE (guardar)
app.post('/peliculas/:id/editar', wrap(async (req, res) => {
  const { titulo, director, genero, anio } = req.body;
  await pool.query(
    'UPDATE peliculas SET titulo=$1, director=$2, genero=$3, anio=$4 WHERE id=$5',
    [titulo, director, genero, anio, req.params.id]
  );
  res.redirect('/');
}));

// DELETE
app.post('/peliculas/:id/eliminar', wrap(async (req, res) => {
  await pool.query('DELETE FROM peliculas WHERE id=$1', [req.params.id]);
  res.redirect('/');
}));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Error interno del servidor');
});

const PORT = process.env.PORT || 3000;
pool.initDb()
  .then(() => app.listen(PORT, () => console.log(`App escuchando en puerto ${PORT}`)))
  .catch((e) => { console.error('No se pudo conectar a la BD', e); process.exit(1); });