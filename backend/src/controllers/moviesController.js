const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

async function fetchTmdb(path) {
  const url = `${TMDB_BASE_URL}${path}${path.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status}`);
  }

  return response.json();
}

async function getTomHanksMovies() {
  const peopleData = await fetchTmdb(`/search/person?query=${encodeURIComponent('Tom Hanks')}&include_adult=false&language=pt-BR&page=1`);
  const tomHanks = (peopleData.results || []).find((person) => person.name && person.name.toLowerCase() === 'tom hanks');

  if (!tomHanks) {
    return [];
  }

  const moviesData = await fetchTmdb(`/discover/movie?with_cast=${tomHanks.id}&sort_by=popularity.desc&include_adult=false&language=pt-BR&page=1`);
  return moviesData.results || [];
}

exports.searchMovies = async (req, res) => {
  try {
    const { q } = req.query;

    let data;
    if (q && String(q).trim()) {
      data = await fetchTmdb(`/search/movie?query=${encodeURIComponent(q)}&include_adult=false&language=pt-BR&page=1`);
    } else {
      data = { results: await getTomHanksMovies() };
    }

    const movies = (data.results || []).map((movie) => ({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      genre_ids: movie.genre_ids || []
    }));

    res.json(movies);
  } catch (error) {
    console.error('Erro ao consultar TMDB:', error.message);
    res.status(500).json({ error: 'Erro ao listar filmes' });
  }
};

exports.getMovieDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchTmdb(`/movie/${id}?language=pt-BR`);

    return res.json({
      id: data.id,
      title: data.title,
      overview: data.overview,
      poster_path: data.poster_path,
      release_date: data.release_date,
      vote_average: data.vote_average,
      genre_ids: data.genres ? data.genres.map((g) => g.id) : []
    });
  } catch (error) {
    console.error('Erro ao consultar detalhes do TMDB:', error.message);
    return res.status(404).json({ error: 'Filme não encontrado' });
  }
};
