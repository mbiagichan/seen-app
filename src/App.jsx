import { useState, useRef, useEffect } from "react";
import { Heart, Send, RefreshCw, X, Plus, Search, Moon, Sun, Filter, TrendingUp, Clock, Star, Calendar, Users, Eye, MessageCircle } from "lucide-react";

// TMDB API Configuration
const TMDB_API_KEY = '694969e9b0cba3d7f080a6b854a0fd0d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Genre ID to name mapping
const GENRE_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
};

// Storage wrapper for browser localStorage (replaces Claude Artifacts storage)
const storage = {
  get: async (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? { key, value, shared: false } : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },
  set: async (key, value) => {
    try {
      localStorage.setItem(key, value);
      return { key, value, shared: false };
    } catch (error) {
      console.error('Storage set error:', error);
      return null;
    }
  }
};

// Enhanced theme with dark mode support
const createTheme = (dark) => ({
  bg: dark ? "#0A0A0B" : "#F7F5F3",
  bgSecondary: dark ? "#141416" : "#FEFEFE",
  card: dark ? "#1C1C1F" : "#FFFFFF",
  cardHover: dark ? "#252528" : "#FAFAF8",
  border: dark ? "#2A2A2D" : "#ECEAE6",
  borderMed: dark ? "#3A3A3D" : "#DDD9D4",
  text: dark ? "#F5F5F5" : "#2C2825",
  textSec: dark ? "#A0A0A3" : "#7A746E",
  textTer: dark ? "#6A6A6D" : "#ADA69F",
  accent: "#0F766E",
  accentLight: dark ? "#0A4A43" : "#E0F2F1",
  accentSoft: "#2DD4BF",
  coral: "#E8636B",
  green: "#2D9B6E",
  yellow: "#D4960A",
  orange: "#D47A2E",
  red: "#CC4B4B",
  overlay: dark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)",
  headerBg: dark ? "rgba(10,10,11,0.9)" : "rgba(247,245,243,0.9)",
  navBg: dark ? "rgba(10,10,11,0.94)" : "rgba(247,245,243,0.94)",
});

const ratingColor = (r) => {
  if (r >= 8) return "#2D9B6E";
  if (r >= 6) return "#D4960A";
  if (r >= 4) return "#D47A2E";
  return "#CC4B4B";
};

