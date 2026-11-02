const { validarPelicula, construirFiltro, esEstadoValido } = require('../../src/peliculas');

describe('validarPelicula', () => {
  const valida = { titulo: 'Inception', director: 'Christopher Nolan', genero: 'Ciencia ficción', anio: 2010 };

  test('acepta una película con todos los datos válidos', () => {
    expect(validarPelicula(valida)).toEqual([]);
  });

  test('acepta el año como texto, igual que llega desde el formulario', () => {
    expect(validarPelicula({ ...valida, anio: '2010' })).toEqual([]);
  });

  test('rechaza un título vacío', () => {
    expect(validarPelicula({ ...valida, titulo: '' })).toContain('El título es obligatorio');
  });

  test('rechaza un título con solo espacios', () => {
    expect(validarPelicula({ ...valida, titulo: '   ' })).toContain('El título es obligatorio');
  });

  test('rechaza un director vacío', () => {
    expect(validarPelicula({ ...valida, director: '' })).toContain('El director es obligatorio');
  });

  test('rechaza un género vacío', () => {
    expect(validarPelicula({ ...valida, genero: '' })).toContain('El género es obligatorio');
  });

  test('rechaza un año que no es un número', () => {
    expect(validarPelicula({ ...valida, anio: 'abc' })).toContain('El año no es válido');
  });

  test('rechaza un año anterior al nacimiento del cine', () => {
    expect(validarPelicula({ ...valida, anio: 1500 })).toContain('El año no es válido');
  });

  test('reporta todos los errores cuando no se envían datos', () => {
    expect(validarPelicula()).toHaveLength(4);
  });
});

describe('construirFiltro', () => {
  test('sin criterios no agrega condiciones', () => {
    expect(construirFiltro()).toEqual({ where: '', params: [] });
  });

  test('ignora criterios que solo tienen espacios', () => {
    expect(construirFiltro({ q: '   ', genero: ' ' })).toEqual({ where: '', params: [] });
  });

  test('la búsqueda de texto consulta título y director', () => {
    const { where, params } = construirFiltro({ q: 'nolan' });
    expect(where).toBe('WHERE (titulo ILIKE $1 OR director ILIKE $1)');
    expect(params).toEqual(['%nolan%']);
  });

  test('filtra por género exacto', () => {
    const { where, params } = construirFiltro({ genero: 'Drama' });
    expect(where).toBe('WHERE genero = $1');
    expect(params).toEqual(['Drama']);
  });

  test('filtra por estado válido', () => {
    const { where, params } = construirFiltro({ estado: 'vista' });
    expect(where).toBe('WHERE estado = $1');
    expect(params).toEqual(['vista']);
  });

  test('ignora un estado que no existe', () => {
    expect(construirFiltro({ estado: 'cualquiera' })).toEqual({ where: '', params: [] });
  });

  test('combina texto, género y estado numerando bien los parámetros', () => {
    const { where, params } = construirFiltro({ q: 'nolan', genero: 'Drama', estado: 'vista' });
    expect(where).toBe('WHERE (titulo ILIKE $1 OR director ILIKE $1) AND genero = $2 AND estado = $3');
    expect(params).toEqual(['%nolan%', 'Drama', 'vista']);
  });
});

describe('esEstadoValido', () => {
  test('acepta pendiente y vista', () => {
    expect(esEstadoValido('pendiente')).toBe(true);
    expect(esEstadoValido('vista')).toBe(true);
  });

  test('rechaza cualquier otro valor', () => {
    expect(esEstadoValido('borrada')).toBe(false);
    expect(esEstadoValido('')).toBe(false);
  });
});