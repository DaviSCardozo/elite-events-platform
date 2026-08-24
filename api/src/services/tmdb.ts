import { env } from '../config/env.js'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export interface TmdbMovie {
  tmdbId: number
  title: string
  overview: string
  posterUrl: string | null
  releaseDate: string | null
}

interface TmdbApiResult {
  id: number
  title: string
  overview: string
  poster_path: string | null
  release_date: string | null
}

export async function searchMovies(query: string): Promise<TmdbMovie[]> {
  const url = new URL(`${TMDB_BASE_URL}/search/movie`)
  url.searchParams.set('api_key', env.TMDB_API_KEY)
  url.searchParams.set('language', 'pt-BR')
  url.searchParams.set('query', query)

  const res = await fetch(url.toString())

  if (!res.ok) {
    throw new Error('Falha ao consultar a API da TMDb')
  }

  const data = (await res.json()) as { results: TmdbApiResult[] }

  return data.results.map((movie) => ({
    tmdbId: movie.id,
    title: movie.title,
    overview: movie.overview,
    posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
    releaseDate: movie.release_date || null,
  }))
}