// --- Custom Cinema Icons ---
const ClapperIcon = ({ size = 22, color = "currentColor", strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h16a1 1 0 001-1V7H3v12a1 1 0 001 1z" />
    <path d="M3 7l2.5-4h13L21 7H3z" />
    <path d="M7 3l-1.5 4M12.5 3L11 7M18 3l-1.5 4" />
  </svg>
);

const TicketIcon = ({ size = 22, color = "currentColor", strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <line x1="9" y1="5" x2="9" y2="8" />
    <line x1="9" y1="12" x2="9" y2="12.01" />
    <line x1="9" y1="16" x2="9" y2="19" />
  </svg>
);

const SpotlightIcon = ({ size = 22, color = "currentColor", strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="6" /><path d="M20 20l-3.5-3.5" /><circle cx="11" cy="11" r="2.5" />
  </svg>
);

const DirectorChairIcon = ({ size = 22, color = "currentColor", strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3v18M18 3v18" /><path d="M6 8h12" /><path d="M6 16h12" /><path d="M4 8l4 8M20 8l-4 8" /><path d="M8 3h8" />
  </svg>
);

const FilmIcon = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2" /><path d="M7 2v20M17 2v20M2 7h5M17 7h5M2 12h20M2 17h5M17 17h5" />
  </svg>
);

const VenueIcons = {
  theater: ({ size = 14 }) => <FilmIcon size={size} />,
  home: ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l9-9 9 9" /><path d="M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10" /></svg>,
  flight: ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C20.3 6.7 21 5 20 4s-2.7-.3-3.5.5L13 8l-8.2-1.8c-.4-.1-.8 0-1 .3l-.4.4 6.2 4.6-3.8 3.8-2-.6-.6.6 2.8 2 2 2.8.6-.6-.6-2 3.8-3.8 4.6 6.2.4-.4c.3-.2.4-.6.3-1z" /></svg>,
  other: ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>,
};
const venueLabels = { theater: "Theater", home: "At Home", flight: "In-Flight", other: "Other" };

// --- Mock Movie Database ---
const MOCK_MOVIES = [
  { id: 1, title: "Fight Club", year: "1999", overview: "An insomniac office worker and a devil-may-care soap maker form an underground fight club.", rating: 8.8, poster: "", backdrop: "", genres: ["Drama", "Thriller"], runtime: 139 },
  { id: 2, title: "The Shawshank Redemption", year: "1994", overview: "Two imprisoned men bond over a number of years, finding solace and eventual redemption.", rating: 9.3, poster: "", backdrop: "", genres: ["Drama", "Crime"], runtime: 142 },
  { id: 3, title: "Inception", year: "2010", overview: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.", rating: 8.8, poster: "", backdrop: "", genres: ["Sci-Fi", "Action"], runtime: 148 },
  { id: 4, title: "The Dark Knight", year: "2008", overview: "When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest tests.", rating: 9.0, poster: "", backdrop: "", genres: ["Action", "Crime"], runtime: 152 },
  { id: 5, title: "Pulp Fiction", year: "1994", overview: "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence.", rating: 8.9, poster: "", backdrop: "", genres: ["Crime", "Drama"], runtime: 154 },
  { id: 6, title: "The Matrix", year: "1999", overview: "A computer hacker learns about the true nature of reality and his role in the war against its controllers.", rating: 8.7, poster: "", backdrop: "", genres: ["Sci-Fi", "Action"], runtime: 136 },
  { id: 7, title: "Goodfellas", year: "1990", overview: "The story of Henry Hill and his life in the mob, covering his relationship with his wife and his partners.", rating: 8.7, poster: "", backdrop: "", genres: ["Crime", "Drama"], runtime: 146 },
  { id: 8, title: "Parasite", year: "2019", overview: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.", rating: 8.6, poster: "", backdrop: "", genres: ["Drama", "Thriller"], runtime: 132 },
  { id: 9, title: "Interstellar", year: "2014", overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.", rating: 8.6, poster: "", backdrop: "", genres: ["Sci-Fi", "Adventure"], runtime: 169 },
  { id: 10, title: "The Godfather", year: "1972", overview: "The aging patriarch of an organized crime dynasty transfers control of his empire to his reluctant son.", rating: 9.2, poster: "", backdrop: "", genres: ["Crime", "Drama"], runtime: 175 },
  { id: 11, title: "Forrest Gump", year: "1994", overview: "The presidencies of Kennedy and Johnson, the Vietnam War, and other historical events unfold from the perspective of an Alabama man.", rating: 8.8, poster: "", backdrop: "", genres: ["Drama", "Romance"], runtime: 142 },
  { id: 12, title: "The Silence of the Lambs", year: "1991", overview: "A young FBI cadet must receive the help of an incarcerated cannibal killer to catch another serial killer.", rating: 8.6, poster: "", backdrop: "", genres: ["Crime", "Thriller"], runtime: 118 },
  { id: 13, title: "Dune", year: "2021", overview: "Paul Atreides arrives on Arrakis after his father accepts the stewardship of the dangerous planet.", rating: 8.0, poster: "", backdrop: "", genres: ["Sci-Fi", "Adventure"], runtime: 155 },
  { id: 14, title: "Oppenheimer", year: "2023", overview: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.", rating: 8.4, poster: "", backdrop: "", genres: ["Biography", "Drama"], runtime: 180 },
  { id: 15, title: "Everything Everywhere All at Once", year: "2022", overview: "An aging Chinese immigrant is swept up in an insane adventure, where she alone can save the world.", rating: 7.8, poster: "", backdrop: "", genres: ["Action", "Adventure"], runtime: 139 },
];

// --- API ---
async function searchMovies(query) {
  if (!query.trim()) return [];
  
  try {
    // Search both movies and people
    const [movieResponse, personResponse] = await Promise.all([
      fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`),
      fetch(`${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`)
    ]);
    
    const movieData = await movieResponse.json();
    const personData = await personResponse.json();
    
    // If we found a person (actor/director) as top result, get their movies
    if (personData.results && personData.results.length > 0 && personData.results[0].known_for_department) {
      const person = personData.results[0];
      
      // Get person's movie credits
      const creditsResponse = await fetch(
        `${TMDB_BASE_URL}/person/${person.id}/movie_credits?api_key=${TMDB_API_KEY}`
      );
      const creditsData = await creditsResponse.json();
      
      // Combine cast and crew, sort by popularity
      const allMovies = [...(creditsData.cast || []), ...(creditsData.crew || [])]
        .filter((movie, index, self) => 
          index === self.findIndex(m => m.id === movie.id) // Remove duplicates
        )
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 20);
      
      return allMovies.map(movie => ({
        id: `tmdb-${movie.id}`,
        tmdbId: movie.id,
        title: movie.title,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
        poster: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null,
        overview: movie.overview,
        genres: movie.genre_ids ? movie.genre_ids.map(id => GENRE_MAP[id]).filter(Boolean) : [],
        rating: movie.vote_average ? parseFloat(movie.vote_average.toFixed(1)) : null
      }));
    }
    
    // Otherwise return regular movie search results
    return movieData.results?.slice(0, 10).map(movie => ({
      id: `tmdb-${movie.id}`,
      tmdbId: movie.id,
      title: movie.title,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      poster: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null,
      overview: movie.overview,
      genres: movie.genre_ids ? movie.genre_ids.map(id => GENRE_MAP[id]).filter(Boolean) : [],
      rating: movie.vote_average ? parseFloat(movie.vote_average.toFixed(1)) : null
    })) || [];
  } catch (error) {
    console.error('TMDB search error:', error);
    return [];
  }
}

// Fetch full movie details including cast, director, and streaming info
async function getMovieDetails(tmdbId) {
  try {
    const [detailsResponse, providersResponse] = await Promise.all([
      fetch(`${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits`),
      fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`)
    ]);
    
    const data = await detailsResponse.json();
    const providersData = await providersResponse.json();
    
    // Get US streaming providers (you can change 'US' to user's country)
    const usProviders = providersData.results?.US;
    const streamingOn = usProviders?.flatrate?.map(p => p.provider_name) || [];
    const rentOn = usProviders?.rent?.map(p => p.provider_name) || [];
    const buyOn = usProviders?.buy?.map(p => p.provider_name) || [];
    
    return {
      id: `tmdb-${data.id}`,
      tmdbId: data.id,
      title: data.title,
      year: data.release_date ? new Date(data.release_date).getFullYear() : null,
      poster: data.poster_path ? `${TMDB_IMAGE_BASE}${data.poster_path}` : null,
      overview: data.overview,
      genres: data.genres?.map(g => g.name) || [],
      runtime: data.runtime,
      rating: data.vote_average ? parseFloat(data.vote_average.toFixed(1)) : null,
      cast: data.credits?.cast?.slice(0, 5).map(person => person.name) || [],
      director: data.credits?.crew?.find(person => person.job === 'Director')?.name || null,
      streamingOn,
      rentOn,
      buyOn
    };
  } catch (error) {
    console.error('TMDB details error:', error);
    return null;
  }
}


// --- Data ---
const FRIENDS = [
  { id: "f1", name: "Alex", avatar: "A", color: "#7C8ABF", bio: "Film buff • Love indie dramas", followers: 234, following: 189, mutualFriends: 12 },
  { id: "f2", name: "Jordan", avatar: "J", color: "#C47E8A", bio: "Horror fanatic 🎃", followers: 456, following: 312, mutualFriends: 8 },
  { id: "f3", name: "Sam", avatar: "S", color: "#6BA89A", bio: "Nolan superfan • Sci-fi forever", followers: 189, following: 234, mutualFriends: 15 },
  { id: "f4", name: "Riley", avatar: "R", color: "#C4A46E", bio: "Watching everything 🎬", followers: 678, following: 445, mutualFriends: 20 },
  { id: "f5", name: "Morgan", avatar: "M", color: "#8B7AA8", bio: "A24 obsessed", followers: 891, following: 567, mutualFriends: 5 },
  { id: "f6", name: "Casey", avatar: "C", color: "#A88B7A", bio: "Classic cinema lover 🎞️", followers: 345, following: 278, mutualFriends: 18 },
];
const ME = { id: "me", name: "You", avatar: "Y", color: "#1A9E8F" };

const MOCK_COLLECTIONS = [
  { id: "col1", name: "Summer Night Vibes", creator: FRIENDS[0], movieCount: 12, isPublic: true, followers: 45, thumbnail: "" },
  { id: "col2", name: "Comfort Movies", creator: FRIENDS[1], movieCount: 8, isPublic: true, followers: 89, thumbnail: "" },
  { id: "col3", name: "Mind-Bending Thrillers", creator: FRIENDS[2], movieCount: 15, isPublic: true, followers: 234, thumbnail: "" },
  { id: "col4", name: "Date Night Picks", creator: FRIENDS[3], movieCount: 20, isPublic: true, followers: 156, thumbnail: "" },
  { id: "col5", name: "Rainy Day Favorites", creator: FRIENDS[4], movieCount: 18, isPublic: true, followers: 78, thumbnail: "" },
];

const timeAgo = (ts) => {
  const date = new Date(ts);
  const month = date.toLocaleString('default', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

const Avatar = ({ user, size = 34 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: user.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{user.avatar}</div>
);

const MOCK_COMMENTS = {
  m1: [
    { 
      id: "c1", 
      user: FRIENDS[1], 
      text: "Right?! Brady Corbet is a genius", 
      timestamp: Date.now() - 3600000,
      replies: [
        { id: "r1", user: FRIENDS[0], text: "His vision is unmatched", timestamp: Date.now() - 3000000 }
      ]
    },
    { 
      id: "c2", 
      user: FRIENDS[3], 
      text: "Adding this to my watchlist", 
      timestamp: Date.now() - 1800000,
      replies: []
    },
  ],
  m2: [{ 
    id: "c3", 
    user: FRIENDS[0], 
    text: "Mikey Madison was unreal in this", 
    timestamp: Date.now() - 3600000 * 3,
    replies: []
  }],
  m3: [
    { 
      id: "c4", 
      user: FRIENDS[1], 
      text: "The docking scene still gets me every time", 
      timestamp: Date.now() - 3600000 * 8,
      replies: []
    },
    { 
      id: "c5", 
      user: FRIENDS[3], 
      text: "MURPHHHH", 
      timestamp: Date.now() - 3600000 * 7,
      replies: [
        { id: "r2", user: FRIENDS[2], text: "😭😭😭", timestamp: Date.now() - 3600000 * 6.5 },
        { id: "r3", user: FRIENDS[0], text: "That scene destroyed me", timestamp: Date.now() - 3600000 * 6 }
      ]
    },
    { 
      id: "c6", 
      user: FRIENDS[0], 
      text: "Top 3 Nolan for sure", 
      timestamp: Date.now() - 3600000 * 6,
      replies: []
    },
  ],
};

const MOCK_FEED = [
  { id: "m1", user: FRIENDS[0], movieTitle: "The Brutalist", rating: 8.4, venue: "theater", thoughts: "Absolutely incredible. 3.5 hours flew by.", watchedWith: ["Jordan"], timestamp: Date.now() - 3600000 * 2, poster: "", year: "2024", genres: ["Drama", "Historical"] },
  { id: "m2", user: FRIENDS[1], movieTitle: "Anora", rating: 9.1, venue: "theater", thoughts: "Best film of the year for me.", watchedWith: ["Alex"], timestamp: Date.now() - 3600000 * 5, poster: "", year: "2024", genres: ["Comedy", "Drama"] },
  { id: "m3", user: FRIENDS[2], movieTitle: "Interstellar", rating: 9.5, venue: "home", thoughts: "Rewatch #4. Still hits different every time.", watchedWith: [], timestamp: Date.now() - 3600000 * 12, rewatch: true, poster: "", year: "2014", genres: ["Sci-Fi", "Adventure"] },
  { id: "m4", user: FRIENDS[0], movieTitle: "Dune: Part Two", rating: 8.8, venue: "theater", thoughts: "Villeneuve does it again. That desert scene!", watchedWith: [], timestamp: Date.now() - 3600000 * 24, poster: "", year: "2024", genres: ["Sci-Fi", "Adventure"] },
  { id: "m5", user: FRIENDS[3], movieTitle: "Poor Things", rating: 7.9, venue: "home", thoughts: "Weird, beautiful, unforgettable.", watchedWith: [], timestamp: Date.now() - 3600000 * 36, poster: "", year: "2023", genres: ["Comedy", "Drama"] },
  { id: "m6", user: FRIENDS[1], movieTitle: "Killers of the Flower Moon", rating: 8.6, venue: "theater", thoughts: "Scorsese and DiCaprio at their best.", watchedWith: [], timestamp: Date.now() - 3600000 * 48, poster: "", year: "2023", genres: ["Crime", "Drama"] },
];

// Mock friend check-ins (for viewing their profiles)
const FRIEND_CHECKINS = {
  "f1": [ // Alex
    { id: "ac1", user: FRIENDS[0], movieTitle: "The Brutalist", rating: 8.4, venue: "theater", thoughts: "Absolutely incredible. 3.5 hours flew by.", timestamp: Date.now() - 3600000 * 2, poster: "", year: "2024", genres: ["Drama", "Historical"] },
    { id: "ac2", user: FRIENDS[0], movieTitle: "Dune: Part Two", rating: 8.8, venue: "theater", thoughts: "Villeneuve does it again.", timestamp: Date.now() - 3600000 * 24, poster: "", year: "2024", genres: ["Sci-Fi", "Adventure"] },
    { id: "ac3", user: FRIENDS[0], movieTitle: "The Matrix", rating: 9.2, venue: "home", thoughts: "Still the best sci-fi movie ever made.", timestamp: Date.now() - 3600000 * 72, rewatch: true, poster: "", year: "1999", genres: ["Sci-Fi", "Action"] },
    { id: "ac4", user: FRIENDS[0], movieTitle: "Inception", rating: 9.0, venue: "theater", thoughts: "Mind = blown", timestamp: Date.now() - 3600000 * 120, poster: "", year: "2010", genres: ["Sci-Fi", "Thriller"] },
  ],
  "f2": [ // Jordan
    { id: "jc1", user: FRIENDS[1], movieTitle: "Anora", rating: 9.1, venue: "theater", thoughts: "Best film of the year for me.", timestamp: Date.now() - 3600000 * 5, poster: "", year: "2024", genres: ["Comedy", "Drama"] },
    { id: "jc2", user: FRIENDS[1], movieTitle: "Killers of the Flower Moon", rating: 8.6, venue: "theater", thoughts: "Scorsese masterpiece.", timestamp: Date.now() - 3600000 * 48, poster: "", year: "2023", genres: ["Crime", "Drama"] },
    { id: "jc3", user: FRIENDS[1], movieTitle: "Hereditary", rating: 9.3, venue: "home", thoughts: "Absolutely terrifying. Can't stop thinking about it.", timestamp: Date.now() - 3600000 * 96, poster: "", year: "2018", genres: ["Horror", "Drama"] },
  ],
  "f3": [ // Sam
    { id: "sc1", user: FRIENDS[2], movieTitle: "Interstellar", rating: 9.5, venue: "home", thoughts: "Rewatch #4. Still hits different.", timestamp: Date.now() - 3600000 * 12, rewatch: true, poster: "", year: "2014", genres: ["Sci-Fi", "Adventure"] },
    { id: "sc2", user: FRIENDS[2], movieTitle: "Oppenheimer", rating: 9.0, venue: "theater", thoughts: "Nolan is unmatched.", timestamp: Date.now() - 3600000 * 168, poster: "", year: "2023", genres: ["Biography", "Drama"] },
    { id: "sc3", user: FRIENDS[2], movieTitle: "Tenet", rating: 7.8, venue: "theater", thoughts: "Confusing but brilliant.", timestamp: Date.now() - 3600000 * 240, poster: "", year: "2020", genres: ["Sci-Fi", "Action"] },
  ],
  "f4": [ // Riley
    { id: "rc1", user: FRIENDS[3], movieTitle: "Poor Things", rating: 7.9, venue: "home", thoughts: "Weird, beautiful, unforgettable.", timestamp: Date.now() - 3600000 * 36, poster: "", year: "2023", genres: ["Comedy", "Drama"] },
    { id: "rc2", user: FRIENDS[3], movieTitle: "Everything Everywhere All at Once", rating: 8.7, venue: "theater", thoughts: "What did I just watch? Amazing.", timestamp: Date.now() - 3600000 * 200, poster: "", year: "2022", genres: ["Action", "Comedy"] },
  ],
};

// --- Rating Slider Component ---
function RatingSlider({ value, onChange, T }) {
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateValue = (clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const newVal = (x / rect.width) * 10;
    onChange(Math.round(newVal * 10) / 10);
  };

  const handleStart = (e) => {
    setIsDragging(true);
    const clientX = e.type.includes("mouse") ? e.clientX : e.touches[0].clientX;
    updateValue(clientX);
  };

  const handleMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const clientX = e.type.includes("mouse") ? e.clientX : e.touches[0].clientX;
    updateValue(clientX);
  };

  const handleEnd = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleMove);
      window.addEventListener("touchend", handleEnd);
      return () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleEnd);
        window.removeEventListener("touchmove", handleMove);
        window.removeEventListener("touchend", handleEnd);
      };
    }
  }, [isDragging]);

  const pct = (value / 10) * 100;
  const color = ratingColor(value);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.textSec }}>Rating</span>
        <span style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: -0.5 }}>{value.toFixed(1)}</span>
      </div>
      <div
        ref={trackRef}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        style={{ position: "relative", height: 44, background: T.bg, borderRadius: 12, cursor: "pointer", overflow: "hidden", border: `1.5px solid ${T.border}`, transition: "border-color 0.2s" }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color}22, ${color}44)`, transition: isDragging ? "none" : "width 0.15s ease-out" }} />
        <div style={{ position: "absolute", top: "50%", left: `${pct}%`, transform: "translate(-50%, -50%)", width: 32, height: 32, borderRadius: "50%", background: color, border: `3px solid ${T.card}`, boxShadow: `0 2px 8px ${color}66`, transition: isDragging ? "none" : "left 0.15s ease-out" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: T.textTer, fontWeight: 600 }}>
        <span>0</span><span>5</span><span>10</span>
      </div>
    </div>
  );
}

// --- Feed Item Component with animations ---
function FeedItem({ item, liked, onLike, comments, onAddComment, T, onMovieClick, onEdit, onUserClick }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [commentLikes, setCommentLikes] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const handleLike = () => {
    setIsLiking(true);
    setTimeout(() => setIsLiking(false), 300);
    onLike();
  };

  const handleComment = () => {
    if (commentText.trim()) {
      onAddComment(commentText, null);
      setCommentText("");
    }
  };

  const handleReply = (commentId) => {
    if (replyText.trim()) {
      onAddComment(replyText, commentId);
      setReplyText("");
      setReplyingTo(null);
    }
  };

  const toggleCommentLike = (commentId) => {
    setCommentLikes(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  return (
    <div style={{ background: T.card, borderRadius: 16, marginBottom: 14, border: `1px solid ${T.border}`, overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" }}>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div 
            onClick={() => onUserClick && onUserClick(item.user)}
            style={{ cursor: item.user.id !== "me" ? "pointer" : "default", transition: "transform 0.2s" }}
            onMouseEnter={e => item.user.id !== "me" && (e.currentTarget.style.transform = "scale(1.1)")}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            <Avatar user={item.user} size={36} />
          </div>
          <div style={{ flex: 1 }}>
            <div 
              onClick={() => onUserClick && item.user.id !== "me" && onUserClick(item.user)}
              style={{ 
                fontWeight: 700, 
                fontSize: 14, 
                color: T.text,
                cursor: item.user.id !== "me" ? "pointer" : "default",
                transition: "color 0.2s"
              }}
              onMouseEnter={e => item.user.id !== "me" && (e.currentTarget.style.color = T.accent)}
              onMouseLeave={e => e.currentTarget.style.color = T.text}
            >
              {item.user.name}
            </div>
            <div style={{ fontSize: 11, color: T.textTer, display: "flex", alignItems: "center", gap: 5 }}>
              {(() => { const V = VenueIcons[item.venue] || VenueIcons.other; return <V size={10} />; })()}
              {venueLabels[item.venue]} · {timeAgo(item.timestamp)}
            </div>
          </div>
        </div>

        {/* Movie Info */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div 
            onClick={() => onMovieClick && onMovieClick({ 
              id: item.id || Date.now(), 
              title: item.movieTitle, 
              year: item.year, 
              rating: item.rating, 
              poster: item.poster, 
              genres: item.genres, 
              overview: item.thoughts || "No overview available.",
              runtime: item.runtime 
            })}
            style={{ width: 64, height: 96, borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", transition: "transform 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            {item.poster ? <img src={item.poster} alt={item.movieTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <FilmIcon size={20} color={T.textTer} />}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div 
                onClick={() => onMovieClick && onMovieClick({ 
                  id: item.id || Date.now(), 
                  title: item.movieTitle, 
                  year: item.year, 
                  rating: item.rating, 
                  poster: item.poster, 
                  genres: item.genres, 
                  overview: item.thoughts || "No overview available.",
                  runtime: item.runtime 
                })}
                style={{ fontWeight: 800, fontSize: 16, color: T.text, letterSpacing: -0.3, flex: 1, paddingRight: 8, cursor: "pointer", transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color = T.accent}
                onMouseLeave={e => e.currentTarget.style.color = T.text}
              >
                {item.movieTitle}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: `${ratingColor(item.rating)}15`, padding: "5px 10px", borderRadius: 8, flexShrink: 0, border: `1px solid ${ratingColor(item.rating)}25` }}>
                <Star size={14} fill={ratingColor(item.rating)} color={ratingColor(item.rating)} />
                <span style={{ fontWeight: 800, fontSize: 15, color: ratingColor(item.rating) }}>{item.rating.toFixed(1)}</span>
              </div>
              {item.user.id === ME.id && onEdit && (
                <button
                  onClick={() => onEdit(item)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    color: T.textTer,
                    transition: "color 0.2s",
                    marginLeft: 4
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = T.accent}
                  onMouseLeave={e => e.currentTarget.style.color = T.textTer}
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {item.year && <div style={{ fontSize: 12, color: T.textTer }}>{item.year}</div>}
              {item.genres && item.genres.length > 0 && (
                <>
                  {item.year && <span style={{ fontSize: 12, color: T.textTer }}>·</span>}
                  <div style={{ fontSize: 11, color: T.textSec, fontWeight: 500 }}>
                    {item.genres.slice(0, 2).join(', ')}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {item.thoughts && (
          <div style={{ color: T.textSec, fontSize: 14, lineHeight: 1.5, marginBottom: 12, padding: "10px 12px", background: T.bg, borderRadius: 10 }}>
            "{item.thoughts}"
          </div>
        )}

        {item.watchedWith && item.watchedWith.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.textSec, marginBottom: 12 }}>
            <Users size={13} />
            Watched with {item.watchedWith.join(", ")}
          </div>
        )}

        {item.rewatch && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: T.accentLight, color: T.accent, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6, marginBottom: 10 }}>
            <RefreshCw size={11} /> Rewatch
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 16, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
          <button
            onClick={handleLike}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: liked ? T.coral : T.textTer,
              fontSize: 13,
              fontWeight: 600,
              padding: "6px 0",
              transition: "color 0.2s, transform 0.1s",
              transform: isLiking ? "scale(1.1)" : "scale(1)"
            }}
          >
            <Heart size={17} fill={liked ? T.coral : "none"} strokeWidth={liked ? 0 : 1.8} />
            {liked ? "Liked" : "Like"}
          </button>
          <button onClick={() => setShowComments(!showComments)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: showComments ? T.accent : T.textTer, fontSize: 13, fontWeight: 600, padding: "6px 0", transition: "color 0.2s" }}>
            <MessageCircle size={16} strokeWidth={1.8} />
            {comments.length > 0 ? `${comments.length}` : "Comment"}
          </button>
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "12px 16px", background: T.bg, animation: "slideDown 0.2s ease-out" }}>
          {comments.map(c => (
            <div key={c.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 9 }}>
                <Avatar user={c.user} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ background: T.card, padding: "10px 12px", borderRadius: 12, marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 12, color: T.text }}>{c.user.name}</span>
                      <span style={{ fontSize: 10, color: T.textTer }}>{timeAgo(c.timestamp)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>{c.text}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: 12 }}>
                    <button
                      onClick={() => toggleCommentLike(c.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        color: commentLikes[c.id] ? T.coral : T.textTer,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: 0,
                        transition: "color 0.2s"
                      }}
                    >
                      <Heart size={12} fill={commentLikes[c.id] ? T.coral : "none"} strokeWidth={commentLikes[c.id] ? 0 : 2} />
                      {commentLikes[c.id] ? "Liked" : "Like"}
                    </button>
                    <button
                      onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: replyingTo === c.id ? T.accent : T.textTer,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: 0,
                        transition: "color 0.2s"
                      }}
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Reply Input */}
              {replyingTo === c.id && (
                <div style={{ display: "flex", gap: 8, marginTop: 8, marginLeft: 37, animation: "fadeIn 0.2s" }}>
                  <input
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleReply(c.id)}
                    placeholder={`Reply to ${c.user.name}...`}
                    autoFocus
                    style={{ flex: 1, padding: "8px 12px", background: T.card, border: `1.5px solid ${T.borderMed}`, borderRadius: 10, fontSize: 12, color: T.text, outline: "none" }}
                  />
                  <button
                    onClick={() => handleReply(c.id)}
                    disabled={!replyText.trim()}
                    style={{
                      padding: "8px 12px",
                      background: replyText.trim() ? T.accent : T.border,
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      cursor: replyText.trim() ? "pointer" : "not-allowed",
                      fontWeight: 700,
                      fontSize: 11,
                      transition: "background 0.2s"
                    }}
                  >
                    <Send size={12} />
                  </button>
                </div>
              )}

              {/* Replies */}
              {c.replies && c.replies.length > 0 && (
                <div style={{ marginLeft: 37, marginTop: 8 }}>
                  {c.replies.map(reply => (
                    <div key={reply.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <Avatar user={reply.user} size={24} />
                      <div style={{ flex: 1 }}>
                        <div style={{ background: T.card, padding: "8px 10px", borderRadius: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                            <span style={{ fontWeight: 700, fontSize: 11, color: T.text }}>{reply.user.name}</span>
                            <span style={{ fontSize: 9, color: T.textTer }}>{timeAgo(reply.timestamp)}</span>
                          </div>
                          <div style={{ fontSize: 12, color: T.text, lineHeight: 1.4 }}>{reply.text}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Add Comment Input */}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleComment()}
              placeholder="Add a comment..."
              style={{ flex: 1, padding: "9px 12px", background: T.card, border: `1.5px solid ${T.borderMed}`, borderRadius: 10, fontSize: 13, color: T.text, outline: "none" }}
            />
            <button onClick={handleComment} disabled={!commentText.trim()} style={{ padding: "9px 14px", background: commentText.trim() ? T.accent : T.border, color: "#fff", border: "none", borderRadius: 10, cursor: commentText.trim() ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 12, transition: "background 0.2s" }}>
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Check-in Modal ---
function CheckinModal({ onClose, onSubmit, T, userCollections, onAddToCollection }) {
  const [step, setStep] = useState("search");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [rating, setRating] = useState(7.5);
  const [venue, setVenue] = useState("theater");
  const [thoughts, setThoughts] = useState("");
  const [rewatch, setRewatch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCollections, setSelectedCollections] = useState([]);

  // Live search with debounce
  useEffect(() => {
    const doSearch = async () => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      try {
        const results = await searchMovies(query);
        setSearchResults(results);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };

    const timeoutId = setTimeout(doSearch, 300); // Debounce 300ms
    return () => clearTimeout(timeoutId);
  }, [query]);

  const selectMovie = async (movie) => {
    // Fetch full details including cast & director
    setLoading(true);
    try {
      const fullDetails = await getMovieDetails(movie.tmdbId);
      setSelectedMovie(fullDetails || movie);
    } catch (e) {
      console.error(e);
      setSelectedMovie(movie);
    }
    setLoading(false);
    setStep("details");
  };

  const handleSubmit = () => {
    const checkin = {
      id: `ci-${Date.now()}`,
      user: ME,
      movieTitle: selectedMovie.title,
      year: selectedMovie.year,
      poster: selectedMovie.poster,
      genres: selectedMovie.genres || [],
      rating,
      venue,
      thoughts,
      rewatch,
      watchedWith: [],
      timestamp: Date.now(),
    };
    
    // Add to selected collections
    selectedCollections.forEach(collectionId => {
      onAddToCollection(selectedMovie, collectionId);
    });
    
    onSubmit(checkin);
    onClose();
  };

  const toggleCollection = (collectionId) => {
    setSelectedCollections(prev => 
      prev.includes(collectionId) 
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: T.overlay, zIndex: 100, display: "flex", alignItems: "flex-end", animation: "fadeIn 0.2s" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.card, width: "100%", maxWidth: 480, margin: "0 auto", borderRadius: "24px 24px 0 0", maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", animation: "slideUp 0.3s ease-out" }}>
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.card, position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: -0.3 }}>
            {step === "search" ? "Find a movie" : selectedMovie?.title}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, display: "flex", transition: "background 0.2s" }}>
            <X size={22} color={T.textSec} strokeWidth={2.2} />
          </button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
          {step === "search" && (
            <>
              <div style={{ marginBottom: 18 }}>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search for a movie..."
                  autoFocus
                  style={{ width: "100%", padding: "13px 16px", background: T.bg, border: `1.5px solid ${T.borderMed}`, borderRadius: 12, color: T.text, fontSize: 15, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {loading && query.trim() && (
                <div style={{ textAlign: "center", padding: 48, color: T.accent }}>
                  <div style={{ animation: "spin 1s linear infinite" }}><SpotlightIcon size={32} color={T.accent} /></div>
                  <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600 }}>Searching...</div>
                </div>
              )}

              {!loading && searchResults.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {searchResults.map((movie, i) => (
                    <div
                      key={movie.id || i}
                      onClick={() => selectMovie(movie)}
                      style={{ cursor: "pointer", transition: "transform 0.2s", borderRadius: 12, overflow: "hidden" }}
                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    >
                      <div style={{ aspectRatio: "2/3", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {movie.poster ? (
                          <img src={movie.poster} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <FilmIcon size={24} color={T.textTer} />
                        )}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{movie.title}</div>
                      <div style={{ fontSize: 10, color: T.textTer }}>{movie.year}</div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && query && searchResults.length === 0 && (
                <div style={{ textAlign: "center", padding: 48, color: T.textTer }}>
                  <SpotlightIcon size={36} color={T.borderMed} />
                  <div style={{ marginTop: 12, fontSize: 14 }}>No results found</div>
                </div>
              )}
            </>
          )}

          {step === "details" && selectedMovie && (
            <div style={{ animation: "fadeIn 0.3s" }}>
              {/* Movie Preview */}
              <div style={{ display: "flex", gap: 14, marginBottom: 24, padding: 16, background: T.bg, borderRadius: 14 }}>
                <div style={{ width: 80, height: 120, borderRadius: 10, background: T.card, border: `1px solid ${T.border}`, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {selectedMovie.poster ? (
                    <img src={selectedMovie.poster} alt={selectedMovie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <FilmIcon size={24} color={T.textTer} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 17, color: T.text, marginBottom: 4, letterSpacing: -0.3 }}>{selectedMovie.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    {selectedMovie.year && <div style={{ fontSize: 13, color: T.textTer }}>{selectedMovie.year}</div>}
                    {selectedMovie.genres && selectedMovie.genres.length > 0 && (
                      <>
                        {selectedMovie.year && <span style={{ fontSize: 13, color: T.textTer }}>·</span>}
                        <div style={{ fontSize: 12, color: T.textSec, fontWeight: 500 }}>
                          {selectedMovie.genres.slice(0, 2).join(', ')}
                        </div>
                      </>
                    )}
                  </div>
                  {selectedMovie.overview && (
                    <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", marginBottom: 8 }}>
                      {selectedMovie.overview}
                    </div>
                  )}
                  {selectedMovie.director && (
                    <div style={{ fontSize: 11, color: T.textTer, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>Director:</span> {selectedMovie.director}
                    </div>
                  )}
                  {selectedMovie.cast && selectedMovie.cast.length > 0 && (
                    <div style={{ fontSize: 11, color: T.textTer }}>
                      <span style={{ fontWeight: 600 }}>Cast:</span> {selectedMovie.cast.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              <RatingSlider value={rating} onChange={setRating} T={T} />

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 10 }}>Where did you watch?</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  {Object.entries(venueLabels).map(([key, label]) => {
                    const Icon = VenueIcons[key];
                    const isSelected = venue === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setVenue(key)}
                        style={{
                          padding: "14px 12px",
                          background: isSelected ? T.accentLight : T.bg,
                          border: `1.5px solid ${isSelected ? T.accent : T.border}`,
                          borderRadius: 12,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          color: isSelected ? T.accent : T.textSec,
                          fontWeight: isSelected ? 700 : 600,
                          fontSize: 13,
                          transition: "all 0.2s"
                        }}
                      >
                        <Icon size={16} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 10 }}>Your thoughts (optional)</div>
                <textarea
                  value={thoughts}
                  onChange={e => setThoughts(e.target.value)}
                  placeholder="What did you think?"
                  style={{ width: "100%", minHeight: 90, padding: "12px 14px", background: T.bg, border: `1.5px solid ${T.borderMed}`, borderRadius: 12, color: T.text, fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
                />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, cursor: "pointer", padding: "12px 14px", background: T.bg, borderRadius: 12, transition: "background 0.2s" }}>
                <input
                  type="checkbox"
                  checked={rewatch}
                  onChange={e => setRewatch(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: T.accent, cursor: "pointer" }}
                />
                <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>This was a rewatch</span>
              </label>

              {/* Collections Selection */}
              {userCollections && userCollections.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 10 }}>Add to Collections (Optional)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {userCollections.map(collection => (
                      <label
                        key={collection.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          cursor: "pointer",
                          padding: "10px 12px",
                          background: selectedCollections.includes(collection.id) ? T.accentLight : T.bg,
                          border: `1.5px solid ${selectedCollections.includes(collection.id) ? T.accent : T.border}`,
                          borderRadius: 10,
                          transition: "all 0.2s"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCollections.includes(collection.id)}
                          onChange={() => toggleCollection(collection.id)}
                          style={{ width: 16, height: 16, accentColor: T.accent, cursor: "pointer" }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: selectedCollections.includes(collection.id) ? T.accent : T.text }}>
                            {collection.name}
                          </div>
                          <div style={{ fontSize: 11, color: T.textTer, marginTop: 1 }}>
                            {collection.movieCount} movies · {collection.isPublic ? "Public" : "Private"}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
                <button onClick={() => setStep("search")} style={{ flex: 1, padding: "14px 20px", background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 12, color: T.text, fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "background 0.2s" }}>
                  Back
                </button>
                <button onClick={handleSubmit} style={{ flex: 2, padding: "14px 20px", background: T.accent, border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "transform 0.1s" }}>
                  Log Check-in
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Discover Tab with Sub-tabs ---
function DiscoverTab({ onCheckin, T, onMovieClick, userCheckins = [], userDMs = {}, onSendDM }) {
  const [subTab, setSubTab] = useState("movies");
  const [searchQuery, setSearchQuery] = useState("");
  const [movieResults, setMovieResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [following, setFollowing] = useState({});
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [showDM, setShowDM] = useState(null);
  const [collections, setCollections] = useState(MOCK_COLLECTIONS);
  const [showFriendProfile, setShowFriendProfile] = useState(null);

  // Live search for movies with debounce
  useEffect(() => {
    const doSearch = async () => {
      if (!searchQuery.trim()) {
        setMovieResults([]);
        setSearched(false);
        return;
      }
      setLoading(true);
      setSearched(true);
      try {
        const results = await searchMovies(searchQuery);
        setMovieResults(results);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };

    const timeoutId = setTimeout(doSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const toggleFollow = (userId) => {
    setFollowing(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const peopleResults = searchQuery.trim() 
    ? FRIENDS.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : FRIENDS;

  const collectionResults = searchQuery.trim()
    ? collections.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : collections;

  const subTabs = [
    { id: "movies", label: "Movies", icon: FilmIcon },
    { id: "people", label: "People", icon: Users },
    { id: "collections", label: "Collections", icon: ({ size }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
      </svg>
    )},
  ];

  // Movies Tab content
  const renderMoviesTab = () => {
    // Default genre sections when no search
    const genreSections = [
      { name: "Action & Adventure", movies: [3, 4, 6, 13].map(id => MOCK_MOVIES.find(m => m.id === id)).filter(Boolean) },
      { name: "Drama", movies: [1, 2, 5, 7, 10, 11].map(id => MOCK_MOVIES.find(m => m.id === id)).filter(Boolean).slice(0, 4) },
      { name: "Sci-Fi & Fantasy", movies: [3, 6, 9, 13].map(id => MOCK_MOVIES.find(m => m.id === id)).filter(Boolean) },
      { name: "Thriller & Crime", movies: [1, 4, 5, 7, 8, 12].map(id => MOCK_MOVIES.find(m => m.id === id)).filter(Boolean).slice(0, 4) },
      { name: "Recent Releases", movies: [8, 13, 14, 15].map(id => MOCK_MOVIES.find(m => m.id === id)).filter(Boolean) },
    ];

    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: 56, color: T.accent }}>
          <div style={{ animation: "spin 1s linear infinite", margin: "0 auto", width: "fit-content" }}><SpotlightIcon size={36} color={T.accent} /></div>
          <div style={{ marginTop: 14, fontSize: 15, fontWeight: 600 }}>Searching...</div>
        </div>
      );
    }

    if (searched && movieResults.length > 0) {
      return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, width: "100%", overflow: "hidden" }}>
          {movieResults.map((movie, i) => (
            <div
              key={movie.id || i}
              onClick={() => onMovieClick(movie)}
              style={{ cursor: "pointer", transition: "transform 0.2s, opacity 0.2s", animation: `fadeIn 0.4s ease-out ${i * 0.05}s backwards`, minWidth: 0 }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{ aspectRatio: "2/3", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", width: "100%" }}>
                {movie.poster ? (
                  <img src={movie.poster} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <FilmIcon size={28} color={T.textTer} />
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{movie.title}</div>
                <div style={{ fontSize: 11, color: T.textTer, display: "flex", alignItems: "center", gap: 4 }}>
                  {movie.year}
                  {movie.rating && (
                    <>
                      <span>·</span>
                      <Star size={10} fill={T.yellow} color={T.yellow} />
                      <span>{movie.rating}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (searched && movieResults.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: 56, color: T.textTer }}>
          <SpotlightIcon size={44} color={T.borderMed} strokeWidth={1.2} />
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 16 }}>No results found</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Try a different search</div>
        </div>
      );
    }

    // Default: Show genre sections
    return (
      <>
        {genreSections.map((section, sectionIndex) => (
          <div key={section.name} style={{ marginBottom: 28, animation: `fadeIn 0.4s ease-out ${sectionIndex * 0.1}s backwards` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: -0.3 }}>{section.name}</div>
              <button
                style={{
                  background: "none",
                  border: "none",
                  color: T.accent,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "4px 8px"
                }}
              >
                See all →
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, width: "100%", overflow: "hidden" }}>
              {section.movies.map((movie, i) => (
                <div
                  key={movie.id}
                  onClick={() => onMovieClick(movie)}
                  style={{ cursor: "pointer", transition: "transform 0.2s", minWidth: 0 }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                >
                  <div style={{ aspectRatio: "2/3", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", width: "100%" }}>
                    {movie.poster ? (
                      <img src={movie.poster} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <FilmIcon size={28} color={T.textTer} />
                    )}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{movie.title}</div>
                    <div style={{ fontSize: 11, color: T.textTer, display: "flex", alignItems: "center", gap: 4 }}>
                      {movie.year}
                      {movie.rating && (
                        <>
                          <span>·</span>
                          <Star size={10} fill={T.yellow} color={T.yellow} />
                          <span>{movie.rating}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <div>
      {/* Sub-tab Navigation */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: `1px solid ${T.border}`, paddingBottom: 2 }}>
        {subTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setSubTab(id); setSearchQuery(""); setSearched(false); }}
            style={{
              background: "none",
              border: "none",
              padding: "10px 16px",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              color: subTab === id ? T.accent : T.textSec,
              borderBottom: subTab === id ? `2px solid ${T.accent}` : "2px solid transparent",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={
            subTab === "movies" ? "Search movies..." :
            subTab === "people" ? "Find people..." :
            "Search collections..."
          }
          style={{ flex: 1, padding: "12px 16px", background: T.card, border: `1.5px solid ${T.borderMed}`, borderRadius: 12, color: T.text, fontSize: 15, outline: "none" }}
        />
        {subTab === "collections" && (
          <button onClick={() => setShowCreateCollection(true)} style={{ padding: "12px 20px", background: T.accent, border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> New
          </button>
        )}
      </div>

      {/* Movies Tab */}
      {subTab === "movies" && renderMoviesTab()}

      {/* People Tab */}
      {subTab === "people" && (
        <div>
          {peopleResults.map((person, i) => (
            <div
              key={person.id}
              onClick={() => setShowFriendProfile(person)}
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                padding: "14px 16px",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 12,
                animation: `fadeIn 0.3s ease-out ${i * 0.05}s backwards`,
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 4px 12px ${T.overlay}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <Avatar user={person} size={48} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 2 }}>{person.name}</div>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>{person.bio}</div>
                <div style={{ fontSize: 11, color: T.textTer, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{person.followers} followers</span>
                  <span>•</span>
                  <span>{person.mutualFriends} mutual</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }} onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setShowDM(person)}
                  style={{
                    padding: "8px 12px",
                    background: T.bg,
                    border: `1px solid ${T.border}`,
                    borderRadius: 10,
                    color: T.text,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                >
                  <Send size={14} />
                </button>
                <button
                  onClick={() => toggleFollow(person.id)}
                  style={{
                    padding: "8px 16px",
                    background: following[person.id] ? T.bg : T.accent,
                    border: following[person.id] ? `1px solid ${T.border}` : "none",
                    borderRadius: 10,
                    color: following[person.id] ? T.text : "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {following[person.id] ? "Following" : "Follow"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collections Tab */}
      {subTab === "collections" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {collectionResults.map((collection, i) => (
              <div
                key={collection.id}
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 14,
                  padding: 14,
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  animation: `fadeIn 0.3s ease-out ${i * 0.05}s backwards`
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ width: "100%", aspectRatio: "16/9", background: T.bg, borderRadius: 10, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.border}` }}>
                  <FilmIcon size={32} color={T.textTer} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 4 }}>{collection.name}</div>
                <div style={{ fontSize: 11, color: T.textTer, marginBottom: 8 }}>
                  {collection.movieCount} movies • {collection.followers} followers
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Avatar user={collection.creator} size={20} />
                  <span style={{ fontSize: 11, color: T.textSec, fontWeight: 600 }}>{collection.creator.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateCollection && (
        <CreateCollectionModal onClose={() => setShowCreateCollection(false)} onCreate={(col) => { setCollections(prev => [col, ...prev]); setShowCreateCollection(false); }} T={T} />
      )}

      {/* DM Modal */}
      {showDM && (
        <DMModal user={showDM} onClose={() => setShowDM(null)} T={T} userDMs={userDMs} onSendDM={onSendDM} />
      )}
      
      {/* Friend Profile Modal */}
      {showFriendProfile && (
        <FriendProfileModal
          friend={showFriendProfile}
          onClose={() => setShowFriendProfile(null)}
          onMovieClick={onMovieClick}
          userCheckins={userCheckins}
          T={T}
        />
      )}
    </div>
  );
}

