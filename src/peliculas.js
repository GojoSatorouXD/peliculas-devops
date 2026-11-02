// Valida los datos de una película. Devuelve una lista de errores (vacía si todo está bien).
function validarPelicula(datos = {}) {
  const errores = [];
  const { titulo, director, genero, anio } = datos;

  if (!titulo || !String(titulo).trim()) errores.push('El título es obligatorio');
  if (!director || !String(director).trim()) errores.push('El director es obligatorio');
  if (!genero || !String(genero).trim()) errores.push('El género es obligatorio');

  const n = Number(anio);
  if (!Number.isInteger(n) || n < 1888 || n > new Date().getFullYear() + 5) {
    errores.push('El año no es válido');
  }
  return errores;
}

// Construye la cláusula WHERE y sus parámetros para buscar y filtrar películas.
function construirFiltro({ q = '', genero = '' } = {}) {
  const condiciones = [];
  const params = [];

  const texto = String(q).trim();
  if (texto) {
    params.push(`%${texto}%`);
    condiciones.push(`(titulo ILIKE $${params.length} OR director ILIKE $${params.length})`);
  }

  const g = String(genero).trim();
  if (g) {
    params.push(g);
    condiciones.push(`genero = $${params.length}`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  return { where, params };
}

module.exports = { validarPelicula, construirFiltro };