const request = require('supertest');
const pool = require('../../src/db');
const app = require('../../src/app');

// Seguridad: estas pruebas borran datos, así que solo corren contra una base de pruebas
if (!/test/i.test(process.env.DB_NAME || '')) {
  throw new Error('Las pruebas de integración solo pueden usar una base cuyo nombre contenga "test"');
}

const inception = { titulo: 'Inception', director: 'Christopher Nolan', genero: 'Ciencia ficción', anio: 2010 };
const coco = { titulo: 'Coco', director: 'Lee Unkrich', genero: 'Animación', anio: 2017 };
const titanic = { titulo: 'Titanic', director: 'James Cameron', genero: 'Drama', anio: 1997 };

async function insertar(p, estado = 'pendiente') {
  const { rows } = await pool.query(
    'INSERT INTO peliculas (titulo, director, genero, anio, estado) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [p.titulo, p.director, p.genero, p.anio, estado]
  );
  return rows[0];
}

beforeAll(async () => {
  await pool.initDb();
});

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE peliculas RESTART IDENTITY');
});

afterAll(async () => {
  await pool.end();
});

describe('CRUD de películas', () => {
  test('el listado vacío muestra "Sin resultados"', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Sin resultados');
  });

  test('al registrar una película se guarda en la base y aparece en el listado', async () => {
    const res = await request(app).post('/peliculas').type('form').send(inception);
    expect(res.status).toBe(302);

    const { rows } = await pool.query('SELECT * FROM peliculas');
    expect(rows).toHaveLength(1);
    expect(rows[0].titulo).toBe('Inception');
    expect(rows[0].estado).toBe('pendiente');

    const lista = await request(app).get('/');
    expect(lista.text).toContain('Inception');
    expect(lista.text).toContain('Christopher Nolan');
  });

  test('no registra una película con el título vacío', async () => {
    const res = await request(app).post('/peliculas').type('form').send({ ...inception, titulo: '   ' });
    expect(res.status).toBe(400);

    const { rows } = await pool.query('SELECT * FROM peliculas');
    expect(rows).toHaveLength(0);
  });

  test('modifica los datos de una película existente', async () => {
    const p = await insertar(inception);
    const res = await request(app).post(`/peliculas/${p.id}/editar`).type('form').send({ ...inception, anio: 2011 });
    expect(res.status).toBe(302);

    const { rows } = await pool.query('SELECT anio FROM peliculas WHERE id=$1', [p.id]);
    expect(rows[0].anio).toBe(2011);
  });

  test('elimina una película', async () => {
    const p = await insertar(inception);
    const res = await request(app).post(`/peliculas/${p.id}/eliminar`);
    expect(res.status).toBe(302);

    const { rows } = await pool.query('SELECT * FROM peliculas');
    expect(rows).toHaveLength(0);
  });
});

describe('Funcionalidad nueva 1: búsqueda y filtro por género', () => {
  beforeEach(async () => {
    await insertar(inception);
    await insertar(coco);
    await insertar(titanic);
  });

  test('busca por parte del director sin distinguir mayúsculas', async () => {
    const res = await request(app).get('/').query({ q: 'NOLAN' });
    expect(res.text).toContain('Inception');
    expect(res.text).not.toContain('Coco');
    expect(res.text).not.toContain('Titanic');
  });

  test('busca por parte del título', async () => {
    const res = await request(app).get('/').query({ q: 'tita' });
    expect(res.text).toContain('Titanic');
    expect(res.text).not.toContain('Inception');
  });

  test('filtra por género', async () => {
    const res = await request(app).get('/').query({ genero: 'Drama' });
    expect(res.text).toContain('Titanic');
    expect(res.text).not.toContain('Coco');
    expect(res.text).not.toContain('Inception');
  });

  test('sin coincidencias muestra "Sin resultados"', async () => {
    const res = await request(app).get('/').query({ q: 'zzzz' });
    expect(res.text).toContain('Sin resultados');
  });
});

describe('Funcionalidad nueva 2: estado vista/pendiente', () => {
  test('una película nueva queda como pendiente', async () => {
    const p = await insertar(inception);
    expect(p.estado).toBe('pendiente');
  });

  test('cambia a vista y vuelve a pendiente', async () => {
    const p = await insertar(inception);

    await request(app).post(`/peliculas/${p.id}/estado`);
    let { rows } = await pool.query('SELECT estado FROM peliculas WHERE id=$1', [p.id]);
    expect(rows[0].estado).toBe('vista');

    await request(app).post(`/peliculas/${p.id}/estado`);
    ({ rows } = await pool.query('SELECT estado FROM peliculas WHERE id=$1', [p.id]));
    expect(rows[0].estado).toBe('pendiente');
  });

  test('filtra el listado por estado', async () => {
    await insertar(inception, 'vista');
    await insertar(coco, 'pendiente');

    const vistas = await request(app).get('/').query({ estado: 'vista' });
    expect(vistas.text).toContain('Inception');
    expect(vistas.text).not.toContain('Coco');

    const pendientes = await request(app).get('/').query({ estado: 'pendiente' });
    expect(pendientes.text).toContain('Coco');
    expect(pendientes.text).not.toContain('Inception');
  });
});