// --- Create Collection Modal ---
function CreateCollectionModal({ onClose, onCreate, T }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const handleCreate = () => {
    if (!name.trim()) return;
    const newCollection = {
      id: `col-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      creator: ME,
      movieCount: 0,
      isPublic,
      followers: 0,
      thumbnail: "",
      movies: []
    };
    onCreate(newCollection);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: T.overlay, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.card, width: "90%", maxWidth: 420, borderRadius: 20, padding: "24px 24px 20px", animation: "slideUp 0.3s ease-out" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: -0.3 }}>Create Collection</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8 }}>
            <X size={22} color={T.textSec} strokeWidth={2.2} />
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 8, display: "block" }}>Collection Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Summer Night Vibes"
            autoFocus
            style={{ width: "100%", padding: "12px 14px", background: T.bg, border: `1.5px solid ${T.borderMed}`, borderRadius: 12, color: T.text, fontSize: 15, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 8, display: "block" }}>Description (Optional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What's this collection about?"
            style={{ width: "100%", minHeight: 70, padding: "12px 14px", background: T.bg, border: `1.5px solid ${T.borderMed}`, borderRadius: 12, color: T.text, fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 10, display: "block" }}>Privacy</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {[
              { value: true, label: "Public", desc: "Anyone can view" },
              { value: false, label: "Private", desc: "Only you" }
            ].map(option => (
              <button
                key={option.label}
                onClick={() => setIsPublic(option.value)}
                style={{
                  padding: "12px",
                  background: isPublic === option.value ? T.accentLight : T.bg,
                  border: `1.5px solid ${isPublic === option.value ? T.accent : T.border}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: isPublic === option.value ? T.accent : T.text, marginBottom: 2 }}>{option.label}</div>
                <div style={{ fontSize: 11, color: T.textTer }}>{option.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 12, color: T.text, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!name.trim()} style={{ flex: 1, padding: "12px", background: name.trim() ? T.accent : T.border, border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 14, cursor: name.trim() ? "pointer" : "not-allowed", opacity: name.trim() ? 1 : 0.6 }}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

// --- DM Modal ---
function DMModal({ user, onClose, T, userDMs = {}, onSendDM }) {
  const [message, setMessage] = useState("");
  
  // Get conversation with this user
  const conversation = userDMs[user.id] || [];

  const handleSend = () => {
    if (!message.trim()) return;
    
    const newMessage = {
      id: `msg-${Date.now()}`,
      text: message.trim(),
      from: "me",
      timestamp: Date.now()
    };
    
    if (onSendDM) {
      onSendDM(user.id, newMessage);
    }
    
    setMessage("");
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: T.overlay, zIndex: 100, display: "flex", alignItems: "flex-end", animation: "fadeIn 0.2s" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.card, width: "100%", maxWidth: 480, margin: "0 auto", borderRadius: "24px 24px 0 0", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", animation: "slideUp 0.3s ease-out" }}>
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar user={user} size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{user.name}</div>
            <div style={{ fontSize: 12, color: T.textTer }}>{user.bio}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
            <X size={22} color={T.textSec} strokeWidth={2.2} />
          </button>
        </div>

        <div style={{ flex: 1, padding: "20px", overflow: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
          {conversation.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: T.textTer }}>
              <div style={{ fontSize: 14, marginBottom: 8 }}>Start a conversation with {user.name}</div>
              <div style={{ fontSize: 12 }}>Share your thoughts or recommend a movie!</div>
            </div>
          ) : (
            conversation.map((msg, i) => (
              <div key={msg.id} style={{ display: "flex", justifyContent: msg.from === "me" ? "flex-end" : "flex-start", animation: `fadeIn 0.3s ease-out ${i * 0.05}s backwards` }}>
                <div style={{
                  maxWidth: "75%",
                  padding: "10px 14px",
                  borderRadius: 16,
                  background: msg.from === "me" ? T.accent : T.bg,
                  color: msg.from === "me" ? "#fff" : T.text,
                  fontSize: 14,
                  lineHeight: 1.4
                }}>
                  <div>{msg.text}</div>
                  <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: "16px 20px", borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              autoFocus
              style={{ flex: 1, padding: "12px 16px", background: T.bg, border: `1.5px solid ${T.borderMed}`, borderRadius: 12, color: T.text, fontSize: 14, outline: "none" }}
            />
            <button onClick={handleSend} disabled={!message.trim()} style={{ padding: "12px 18px", background: message.trim() ? T.accent : T.border, color: "#fff", border: "none", borderRadius: 12, cursor: message.trim() ? "pointer" : "not-allowed", fontWeight: 700 }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Friend Profile Modal ---
function FriendProfileModal({ friend, onClose, onMovieClick, T, userCheckins = [] }) {
  const [subTab, setSubTab] = useState("activity");
  
  // Get friend's check-ins
  const friendCheckins = FRIEND_CHECKINS[friend.id] || [];
  
  // Calculate movies in common
  const moviesInCommon = friendCheckins.filter(friendMovie => 
    userCheckins.some(userMovie => userMovie.movieTitle === friendMovie.movieTitle)
  );
  
  // Calculate stats
  const stats = {
    total: friendCheckins.length,
    avg: friendCheckins.length ? (friendCheckins.reduce((a, c) => a + c.rating, 0) / friendCheckins.length).toFixed(1) : "—",
    rewatches: friendCheckins.filter(c => c.rewatch).length,
    inCommon: moviesInCommon.length,
  };
  
  // Get genre stats
  const genreStats = friendCheckins.reduce((acc, ci) => {
    if (ci.genres) {
      ci.genres.forEach(g => {
        acc[g] = (acc[g] || 0) + 1;
      });
    }
    return acc;
  }, {});
  
  const topGenres = Object.entries(genreStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  const subTabs = [
    { id: "activity", label: "Activity" },
    { id: "inCommon", label: `In Common (${moviesInCommon.length})` },
    { id: "stats", label: "Stats" },
  ];
  
  return (
    <div style={{ position: "fixed", inset: 0, background: T.overlay, zIndex: 100, display: "flex", alignItems: "flex-end", animation: "fadeIn 0.2s" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.card, width: "100%", maxWidth: 480, margin: "0 auto", borderRadius: "24px 24px 0 0", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", animation: "slideUp 0.3s ease-out" }}>
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <Avatar user={friend} size={56} />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 2 }}>{friend.name}</div>
                  <div style={{ fontSize: 12, color: T.textTer }}>{friend.bio}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 13, color: T.textSec }}>
                <div><span style={{ fontWeight: 700, color: T.text }}>{friend.followers}</span> Followers</div>
                <div><span style={{ fontWeight: 700, color: T.text }}>{friend.following || 156}</span> Following</div>
                <div><span style={{ fontWeight: 700, color: T.text }}>{friend.mutualFriends}</span> Mutual</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
              <X size={22} color={T.textSec} strokeWidth={2.2} />
            </button>
          </div>
          
          {/* Stats Summary */}
          <div style={{ background: T.bg, borderRadius: 12, padding: 16, display: "flex", justifyContent: "space-around" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.accent }}>{stats.total}</div>
              <div style={{ fontSize: 11, color: T.textTer, fontWeight: 600 }}>Watched</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.text }}>{stats.avg}</div>
              <div style={{ fontSize: 11, color: T.textTer, fontWeight: 600 }}>Avg Rating</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.green }}>{stats.inCommon}</div>
              <div style={{ fontSize: 11, color: T.textTer, fontWeight: 600 }}>In Common</div>
            </div>
          </div>
        </div>
        
        {/* Sub-tabs */}
        <div style={{ display: "flex", gap: 8, padding: "0 20px", borderBottom: `1px solid ${T.border}` }}>
          {subTabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setSubTab(id)}
              style={{
                background: "none",
                border: "none",
                padding: "12px 16px",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                color: subTab === id ? T.accent : T.textSec,
                borderBottom: subTab === id ? `2px solid ${T.accent}` : "2px solid transparent",
                transition: "all 0.2s"
              }}
            >
              {label}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
          {subTab === "activity" && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Recent Check-ins</div>
              {friendCheckins.length === 0 ? (
                <div style={{ textAlign: "center", padding: 48, color: T.textTer }}>
                  <FilmIcon size={36} color={T.textTer} />
                  <div style={{ marginTop: 12, fontSize: 14 }}>No check-ins yet</div>
                </div>
              ) : (
                friendCheckins.map((ci, i) => (
                  <div key={ci.id} style={{ display: "flex", gap: 12, padding: "13px 0", borderBottom: `1px solid ${T.border}`, animation: `fadeIn 0.3s ease-out ${i * 0.05}s backwards` }}>
                    <div 
                      onClick={() => onMovieClick && onMovieClick({
                        id: ci.id,
                        title: ci.movieTitle,
                        year: ci.year,
                        rating: ci.rating,
                        poster: ci.poster,
                        genres: ci.genres,
                        overview: ci.thoughts || "No overview available."
                      })}
                      style={{ width: 38, height: 57, borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", transition: "transform 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    >
                      {ci.poster ? <img src={ci.poster} alt={ci.movieTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <FilmIcon size={14} color={T.textTer} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{ci.movieTitle}</div>
                          <div style={{ color: T.textTer, fontSize: 11, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                            {(() => { const V = VenueIcons[ci.venue] || VenueIcons.other; return <V size={10} />; })()}
                            {venueLabels[ci.venue]} · {timeAgo(ci.timestamp)}
                            {ci.rewatch && <span style={{ color: T.accent, fontWeight: 600 }}>· Rewatch</span>}
                          </div>
                        </div>
                        <span style={{ color: ratingColor(ci.rating), fontWeight: 800, fontSize: 15 }}>{ci.rating.toFixed(1)}</span>
                      </div>
                      {ci.thoughts && <div style={{ color: T.textSec, fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>{ci.thoughts}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          {subTab === "inCommon" && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Movies You've Both Watched</div>
              {moviesInCommon.length === 0 ? (
                <div style={{ textAlign: "center", padding: 48, color: T.textTer }}>
                  <FilmIcon size={36} color={T.textTer} />
                  <div style={{ marginTop: 12, fontSize: 14 }}>No movies in common yet</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Watch some of their favorites!</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {moviesInCommon.map((movie, i) => {
                    // Find user's rating for comparison
                    const userMovie = userCheckins.find(m => m.movieTitle === movie.movieTitle);
                    const ratingDiff = userMovie ? (userMovie.rating - movie.rating).toFixed(1) : null;
                    
                    return (
                      <div
                        key={movie.id}
                        onClick={() => onMovieClick(movie)}
                        style={{ cursor: "pointer", animation: `fadeIn 0.3s ease-out ${i * 0.05}s backwards` }}
                      >
                        <div style={{ position: "relative", aspectRatio: "2/3", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", transition: "transform 0.2s" }}
                          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
                          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                        >
                          {movie.poster ? (
                            <img src={movie.poster} alt={movie.movieTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <FilmIcon size={28} color={T.textTer} />
                            </div>
                          )}
                          {ratingDiff && (
                            <div style={{ 
                              position: "absolute", 
                              top: 6, 
                              right: 6, 
                              background: T.overlay, 
                              backdropFilter: "blur(8px)",
                              padding: "4px 8px",
                              borderRadius: 6,
                              fontSize: 10,
                              fontWeight: 700,
                              color: parseFloat(ratingDiff) > 0 ? T.green : parseFloat(ratingDiff) < 0 ? T.red : T.textTer
                            }}>
                              {parseFloat(ratingDiff) > 0 ? '+' : ''}{ratingDiff}
                            </div>
                          )}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {movie.movieTitle}
                        </div>
                        <div style={{ fontSize: 10, color: T.textTer, display: "flex", justifyContent: "space-between" }}>
                          <span>{friend.name}: {movie.rating.toFixed(1)}</span>
                          {userMovie && <span>You: {userMovie.rating.toFixed(1)}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {subTab === "stats" && (
            <div>
              {/* Top Genres */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Top Genres</div>
                {topGenres.length > 0 ? (
                  topGenres.map(([genre, count], i) => {
                    const percentage = (count / friendCheckins.length) * 100;
                    return (
                      <div key={genre} style={{ marginBottom: 12, animation: `fadeIn 0.3s ease-out ${i * 0.05}s backwards` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                          <span style={{ fontWeight: 600, color: T.text }}>{genre}</span>
                          <span style={{ color: T.textTer, fontSize: 12 }}>{count} movies ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div style={{ height: 8, background: T.bg, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}` }}>
                          <div style={{ height: "100%", width: `${percentage}%`, background: T.accent, borderRadius: 10, transition: "width 0.5s ease-out" }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ color: T.textTer, fontSize: 13 }}>No genre data yet</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Profile Tab with Sub-tabs ---
function ProfileTab({ checkins, stats, T, darkMode, userCollections, onMovieClick, onEditCheckin, onDeleteCheckin, onAddToCollection, onRemoveFromCollection, onEditCollection, onDeleteCollection, onEdit, userName, onEditName, ME, userDMs, onShowDM }) {
  const [subTab, setSubTab] = useState("overview");
  const [showFollowModal, setShowFollowModal] = useState(null); // 'following' or 'followers'
  const [showWatchedModal, setShowWatchedModal] = useState(false);
  const [filterGenre, setFilterGenre] = useState("all");
  const [filterVenue, setFilterVenue] = useState("all");
  const [sortBy, setSortBy] = useState("recent"); // 'recent', 'rating', 'title'
  const [sortReverse, setSortReverse] = useState(false); // Track if sort is reversed
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [editingCollection, setEditingCollection] = useState(null);
  
  const [savedCollections, setSavedCollections] = useState([
    MOCK_COLLECTIONS[0],
    MOCK_COLLECTIONS[2],
  ]);
  const [following, setFollowing] = useState([FRIENDS[0], FRIENDS[1], FRIENDS[2]]);
  const [followers, setFollowers] = useState([FRIENDS[1], FRIENDS[3], FRIENDS[4], FRIENDS[5]]);

  const genreStats = checkins.reduce((acc, ci) => {
    if (ci.genres) {
      ci.genres.forEach(g => {
        acc[g] = (acc[g] || 0) + 1;
      });
    }
    return acc;
  }, {});

  const topGenres = Object.entries(genreStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const venueStats = checkins.reduce((acc, ci) => {
    acc[ci.venue] = (acc[ci.venue] || 0) + 1;
    return acc;
  }, {});

  // Filtered and sorted checkins
  const getFilteredCheckins = () => {
    let filtered = [...checkins];
    
    // Genre filter
    if (filterGenre !== "all") {
      filtered = filtered.filter(c => c.genres && c.genres.includes(filterGenre));
    }
    
    // Venue filter
    if (filterVenue !== "all") {
      filtered = filtered.filter(c => c.venue === filterVenue);
    }
    
    // Sort
    if (sortBy === "recent") {
      filtered.sort((a, b) => sortReverse ? a.timestamp - b.timestamp : b.timestamp - a.timestamp);
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => sortReverse ? a.rating - b.rating : b.rating - a.rating);
    } else if (sortBy === "title") {
      filtered.sort((a, b) => {
        const result = a.movieTitle.localeCompare(b.movieTitle);
        return sortReverse ? -result : result;
      });
    }
    
    return filtered;
  };

  const handleSortClick = (newSort) => {
    if (sortBy === newSort) {
      // Same sort clicked - toggle reverse
      setSortReverse(!sortReverse);
    } else {
      // Different sort - set new sort and reset reverse
      setSortBy(newSort);
      setSortReverse(false);
    }
  };

  const allGenres = ["all", ...new Set(checkins.flatMap(c => c.genres || []))];

  const subTabs = [
    { id: "overview", label: "Overview", icon: Eye },
    { id: "collections", label: "Collections", icon: ({ size }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
      </svg>
    )},
    { id: "friends", label: "Friends", icon: Users },
    { id: "messages", label: "Messages", icon: MessageCircle },
  ];

  return (
    <>
    <div>
      {/* Profile Header */}
      <div style={{ textAlign: "center", padding: "28px 0 20px" }}>
        <Avatar user={ME} size={68} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 }}>
          <div style={{ fontSize: 21, fontWeight: 800, color: T.text, letterSpacing: -0.4 }}>{userName}</div>
          <button
            onClick={onEditName}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: T.textTer,
              display: "flex",
              alignItems: "center",
              transition: "color 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.color = T.accent}
            onMouseLeave={e => e.currentTarget.style.color = T.textTer}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
        <div style={{ color: T.textTer, fontSize: 12, marginTop: 2 }}>Movie lover since 2025</div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 12, fontSize: 13, color: T.textSec }}>
          <button
            onClick={() => setShowFollowModal("following")}
            style={{ background: "none", border: "none", cursor: "pointer", color: T.textSec, fontSize: 13, padding: 0 }}
          >
            <span style={{ fontWeight: 700, color: T.text }}>{following.length}</span> Following
          </button>
          <button
            onClick={() => setShowFollowModal("followers")}
            style={{ background: "none", border: "none", cursor: "pointer", color: T.textSec, fontSize: 13, padding: 0 }}
          >
            <span style={{ fontWeight: 700, color: T.text }}>{followers.length}</span> Followers
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{ background: T.card, borderRadius: 16, padding: "20px", marginBottom: 20, border: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: T.textTer, fontWeight: 600, marginBottom: 4 }}>Total Watched</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: T.text, letterSpacing: -0.8 }}>{stats.total}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, color: T.textTer, fontWeight: 600, marginBottom: 4 }}>Average Rating</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: T.accent, letterSpacing: -0.8 }}>{stats.avg}</div>
          </div>
        </div>
        <button
          onClick={() => setShowWatchedModal(true)}
          style={{
            width: "100%",
            padding: "14px 18px",
            background: T.accent,
            border: "none",
            borderRadius: 12,
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "transform 0.2s, box-shadow 0.2s"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(26, 158, 143, 0.3)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <Eye size={18} />
          What I've Seen
        </button>
      </div>

      {/* Sub-tab Navigation */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid ${T.border}`, paddingBottom: 2, overflowX: "auto" }}>
        {subTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            style={{
              background: "none",
              border: "none",
              padding: "10px 12px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              color: subTab === id ? T.accent : T.textSec,
              borderBottom: subTab === id ? `2px solid ${T.accent}` : "2px solid transparent",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 5,
              whiteSpace: "nowrap",
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {subTab === "overview" && (
        <div>
          <div style={{ color: T.text, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Recent Activity</div>
          {checkins.length === 0 ? (
            <div style={{ textAlign: "center", color: T.textTer, padding: 48, fontSize: 13, background: T.card, borderRadius: 16, border: `1px solid ${T.border}` }}>
              <ClapperIcon size={36} color={T.textTer} />
              <div style={{ marginTop: 12, fontWeight: 600 }}>No check-ins yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Start logging your movie journey!</div>
            </div>
          ) : (
            checkins.map((ci, i) => (
              <div key={ci.id} style={{ display: "flex", gap: 12, padding: "13px 0", borderBottom: `1px solid ${T.border}`, animation: `fadeIn 0.3s ease-out ${i * 0.05}s backwards` }}>
                <div 
                  onClick={() => onMovieClick && onMovieClick({
                    id: ci.id,
                    title: ci.movieTitle,
                    year: ci.year,
                    rating: ci.rating,
                    poster: ci.poster,
                    genres: ci.genres,
                    overview: ci.thoughts || "No overview available.",
                    runtime: ci.runtime
                  })}
                  style={{ width: 38, height: 57, borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", transition: "transform 0.2s", flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  {ci.poster ? <img src={ci.poster} alt={ci.movieTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <FilmIcon size={14} color={T.textTer} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{ci.movieTitle}</div>
                      <div style={{ color: T.textTer, fontSize: 11, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        {(() => { const V = VenueIcons[ci.venue] || VenueIcons.other; return <V size={10} />; })()}
                        {venueLabels[ci.venue]} · {timeAgo(ci.timestamp)}
                        {ci.rewatch && <span style={{ color: T.accent, fontWeight: 600 }}>· Rewatch</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: ratingColor(ci.rating), fontWeight: 800, fontSize: 15 }}>{ci.rating.toFixed(1)}</span>
                      <button
                        onClick={() => onEdit(ci)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 4,
                          color: T.textTer,
                          transition: "color 0.2s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = T.accent}
                        onMouseLeave={e => e.currentTarget.style.color = T.textTer}
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {ci.thoughts && <div style={{ color: T.textSec, fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>{ci.thoughts}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Collections Tab */}
      {subTab === "collections" && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: T.text, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>My Collections</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {userCollections.map((collection, i) => (
                <div
                  key={collection.id}
                  onClick={() => setSelectedCollection(collection)}
                  style={{
                    background: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: 14,
                    padding: 14,
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    animation: `fadeIn 0.3s ease-out ${i * 0.05}s backwards`
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                >
                  <div style={{ width: "100%", aspectRatio: "16/9", background: T.bg, borderRadius: 10, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.border}` }}>
                    <FilmIcon size={32} color={T.textTer} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 4 }}>{collection.name}</div>
                  <div style={{ fontSize: 11, color: T.textTer, marginBottom: 6 }}>
                    {collection.movieCount} movies
                  </div>
                  <div style={{ display: "inline-block", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: collection.isPublic ? T.accentLight : T.bg, color: collection.isPublic ? T.accent : T.textTer, border: `1px solid ${collection.isPublic ? T.accent + "30" : T.border}` }}>
                    {collection.isPublic ? "Public" : "Private"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ color: T.text, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Saved Collections</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {savedCollections.map((collection, i) => (
                <div
                  key={collection.id}
                  style={{
                    background: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: 14,
                    padding: 14,
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    animation: `fadeIn 0.3s ease-out ${i * 0.05}s backwards`
                  }}
                >
                  <div style={{ width: "100%", aspectRatio: "16/9", background: T.bg, borderRadius: 10, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.border}` }}>
                    <FilmIcon size={32} color={T.textTer} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 4 }}>{collection.name}</div>
                  <div style={{ fontSize: 11, color: T.textTer, marginBottom: 8 }}>
                    {collection.movieCount} movies • {collection.followers} followers
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Avatar user={collection.creator} size={18} />
                    <span style={{ fontSize: 11, color: T.textSec, fontWeight: 600 }}>{collection.creator.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Friends Tab */}
      {subTab === "friends" && (
        <div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ color: T.text, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Following ({following.length})</div>
            {following.map((friend, i) => (
              <div
                key={friend.id}
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  animation: `fadeIn 0.3s ease-out ${i * 0.05}s backwards`
                }}
              >
                <Avatar user={friend} size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 2 }}>{friend.name}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{friend.bio}</div>
                </div>
                <button
                  style={{
                    padding: "7px 14px",
                    background: T.bg,
                    border: `1px solid ${T.border}`,
                    borderRadius: 10,
                    color: T.text,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Following
                </button>
              </div>
            ))}
          </div>

          <div>
            <div style={{ color: T.text, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Followers ({followers.length})</div>
            {followers.map((friend, i) => (
              <div
                key={friend.id}
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  animation: `fadeIn 0.3s ease-out ${i * 0.05}s backwards`
                }}
              >
                <Avatar user={friend} size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 2 }}>{friend.name}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{friend.bio}</div>
                </div>
                <button
                  style={{
                    padding: "7px 14px",
                    background: T.accent,
                    border: "none",
                    borderRadius: 10,
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Follow Back
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages Tab */}
      {subTab === "messages" && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Your Conversations</div>
          {Object.keys(userDMs || {}).length === 0 ? (
            <div style={{ textAlign: "center", padding: 56, color: T.textTer }}>
              <MessageCircle size={44} color={T.borderMed} strokeWidth={1.2} />
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 16 }}>No messages yet</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Start a conversation with friends!</div>
            </div>
          ) : (
            Object.entries(userDMs).map(([friendId, messages]) => {
              const friend = FRIENDS.find(f => f.id === friendId);
              if (!friend) return null;
              
              const lastMessage = messages[messages.length - 1];
              
              return (
                <div
                  key={friendId}
                  onClick={() => onShowDM && onShowDM(friend)}
                  style={{
                    background: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: 12,
                    padding: "12px 14px",
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 4px 12px ${T.overlay}`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <Avatar user={friend} size={48} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 2 }}>{friend.name}</div>
                    <div style={{ fontSize: 12, color: T.textTer, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {lastMessage.text}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: T.textTer, whiteSpace: "nowrap" }}>
                    {new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Stats Tab */}
      {subTab === "stats" && (
        <div>
          {checkins.length === 0 ? (
            <div style={{ textAlign: "center", padding: 56, color: T.textTer }}>
              <TrendingUp size={44} color={T.borderMed} />
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 16 }}>No stats yet</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Start watching movies to see insights!</div>
            </div>
          ) : (
            <>
              {/* Top Genres */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ color: T.text, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Top Genres</div>
                {topGenres.length > 0 ? (
                  topGenres.map(([genre, count], i) => {
                    const percentage = (count / checkins.length) * 100;
                    return (
                      <div key={genre} style={{ marginBottom: 12, animation: `fadeIn 0.3s ease-out ${i * 0.05}s backwards` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                          <span style={{ fontWeight: 600, color: T.text }}>{genre}</span>
                          <span style={{ color: T.textTer, fontSize: 12 }}>{count} movies ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div style={{ height: 8, background: T.bg, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}` }}>
                          <div style={{ height: "100%", width: `${percentage}%`, background: T.accent, borderRadius: 10, transition: "width 0.5s ease-out" }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ color: T.textTer, fontSize: 13 }}>No genre data yet</div>
                )}
              </div>

              {/* Viewing Habits */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ color: T.text, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Viewing Habits</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                  {Object.entries(venueStats).map(([venue, count]) => (
                    <div
                      key={venue}
                      style={{
                        background: T.card,
                        border: `1px solid ${T.border}`,
                        borderRadius: 12,
                        padding: "16px 14px",
                        textAlign: "center"
                      }}
                    >
                      <div style={{ fontSize: 24, fontWeight: 800, color: T.accent, marginBottom: 6 }}>{count}</div>
                      <div style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>{venueLabels[venue]}</div>
                      <div style={{ fontSize: 10, color: T.textTer, marginTop: 2 }}>
                        {((count / checkins.length) * 100).toFixed(0)}% of total
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rating Distribution */}
              <div>
                <div style={{ color: T.text, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Rating Distribution</div>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: 120, gap: 6 }}>
                    {[
                      { range: "0-2", count: checkins.filter(c => c.rating < 2).length },
                      { range: "2-4", count: checkins.filter(c => c.rating >= 2 && c.rating < 4).length },
                      { range: "4-6", count: checkins.filter(c => c.rating >= 4 && c.rating < 6).length },
                      { range: "6-8", count: checkins.filter(c => c.rating >= 6 && c.rating < 8).length },
                      { range: "8-10", count: checkins.filter(c => c.rating >= 8).length },
                    ].map(({ range, count }) => {
                      const height = checkins.length > 0 ? (count / checkins.length) * 100 : 0;
                      return (
                        <div key={range} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{count}</div>
                          <div
                            style={{
                              width: "100%",
                              height: `${Math.max(height, 5)}%`,
                              background: T.accent,
                              borderRadius: "6px 6px 0 0",
                              transition: "height 0.5s ease-out"
                            }}
                          />
                          <div style={{ fontSize: 10, color: T.textTer, fontWeight: 600 }}>{range}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>

    {/* Following/Followers Modal */}
    {showFollowModal && (
      <div style={{ position: "fixed", inset: 0, background: T.overlay, zIndex: 100, display: "flex", alignItems: "flex-end", animation: "fadeIn 0.2s" }} onClick={() => setShowFollowModal(null)}>
        <div onClick={e => e.stopPropagation()} style={{ background: T.card, width: "100%", maxWidth: 480, margin: "0 auto", borderRadius: "24px 24px 0 0", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", animation: "slideUp 0.3s ease-out" }}>
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>
              {showFollowModal === "following" ? `Following (${following.length})` : `Followers (${followers.length})`}
            </div>
            <button onClick={() => setShowFollowModal(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
              <X size={22} color={T.textSec} strokeWidth={2.2} />
            </button>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
            {(showFollowModal === "following" ? following : followers).map((friend, i) => (
              <div
                key={friend.id}
                style={{
                  background: T.bg,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  animation: `fadeIn 0.3s ease-out ${i * 0.05}s backwards`
                }}
              >
                <Avatar user={friend} size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 2 }}>{friend.name}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{friend.bio}</div>
                </div>
                <button
                  style={{
                    padding: "7px 14px",
                    background: showFollowModal === "following" ? T.bg : T.accent,
                    border: showFollowModal === "following" ? `1px solid ${T.border}` : "none",
                    borderRadius: 10,
                    color: showFollowModal === "following" ? T.text : "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {showFollowModal === "following" ? "Following" : "Follow"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* Watched Movies Modal with Filters */}
    {showWatchedModal && (
      <div style={{ position: "fixed", inset: 0, background: T.overlay, zIndex: 100, display: "flex", alignItems: "flex-end", animation: "fadeIn 0.2s" }} onClick={() => { setShowWatchedModal(false); setFilterGenre("all"); setFilterVenue("all"); setSortReverse(false); }}>
        <div onClick={e => e.stopPropagation()} style={{ background: T.card, width: "100%", maxWidth: 480, margin: "0 auto", borderRadius: "24px 24px 0 0", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", animation: "slideUp 0.3s ease-out" }}>
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>
                  What I've Seen
                </div>
                <div style={{ fontSize: 12, color: T.textTer, marginTop: 2 }}>
                  {getFilteredCheckins().length} movies
                  {getFilteredCheckins().length > 0 && (
                    <> · Avg: <span style={{ color: T.accent, fontWeight: 700 }}>
                      {(getFilteredCheckins().reduce((sum, c) => sum + c.rating, 0) / getFilteredCheckins().length).toFixed(1)}
                    </span></>
                  )}
                </div>
              </div>
              <button onClick={() => { setShowWatchedModal(false); setFilterGenre("all"); setFilterVenue("all"); setSortReverse(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
                <X size={22} color={T.textSec} strokeWidth={2.2} />
              </button>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <select
                value={filterGenre}
                onChange={e => setFilterGenre(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: T.bg,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  color: T.text,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="all">All Genres</option>
                {allGenres.filter(g => g !== "all").map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
              <select
                value={filterVenue}
                onChange={e => setFilterVenue(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: T.bg,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  color: T.text,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="all">All Venues</option>
                <option value="theater">Theater</option>
                <option value="home">At Home</option>
                <option value="flight">In-Flight</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {[
                { id: "recent", label: "Recent", icon: "↓" },
                { id: "rating", label: "Rating", icon: "★" },
                { id: "title", label: "A-Z", icon: "→" }
              ].map(sort => (
                <button
                  key={sort.id}
                  onClick={() => handleSortClick(sort.id)}
                  style={{
                    padding: "6px 12px",
                    background: sortBy === sort.id ? T.accentLight : T.bg,
                    border: `1px solid ${sortBy === sort.id ? T.accent : T.border}`,
                    borderRadius: 8,
                    color: sortBy === sort.id ? T.accent : T.textSec,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    transition: "all 0.2s"
                  }}
                >
                  {sort.label}
                  {sortBy === sort.id && (
                    <span style={{ fontSize: 10, transform: sortReverse ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                      {sort.id === "title" ? (sortReverse ? "←" : "→") : (sortReverse ? "↑" : "↓")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
            {getFilteredCheckins().length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: T.textTer }}>
                <FilmIcon size={36} color={T.textTer} />
                <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600 }}>No movies found</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your filters</div>
              </div>
            ) : (
              getFilteredCheckins().map((ci, i) => (
                <div key={ci.id} style={{ display: "flex", gap: 12, padding: "13px 0", borderBottom: `1px solid ${T.border}`, animation: `fadeIn 0.3s ease-out ${i * 0.03}s backwards` }}>
                  <div 
                    onClick={() => onMovieClick && onMovieClick({
                      id: ci.id,
                      title: ci.movieTitle,
                      year: ci.year,
                      rating: ci.rating,
                      poster: ci.poster,
                      genres: ci.genres,
                      overview: ci.thoughts || "No overview available.",
                      runtime: ci.runtime
                    })}
                    style={{ width: 38, height: 57, borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", transition: "transform 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                  >
                    {ci.poster ? <img src={ci.poster} alt={ci.movieTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <FilmIcon size={14} color={T.textTer} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{ci.movieTitle}</div>
                      <span style={{ color: ratingColor(ci.rating), fontWeight: 800, fontSize: 15 }}>{ci.rating.toFixed(1)}</span>
                    </div>
                    <div style={{ color: T.textTer, fontSize: 11, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                      {(() => { const V = VenueIcons[ci.venue] || VenueIcons.other; return <V size={10} />; })()}
                      {venueLabels[ci.venue]} · {timeAgo(ci.timestamp)}
                      {ci.rewatch && <span style={{ color: T.accent, fontWeight: 600 }}>· Rewatch</span>}
                    </div>
                    {ci.genres && ci.genres.length > 0 && (
                      <div style={{ fontSize: 10, color: T.textTer, marginTop: 3 }}>{ci.genres.slice(0, 2).join(", ")}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )}

    {/* Collection Detail Modal */}
    {selectedCollection && (
      <CollectionDetailModal
        collection={selectedCollection}
        onClose={() => setSelectedCollection(null)}
        onEdit={() => {
          setEditingCollection(selectedCollection);
          setSelectedCollection(null);
        }}
        onDelete={onDeleteCollection}
        onRemoveMovie={onRemoveFromCollection}
        onMovieClick={onMovieClick}
        T={T}
      />
    )}

    {/* Edit Collection Modal */}
    {editingCollection && (
      <EditCollectionModal
        collection={editingCollection}
        onClose={() => setEditingCollection(null)}
        onSave={(updated) => {
          onEditCollection(updated);
          setEditingCollection(null);
        }}
        T={T}
      />
    )}
    </>
  );
}

// --- Collection Detail Modal ---
function CollectionDetailModal({ collection, onClose, onEdit, onDelete, onRemoveMovie, T, onMovieClick }) {
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${collection.name}"? This cannot be undone.`)) {
      onDelete(collection.id);
      onClose();
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: T.overlay, zIndex: 100, display: "flex", alignItems: "flex-end", animation: "fadeIn 0.2s" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.card, width: "100%", maxWidth: 480, margin: "0 auto", borderRadius: "24px 24px 0 0", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", animation: "slideUp 0.3s ease-out" }}>
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ flex: 1, paddingRight: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 4 }}>{collection.name}</div>
              <div style={{ fontSize: 12, color: T.textTer }}>
                {collection.movieCount} movies · {collection.isPublic ? "Public" : "Private"}
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
              <X size={22} color={T.textSec} strokeWidth={2.2} />
            </button>
          </div>
          
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onEdit}
              style={{
                flex: 1,
                padding: "10px 16px",
                background: T.bg,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                color: T.text,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
            <button
              onClick={handleDelete}
              style={{
                padding: "10px 16px",
                background: T.card,
                border: `2px solid ${T.red}`,
                borderRadius: 10,
                color: T.red,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Delete
            </button>
          </div>
        </div>

        {/* Movies Grid */}
        <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
          {collection.movies.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: T.textTer }}>
              <FilmIcon size={36} color={T.textTer} />
              <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600 }}>No movies yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Add movies from Discover or check-ins</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {collection.movies.map((movie, i) => (
                <div key={movie.id} style={{ animation: `fadeIn 0.3s ease-out ${i * 0.05}s backwards` }}>
                  <div
                    onClick={() => onMovieClick(movie)}
                    style={{ position: "relative", aspectRatio: "2/3", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    {movie.poster ? (
                      <img src={movie.poster} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FilmIcon size={28} color={T.textTer} />
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Remove "${movie.title}" from this collection?`)) {
                          onRemoveMovie(movie.id, collection.id);
                        }
                      }}
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        background: T.overlay,
                        backdropFilter: "blur(8px)",
                        border: "none",
                        borderRadius: 6,
                        padding: 6,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <X size={14} color="#fff" strokeWidth={2.5} />
                    </button>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {movie.title}
                  </div>
                  <div style={{ fontSize: 10, color: T.textTer }}>{movie.year}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Edit Collection Modal ---
function EditCollectionModal({ collection, onClose, onSave, T }) {
  const [name, setName] = useState(collection.name);
  const [isPublic, setIsPublic] = useState(collection.isPublic);

  const handleSave = () => {
    if (!name.trim()) {
      alert("Collection name is required");
      return;
    }
    onSave({
      ...collection,
      name: name.trim(),
      isPublic
    });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: T.overlay, zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.card, width: "90%", maxWidth: 420, borderRadius: 20, padding: "24px 24px 20px", animation: "slideUp 0.3s ease-out" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 20 }}>Edit Collection</div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 8 }}>Name</div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Collection name"
            style={{ width: "100%", padding: "12px 14px", background: T.bg, border: `1.5px solid ${T.borderMed}`, borderRadius: 12, color: T.text, fontSize: 15, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 10 }}>Privacy</div>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { value: true, label: "Public", desc: "Anyone can view" },
              { value: false, label: "Private", desc: "Only you" }
            ].map(option => (
              <button
                key={option.value.toString()}
                onClick={() => setIsPublic(option.value)}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  background: isPublic === option.value ? T.accentLight : T.bg,
                  border: `1.5px solid ${isPublic === option.value ? T.accent : T.border}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: isPublic === option.value ? T.accent : T.text, marginBottom: 2 }}>
                  {option.label}
                </div>
                <div style={{ fontSize: 11, color: T.textTer }}>{option.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "14px 20px", background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 12, color: T.text, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{ flex: 1, padding: "14px 20px", background: T.accent, border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Edit Check-in Modal ---
function EditCheckinModal({ checkin, onClose, onSave, onDelete, T, userCollections, onAddToCollection, onRemoveFromCollection }) {
  const [rating, setRating] = useState(checkin.rating);
  const [venue, setVenue] = useState(checkin.venue);
  const [thoughts, setThoughts] = useState(checkin.thoughts || "");
  const [rewatch, setRewatch] = useState(checkin.rewatch || false);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    const updated = {
      ...checkin,
      rating,
      venue,
      thoughts,
      rewatch,
      editedAt: Date.now()
    };
    onSave(updated);
    onClose();
  };

  const handleDelete = () => {
    onDelete(checkin.id);
    onClose();
  };

  const movieObj = {
    id: checkin.id,
    title: checkin.movieTitle,
    year: checkin.year,
    rating: checkin.rating,
    poster: checkin.poster,
    genres: checkin.genres,
    overview: checkin.thoughts,
    runtime: checkin.runtime
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: T.overlay, zIndex: 100, display: "flex", alignItems: "flex-end", animation: "fadeIn 0.2s" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.card, width: "100%", maxWidth: 480, margin: "0 auto", borderRadius: "24px 24px 0 0", maxHeight: "85vh", display: "flex", flexDirection: "column", animation: "slideUp 0.3s ease-out" }}>
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>Edit Check-in</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
            <X size={22} color={T.textSec} strokeWidth={2.2} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
          {/* Movie Info */}
          <div style={{ display: "flex", gap: 14, marginBottom: 24, padding: 16, background: T.bg, borderRadius: 14 }}>
            <div style={{ width: 60, height: 90, borderRadius: 10, background: T.card, border: `1px solid ${T.border}`, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {checkin.poster ? (
                <img src={checkin.poster} alt={checkin.movieTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <FilmIcon size={20} color={T.textTer} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 4 }}>{checkin.movieTitle}</div>
              {checkin.year && <div style={{ fontSize: 12, color: T.textTer }}>{checkin.year}</div>}
            </div>
          </div>

          <RatingSlider value={rating} onChange={setRating} T={T} />

          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 10 }}>Where did you watch?</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {Object.entries(venueLabels).map(([key, label]) => {
                const Icon = VenueIcons[key];
                const isSelected = venue === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setVenue(key)}
                    style={{
                      padding: "14px 12px",
                      background: isSelected ? T.accentLight : T.bg,
                      border: `1.5px solid ${isSelected ? T.accent : T.border}`,
                      borderRadius: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      color: isSelected ? T.accent : T.textSec,
                      fontWeight: isSelected ? 700 : 600,
                      fontSize: 13,
                      transition: "all 0.2s"
                    }}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 10 }}>Your thoughts</div>
            <textarea
              value={thoughts}
              onChange={e => setThoughts(e.target.value)}
              placeholder="What did you think?"
              style={{ width: "100%", minHeight: 90, padding: "12px 14px", background: T.bg, border: `1.5px solid ${T.borderMed}`, borderRadius: 12, color: T.text, fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box" }}
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, cursor: "pointer", padding: "12px 14px", background: T.bg, borderRadius: 12 }}>
            <input
              type="checkbox"
              checked={rewatch}
              onChange={e => setRewatch(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: T.accent, cursor: "pointer" }}
            />
            <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>This was a rewatch</span>
          </label>

          {/* Collections Management */}
          {userCollections && userCollections.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 10 }}>Collections</div>
              {userCollections.filter(col => col.movies.some(m => m.id === checkin.id)).length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  {userCollections.filter(col => col.movies.some(m => m.id === checkin.id)).map(col => (
                    <div key={col.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: T.bg, borderRadius: 10, marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{col.name}</div>
                        <div style={{ fontSize: 11, color: T.textTer }}>{col.movieCount} movies</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveFromCollection(checkin.id, col.id)}
                        style={{ padding: "6px 12px", background: "none", border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSec, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowCollectionPicker(!showCollectionPicker)}
                style={{ width: "100%", padding: "10px", background: T.accent, border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Plus size={14} />
                Add to Collection
              </button>
              
              {showCollectionPicker && (
                <div style={{ background: T.bg, borderRadius: 12, padding: 12, marginTop: 12, animation: "fadeIn 0.2s" }}>
                  {userCollections.filter(col => !col.movies.some(m => m.id === checkin.id)).length === 0 ? (
                    <div style={{ fontSize: 12, color: T.textTer, textAlign: "center", padding: 12 }}>Already in all your collections!</div>
                  ) : (
                    userCollections.filter(col => !col.movies.some(m => m.id === checkin.id)).map(col => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => {
                          onAddToCollection(movieObj, col.id);
                          setShowCollectionPicker(false);
                        }}
                        style={{ width: "100%", textAlign: "left", padding: "10px 12px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, marginBottom: 8, cursor: "pointer" }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{col.name}</div>
                        <div style={{ fontSize: 11, color: T.textTer }}>{col.movieCount} movies · {col.isPublic ? "Public" : "Private"}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "16px 20px", background: T.card }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                flex: 1,
                padding: "14px 20px",
                background: T.card,
                border: `2px solid ${T.red}`,
                borderRadius: 12,
                color: T.red,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer"
              }}
            >
              Delete
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                flex: 2,
                padding: "14px 20px",
                background: T.accent,
                border: "none",
                borderRadius: 12,
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                transition: "transform 0.1s"
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
        
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div style={{ position: "fixed", inset: 0, background: T.overlay, zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s" }} onClick={() => setShowDeleteConfirm(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: T.card, width: "90%", maxWidth: 360, borderRadius: 20, padding: "24px", animation: "slideUp 0.3s ease-out" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 12 }}>Delete Check-in?</div>
              <div style={{ fontSize: 14, color: T.textSec, marginBottom: 24, lineHeight: 1.5 }}>
                Are you sure you want to delete this check-in for <span style={{ fontWeight: 700, color: T.text }}>"{checkin.movieTitle}"</span>? This action cannot be undone.
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{ flex: 1, padding: "12px 20px", background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 12, color: T.text, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  style={{ flex: 1, padding: "12px 20px", background: T.red, border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Movie Detail Modal ---
function MovieDetailModal({ movie, onClose, userCollections, onAddToCollection, onRemoveFromCollection, T, checkins, onShare }) {
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [showWatchHistory, setShowWatchHistory] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Find all check-ins for this movie
  const movieCheckins = checkins ? checkins.filter(c => 
    c.movieTitle === movie.title || c.id === movie.id
  ).sort((a, b) => b.timestamp - a.timestamp) : [];

  const totalWatches = movieCheckins.length;
  const rewatches = movieCheckins.filter(c => c.rewatch).length;
  const avgRating = movieCheckins.length > 0 
    ? (movieCheckins.reduce((sum, c) => sum + c.rating, 0) / movieCheckins.length).toFixed(1)
    : null;

  if (!movie) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: T.overlay, zIndex: 100, display: "flex", alignItems: "flex-end", animation: "fadeIn 0.2s" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.card, width: "100%", maxWidth: 480, margin: "0 auto", borderRadius: "24px 24px 0 0", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", animation: "slideUp 0.3s ease-out" }}>
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1, paddingRight: 12 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 4, letterSpacing: -0.4 }}>{movie.title}</div>
            <div style={{ fontSize: 13, color: T.textTer }}>{movie.year}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button 
              onClick={() => setShowShareModal(true)} 
              style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: T.text, fontSize: 13, fontWeight: 600, transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = T.cardHover}
              onMouseLeave={e => e.currentTarget.style.background = T.bg}
            >
              <Send size={16} />
              Share
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
              <X size={22} color={T.textSec} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
          {/* Poster & Rating */}
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div style={{ width: 100, height: 150, borderRadius: 12, background: T.bg, border: `1px solid ${T.border}`, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {movie.poster ? (
                <img src={movie.poster} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <FilmIcon size={32} color={T.textTer} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.textTer, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>TMDB Rating</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Star size={20} fill={T.yellow} color={T.yellow} />
                  <span style={{ fontSize: 24, fontWeight: 800, color: T.text }}>{movie.rating}</span>
                  <span style={{ fontSize: 13, color: T.textTer }}>/10</span>
                </div>
              </div>
              {movie.genres && movie.genres.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {movie.genres.map(genre => (
                    <span key={genre} style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", background: T.accentLight, color: T.accent, borderRadius: 6 }}>
                      {genre}
                    </span>
                  ))}
                </div>
              )}
              {movie.runtime && (
                <div style={{ fontSize: 12, color: T.textSec, display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                  <Clock size={12} />
                  {movie.runtime} min
                </div>
              )}
              {/* Streaming Info */}
              {(movie.streamingOn?.length > 0 || movie.rentOn?.length > 0 || movie.buyOn?.length > 0) && (
                <div style={{ marginTop: 8, padding: "8px 10px", background: T.bg, borderRadius: 8, fontSize: 11 }}>
                  {movie.streamingOn && movie.streamingOn.length > 0 && (
                    <div style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: T.text }}>Stream: </span>
                      <span style={{ color: T.textSec }}>{movie.streamingOn.join(', ')}</span>
                    </div>
                  )}
                  {movie.rentOn && movie.rentOn.length > 0 && (
                    <div style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: T.text }}>Rent: </span>
                      <span style={{ color: T.textSec }}>{movie.rentOn.slice(0, 3).join(', ')}</span>
                    </div>
                  )}
                  {movie.buyOn && movie.buyOn.length > 0 && (
                    <div>
                      <span style={{ fontWeight: 700, color: T.text }}>Buy: </span>
                      <span style={{ color: T.textSec }}>{movie.buyOn.slice(0, 3).join(', ')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Overview */}
          {movie.overview && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>Overview</div>
              <div style={{ fontSize: 14, color: T.textSec, lineHeight: 1.6 }}>{movie.overview}</div>
            </div>
          )}

          {/* Collections */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>Collections</div>
            {userCollections.filter(col => col.movies.some(m => m.id === movie.id)).length > 0 ? (
              <div style={{ marginBottom: 12 }}>
                {userCollections.filter(col => col.movies.some(m => m.id === movie.id)).map(col => (
                  <div key={col.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: T.bg, borderRadius: 10, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{col.name}</div>
                      <div style={{ fontSize: 11, color: T.textTer }}>{col.movieCount} movies</div>
                    </div>
                    <button
                      onClick={() => onRemoveFromCollection(movie.id, col.id)}
                      style={{ padding: "6px 12px", background: "none", border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSec, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: T.textTer, marginBottom: 12, fontStyle: "italic" }}>Not in any collections yet</div>
            )}
            <button
              onClick={() => setShowCollectionPicker(!showCollectionPicker)}
              style={{ width: "100%", padding: "12px", background: T.accent, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Plus size={16} />
              Add to Collection
            </button>
          </div>

          {/* Collection Picker */}
          {showCollectionPicker && (
            <div style={{ background: T.bg, borderRadius: 12, padding: 12, marginTop: 12, animation: "fadeIn 0.2s" }}>
              {userCollections.filter(col => !col.movies.some(m => m.id === movie.id)).length === 0 ? (
                <div style={{ fontSize: 12, color: T.textTer, textAlign: "center", padding: 12 }}>Already in all your collections!</div>
              ) : (
                userCollections.filter(col => !col.movies.some(m => m.id === movie.id)).map(col => (
                  <button
                    key={col.id}
                    onClick={() => {
                      onAddToCollection(movie, col.id);
                      setShowCollectionPicker(false);
                    }}
                    style={{ width: "100%", textAlign: "left", padding: "10px 12px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, marginBottom: 8, cursor: "pointer", transition: "background 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = T.cardHover}
                    onMouseLeave={e => e.currentTarget.style.background = T.card}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{col.name}</div>
                    <div style={{ fontSize: 11, color: T.textTer }}>{col.movieCount} movies · {col.isPublic ? "Public" : "Private"}</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Watch History */}
        {movieCheckins.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div 
              onClick={() => setShowWatchHistory(!showWatchHistory)}
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: T.text,
                marginBottom: 10,
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                userSelect: "none"
              }}
            >
              <span>Your Watch History</span>
              <svg 
                width={16} 
                height={16} 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke={T.textSec} 
                strokeWidth={2.5} 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ transform: showWatchHistory ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            <div style={{ background: T.bg, borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-around" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: T.accent }}>{totalWatches}</div>
                  <div style={{ fontSize: 10, color: T.textTer, fontWeight: 600, textTransform: "uppercase" }}>Times Watched</div>
                </div>
                {avgRating && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{avgRating}</div>
                    <div style={{ fontSize: 10, color: T.textTer, fontWeight: 600, textTransform: "uppercase" }}>Avg Rating</div>
                  </div>
                )}
                {rewatches > 0 && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{rewatches}</div>
                    <div style={{ fontSize: 10, color: T.textTer, fontWeight: 600, textTransform: "uppercase" }}>Rewatches</div>
                  </div>
                )}
              </div>
            </div>
            
            {showWatchHistory && (
              <div style={{ animation: "slideDown 0.3s ease-out" }}>
                {movieCheckins.map((checkin, i) => (
                  <div key={checkin.id} style={{ background: T.bg, borderRadius: 10, padding: 12, marginBottom: 10, animation: `fadeIn 0.3s ease-out ${i * 0.05}s backwards` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {(() => { const V = VenueIcons[checkin.venue] || VenueIcons.other; return <V size={12} />; })()}
                        <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>
                          {venueLabels[checkin.venue]}
                        </span>
                        {checkin.rewatch && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: T.accentLight, color: T.accent }}>
                            Rewatch
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Star size={12} fill={ratingColor(checkin.rating)} color={ratingColor(checkin.rating)} />
                        <span style={{ fontSize: 14, fontWeight: 800, color: ratingColor(checkin.rating) }}>
                          {checkin.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: T.textTer, marginBottom: checkin.thoughts ? 6 : 0 }}>
                      {timeAgo(checkin.timestamp)}
                    </div>
                    {checkin.thoughts && (
                      <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.4 }}>
                        {checkin.thoughts}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Share Modal */}
        {showShareModal && (
          <div style={{ position: "fixed", inset: 0, background: T.overlay, zIndex: 110, display: "flex", alignItems: "flex-end", animation: "fadeIn 0.2s" }} onClick={() => setShowShareModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: T.card, width: "100%", maxWidth: 480, margin: "0 auto", borderRadius: "24px 24px 0 0", maxHeight: "60vh", overflow: "hidden", display: "flex", flexDirection: "column", animation: "slideUp 0.3s ease-out" }}>
              <div style={{ padding: "18px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>Share with Friends</div>
                <button onClick={() => setShowShareModal(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
                  <X size={22} color={T.textSec} strokeWidth={2.2} />
                </button>
              </div>
              <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
                {FRIENDS.map((friend, i) => (
                  <div
                    key={friend.id}
                    onClick={() => {
                      if (onShare) onShare(movie, friend);
                      setShowShareModal(false);
                    }}
                    style={{
                      background: T.bg,
                      border: `1px solid ${T.border}`,
                      borderRadius: 12,
                      padding: "12px 14px",
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      cursor: "pointer",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      animation: `fadeIn 0.3s ease-out ${i * 0.05}s backwards`
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = `0 4px 12px ${T.overlay}`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <Avatar user={friend} size={42} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{friend.name}</div>
                      <div style={{ fontSize: 12, color: T.textTer }}>{friend.bio}</div>
                    </div>
                    <Send size={18} color={T.accent} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main App ---
export default function SeenApp() {
  const [darkMode, setDarkMode] = useState(false);
  const [tab, setTab] = useState("feed");
  const [checkins, setCheckins] = useState([]);
  const [feed, setFeed] = useState(MOCK_FEED);
  const [likes, setLikes] = useState({});
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [showCheckin, setShowCheckin] = useState(false);
  const [selectedMovieDetail, setSelectedMovieDetail] = useState(null);
  const [userCollections, setUserCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCheckin, setEditingCheckin] = useState(null);
  const [showClapAnimation, setShowClapAnimation] = useState(false);
  const [userName, setUserName] = useState("You");
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDM, setShowDM] = useState(null);
  const [showFriendProfile, setShowFriendProfile] = useState(null);
  const [userDMs, setUserDMs] = useState({});

  const T = createTheme(darkMode);
  
  const ME = { id: "me", name: userName, avatar: userName[0]?.toUpperCase() || "Y", color: "#1A9E8F" };

  // Load data from persistent storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load check-ins
        const savedCheckins = await storage.get('seen-checkins');
        if (savedCheckins) {
          const parsed = JSON.parse(savedCheckins.value);
          setCheckins(parsed);
          setFeed([...MOCK_FEED, ...parsed]);
        }

        // Load collections
        const savedCollections = await storage.get('seen-collections');
        if (savedCollections) {
          setUserCollections(JSON.parse(savedCollections.value));
        } else {
          // Initialize with default collections
          const defaultCollections = [
            { id: "mc1", name: "Watchlist", movieCount: 0, isPublic: false, movies: [], createdAt: Date.now() },
            { id: "mc2", name: "Favorites", movieCount: 0, isPublic: true, movies: [], createdAt: Date.now() },
          ];
          setUserCollections(defaultCollections);
          await storage.set('seen-collections', JSON.stringify(defaultCollections));
        }

        // Load dark mode preference
        const savedTheme = await storage.get('seen-darkmode');
        if (savedTheme) {
          setDarkMode(savedTheme.value === 'true');
        }
        
        // Load user name
        const savedName = await storage.get('seen-username');
        if (savedName) {
          setUserName(savedName.value);
        }
        
        // Load DMs
        const savedDMs = await storage.get('seen-dms');
        if (savedDMs) {
          setUserDMs(JSON.parse(savedDMs.value));
        }
      } catch (error) {
        console.log('Storage not available or error loading:', error);
        // Initialize with defaults if storage fails
        setUserCollections([
          { id: "mc1", name: "Watchlist", movieCount: 0, isPublic: false, movies: [], createdAt: Date.now() },
          { id: "mc2", name: "Favorites", movieCount: 0, isPublic: true, movies: [], createdAt: Date.now() },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Save check-ins whenever they change
  useEffect(() => {
    if (!isLoading && checkins.length > 0) {
      storage.set('seen-checkins', JSON.stringify(checkins)).catch(err => console.log('Save error:', err));
    }
  }, [checkins, isLoading]);

  // Save collections whenever they change
  useEffect(() => {
    if (!isLoading && userCollections.length > 0) {
      storage.set('seen-collections', JSON.stringify(userCollections)).catch(err => console.log('Save error:', err));
    }
  }, [userCollections, isLoading]);

  // Save dark mode preference
  useEffect(() => {
    if (!isLoading) {
      storage.set('seen-darkmode', darkMode.toString()).catch(err => console.log('Save error:', err));
    }
  }, [darkMode, isLoading]);
  
  // Save user name
  useEffect(() => {
    if (!isLoading) {
      storage.set('seen-username', userName).catch(err => console.log('Save error:', err));
    }
  }, [userName, isLoading]);
  
  // Save DMs
  useEffect(() => {
    if (!isLoading) {
      storage.set('seen-dms', JSON.stringify(userDMs)).catch(err => console.log('Save error:', err));
    }
  }, [userDMs, isLoading]);

  function handleSendDM(friendId, message) {
    setUserDMs(prev => ({
      ...prev,
      [friendId]: [...(prev[friendId] || []), message]
    }));
  }
  
  function handleShareMovie(movie, friend) {
    const message = {
      id: `msg-${Date.now()}`,
      text: `Check out "${movie.title}" (${movie.year})! ${movie.rating ? `I'd rate it ${movie.rating}/10` : ''}`,
      from: "me",
      timestamp: Date.now()
    };
    handleSendDM(friend.id, message);
    // Show confirmation
    setShowClapAnimation(true);
    setTimeout(() => setShowClapAnimation(false), 1000);
  }

  function handleSubmit(ci) {
    setCheckins(p => [ci, ...p]);
    setFeed(p => [ci, ...p]);
    
    // Trigger clap animation
    setShowClapAnimation(true);
    setTimeout(() => setShowClapAnimation(false), 1000);
  }

  function handleEditCheckin(updated) {
    setCheckins(prev => prev.map(c => c.id === updated.id ? updated : c));
    setFeed(prev => prev.map(c => c.id === updated.id ? updated : c));
  }

  function handleDeleteCheckin(checkinId) {
    console.log("handleDeleteCheckin called with id:", checkinId);
    console.log("Current checkins before delete:", checkins.length);
    setCheckins(prev => prev.filter(c => c.id !== checkinId));
    setFeed(prev => prev.filter(c => c.id !== checkinId));
    setEditingCheckin(null); // Close the edit modal
    console.log("Delete complete");
  }

  function addComment(id, text, parentId = null) {
    const newComment = {
      id: `c-${Date.now()}`,
      user: ME,
      text,
      timestamp: Date.now(),
      replies: []
    };

    setComments(p => {
      const itemComments = p[id] || [];
      
      if (parentId) {
        // Adding a reply to an existing comment
        return {
          ...p,
          [id]: itemComments.map(comment => 
            comment.id === parentId
              ? { ...comment, replies: [...(comment.replies || []), { id: `r-${Date.now()}`, user: ME, text, timestamp: Date.now() }] }
              : comment
          )
        };
      } else {
        // Adding a new top-level comment
        return { ...p, [id]: [...itemComments, newComment] };
      }
    });
  }

  // Add movie to collection
  const addToCollection = async (movie, collectionId) => {
    setUserCollections(prev => {
      const updated = prev.map(col => {
        if (col.id === collectionId) {
          // Check if movie already in collection
          if (col.movies.some(m => m.id === movie.id)) {
            return col;
          }
          return {
            ...col,
            movies: [...col.movies, movie],
            movieCount: col.movies.length + 1
          };
        }
        return col;
      });
      return updated;
    });
  };

  // Remove movie from collection
  const removeFromCollection = async (movieId, collectionId) => {
    setUserCollections(prev => {
      const updated = prev.map(col => {
        if (col.id === collectionId) {
          return {
            ...col,
            movies: col.movies.filter(m => m.id !== movieId),
            movieCount: col.movies.filter(m => m.id !== movieId).length
          };
        }
        return col;
      });
      return updated;
    });
  };

  // Create new collection
  const createCollection = (name, description, isPublic) => {
    const newCollection = {
      id: `col-${Date.now()}`,
      name,
      description,
      isPublic,
      movies: [],
      movieCount: 0,
      createdAt: Date.now()
    };
    setUserCollections(prev => [newCollection, ...prev]);
    return newCollection;
  };

  // Edit collection
  const editCollection = (updated) => {
    setUserCollections(prev => prev.map(col => col.id === updated.id ? updated : col));
  };

  // Delete collection
  const deleteCollection = (collectionId) => {
    setUserCollections(prev => prev.filter(col => col.id !== collectionId));
  };

  const my = checkins;
  const stats = {
    total: my.length,
    avg: my.length ? (my.reduce((a, c) => a + c.rating, 0) / my.length).toFixed(1) : "—",
    theater: my.filter(c => c.venue === "theater").length,
    rewatches: my.filter(c => c.rewatch).length
  };

  const navItems = [
    { id: "feed", label: "Feed", Icon: ClapperIcon },
    { id: "search", label: "Discover", Icon: SpotlightIcon },
    { id: "profile", label: "Profile", Icon: DirectorChairIcon },
  ];

  return (
    <div style={{ background: T.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto", fontFamily: "'DM Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif", transition: "background 0.3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&display=swap');
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes slideDown { from { opacity: 0; max-height: 0 } to { opacity: 1; max-height: 500px } }
        @keyframes clap {
          0% { transform: rotate(-25deg); transform-origin: left center; }
          50% { transform: rotate(0deg); transform-origin: left center; }
          100% { transform: rotate(-25deg); transform-origin: left center; }
        }
        @keyframes clapFade {
          0% { opacity: 0; transform: scale(0.8); }
          10% { opacity: 1; transform: scale(1); }
          90% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.1); }
        }
        input::placeholder { color: ${T.textTer} }
        textarea::placeholder { color: ${T.textTer} }
        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        button:active { transform: scale(0.98) !important; }
      `}</style>

      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ animation: "spin 1s linear infinite", margin: "0 auto", width: "fit-content" }}><SpotlightIcon size={44} color={T.accent} /></div>
            <div style={{ marginTop: 16, fontSize: 16, fontWeight: 700, color: T.text }}>Loading...</div>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ padding: "13px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, background: T.headerBg, backdropFilter: "blur(20px)", zIndex: 50, transition: "border-color 0.3s" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: T.text, letterSpacing: -0.8 }}>
              S<span style={{ color: T.accent }}>e</span>en
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => setDarkMode(!darkMode)}
                style={{ background: T.bg, border: `1px solid ${T.border}`, padding: "8px 10px", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", transition: "background 0.2s" }}
              >
                {darkMode ? <Sun size={16} color={T.accent} /> : <Moon size={16} color={T.textSec} />}
              </button>
              <button
                onClick={() => setShowCheckin(true)}
                style={{ background: T.text, border: "none", color: T.bg, padding: "8px 15px", borderRadius: 11, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, letterSpacing: -0.1, transition: "transform 0.2s" }}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  {/* Clapper arm - hinged on left, opens on right */}
                  <path d="M2 8 L4 4 L22 6 L22 8 Z" fill="currentColor" opacity="0.4" />
                  {/* Main board */}
                  <path d="M2 8h20v13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8z" />
                  {/* Hinge line */}
                  <line x1="2" y1="8" x2="22" y2="8" strokeWidth={2.5} />
                  {/* Stripes on clapper */}
                  <line x1="8" y1="5" x2="9" y2="8" strokeWidth={1.5} opacity="0.6" />
                  <line x1="15" y1="6" x2="16" y2="8" strokeWidth={1.5} opacity="0.6" />
                </svg>
                Seen something?
              </button>
            </div>
          </div>

          <div style={{ padding: "14px 14px 100px" }}>
            {tab === "feed" && [...feed].sort((a, b) => b.timestamp - a.timestamp).map((item, i) => (
              <div key={item.id} style={{ animation: `fadeIn 0.4s ease-out ${i * 0.1}s backwards` }}>
                <FeedItem
                  item={item}
                  liked={!!likes[item.id]}
                  onLike={() => setLikes(p => ({ ...p, [item.id]: !p[item.id] }))}
                  comments={comments[item.id] || []}
                  onAddComment={(t, parentId) => addComment(item.id, t, parentId)}
                  onMovieClick={setSelectedMovieDetail}
                  onEdit={setEditingCheckin}
                  onUserClick={(user) => user.id !== "me" && setShowFriendProfile(user)}
                  T={T}
                />
              </div>
            ))}

            {tab === "search" && <DiscoverTab onCheckin={() => setShowCheckin(true)} T={T} onMovieClick={setSelectedMovieDetail} userCheckins={checkins} userDMs={userDMs} onSendDM={handleSendDM} />}

            {tab === "profile" && <ProfileTab checkins={my} stats={stats} T={T} darkMode={darkMode} userCollections={userCollections} onMovieClick={setSelectedMovieDetail} onEditCheckin={handleEditCheckin} onDeleteCheckin={handleDeleteCheckin} onAddToCollection={addToCollection} onRemoveFromCollection={removeFromCollection} onEditCollection={editCollection} onDeleteCollection={deleteCollection} onEdit={setEditingCheckin} userName={userName} onEditName={() => setShowEditProfile(true)} ME={ME} userDMs={userDMs} onShowDM={(friend) => { setShowDM(friend); setTab("profile"); }} />}
          </div>

          {/* Nav */}
          <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: T.navBg, backdropFilter: "blur(20px)", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-around", padding: "8px 0 26px", zIndex: 50, transition: "background 0.3s, border-color 0.3s" }}>
            {navItems.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  color: tab === id ? T.accent : T.textTer,
                  fontSize: 10,
                  fontWeight: tab === id ? 700 : 500,
                  transition: "color 0.2s, transform 0.2s",
                  letterSpacing: 0.1,
                  transform: tab === id ? "scale(1.05)" : "scale(1)"
                }}
              >
                <Icon size={23} color={tab === id ? T.accent : T.textTer} strokeWidth={tab === id ? 2 : 1.4} />
                {label}
              </button>
            ))}
          </div>

          {showCheckin && <CheckinModal onClose={() => setShowCheckin(false)} onSubmit={handleSubmit} T={T} userCollections={userCollections} onAddToCollection={addToCollection} />}
          
          {editingCheckin && (
            <EditCheckinModal
              checkin={editingCheckin}
              onClose={() => setEditingCheckin(null)}
              onSave={handleEditCheckin}
              onDelete={handleDeleteCheckin}
              userCollections={userCollections}
              onAddToCollection={addToCollection}
              onRemoveFromCollection={removeFromCollection}
              T={T}
            />
          )}
          
          {selectedMovieDetail && (
            <MovieDetailModal
              movie={selectedMovieDetail}
              onClose={() => setSelectedMovieDetail(null)}
              userCollections={userCollections}
              onAddToCollection={addToCollection}
              onRemoveFromCollection={removeFromCollection}
              checkins={checkins}
              onShare={handleShareMovie}
              T={T}
            />
          )}

          {/* Clap Animation Overlay */}
          {showClapAnimation && (
            <div style={{ 
              position: "fixed", 
              inset: 0, 
              zIndex: 200, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              pointerEvents: "none",
              animation: "clapFade 1s ease-out"
            }}>
              <div style={{ textAlign: "center" }}>
                <svg width={120} height={120} viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  {/* Animated clapper arm - hinged on left */}
                  <g style={{ transformOrigin: "2px 8px", animation: "clap 0.6s ease-in-out" }}>
                    <path d="M2 8 L4 4 L22 6 L22 8 Z" fill={T.accent} opacity="0.3" />
                    <line x1="8" y1="5" x2="9" y2="8" strokeWidth={1.5} stroke={T.accent} />
                    <line x1="15" y1="6" x2="16" y2="8" strokeWidth={1.5} stroke={T.accent} />
                  </g>
                  {/* Main board */}
                  <path d="M2 8h20v13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8z" fill={T.accent} opacity="0.2" />
                  <line x1="2" y1="8" x2="22" y2="8" strokeWidth={2.5} stroke={T.accent} />
                </svg>
                <div style={{ 
                  marginTop: 16, 
                  fontSize: 18, 
                  fontWeight: 700, 
                  color: T.accent,
                  textShadow: `0 2px 8px ${T.accent}40`
                }}>
                  Scene 🎬
                </div>
              </div>
            </div>
          )}
          
          {/* DM Modal */}
          {showDM && (
            <DMModal user={showDM} onClose={() => setShowDM(null)} T={T} userDMs={userDMs} onSendDM={handleSendDM} />
          )}
          
          {/* Friend Profile Modal */}
          {showFriendProfile && (
            <FriendProfileModal
              friend={showFriendProfile}
              onClose={() => setShowFriendProfile(null)}
              onMovieClick={setSelectedMovieDetail}
              userCheckins={checkins}
              T={T}
            />
          )}
          
          {/* Edit Profile Modal */}
          {showEditProfile && (
            <div style={{ position: "fixed", inset: 0, background: T.overlay, zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s" }} onClick={() => setShowEditProfile(false)}>
              <div onClick={e => e.stopPropagation()} style={{ background: T.card, width: "90%", maxWidth: 380, borderRadius: 20, padding: "24px", animation: "slideUp 0.3s ease-out" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>Edit Profile</div>
                  <button onClick={() => setShowEditProfile(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
                    <X size={22} color={T.textSec} strokeWidth={2.2} />
                  </button>
                </div>
                
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 8, display: "block" }}>Your Name</label>
                  <input
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    autoFocus
                    style={{ width: "100%", padding: "12px 14px", background: T.bg, border: `1.5px solid ${T.borderMed}`, borderRadius: 12, color: T.text, fontSize: 15, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                  />
                </div>
                
                <button
                  onClick={() => setShowEditProfile(false)}
                  style={{ width: "100%", padding: "14px 20px", background: T.accent, border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

