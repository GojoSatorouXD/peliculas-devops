const express = require('express');
const path = require('path');
const pool = require('./db');
const { ESTADOS, validarPelicula, construirFiltro } = require('./peliculas');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));

const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

// READ (listar, con búsqueda y filtros por género y estado)
app.get('/', wrap(async (req, res) => {
  const { q = '', genero = '', estado = '' } = req.query;
  const { where, params } = construirFiltro({ q, genero, estado });
  const { rows } = await pool.query(`SELECT * FROM peliculas ${where} ORDER BY id`, params);
  const { rows: filas } = await pool.query('SELECT DISTINCT genero FROM peliculas ORDER BY genero');
  res.render('index', {
    peliculas: rows,
    generos: filas.map((f) => f.genero),
    estados: ESTADOS,
    q,
    genero,
    estado,
  });
}));

// CREATE
app.post('/peliculas', wrap(async (req, res) => {
  const errores = validarPelicula(req.body);
  if (errores.length) return res.status(400).send(`Datos inválidos: ${errores.join(', ')}`);
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
  const errores = validarPelicula(req.body);
  if (errores.length) return res.status(400).send(`Datos inválidos: ${errores.join(', ')}`);
  const { titulo, director, genero, anio } = req.body;
  await pool.query(
    'UPDATE peliculas SET titulo=$1, director=$2, genero=$3, anio=$4 WHERE id=$5',
    [titulo, director, genero, anio, req.params.id]
  );
  res.redirect('/');
}));

// Cambiar el estado: pendiente <-> vista
app.post('/peliculas/:id/estado', wrap(async (req, res) => {
  await pool.query(
    `UPDATE peliculas
     SET estado = CASE WHEN estado = 'vista' THEN 'pendiente' ELSE 'vista' END
     WHERE id = $1`,
    [req.params.id]
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

module.exports = app;