// types/music.ts

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: string;
  plays: number;
  image: string;
  genre: string;
  bpm?: number;
  key?: string;
  dateAdded?: Date;
  lastPlayed?: Date;
  isFavorite?: boolean;
  isExplicit?: boolean;
  audioUrl?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  songCount: number;
  duration: string;
  image: string;
  songs?: Song[];
  isPublic?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  tags?: string[];
  totalPlays?: number;
}

export interface Artist {
  id: string;
  name: string;
  image: string;
  genres: string[];
  followers?: number;
  monthlyListeners?: number;
  topSongs?: Song[];
  albums?: Album[];
  biography?: string;
  verified?: boolean;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  releaseDate: Date;
  image: string;
  songs: Song[];
  duration: string;
  genre: string;
  label?: string;
  description?: string;
}

export interface MusicStats {
  totalSongs: number;
  playlists: number;
  mostCommonKey: string;
  avgBPM: number;
  totalPlayTime?: string;
  topGenres?: GenreStats[];
  mostPlayedArtist?: string;
  mostPlayedMonth?: string;
  listeningStreak?: number;
}

export interface GenreStats {
  genre: string;
  songCount: number;
  playTime: string;
  percentage: number;
}

export interface UserPreferences {
  favoriteGenres: string[];
  preferredPlayback: 'shuffle' | 'repeat' | 'normal';
  audioQuality: 'high' | 'medium' | 'low';
  showExplicitContent: boolean;
  autoplay: boolean;
  crossfade: boolean;
  notifications: {
    newReleases: boolean;
    playlistUpdates: boolean;
    socialActivity: boolean;
  };
}

export interface PlaybackState {
  currentSong: Song | null;
  isPlaying: boolean;
  isPaused: boolean;
  volume: number;
  progress: number;
  duration: number;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  queue: Song[];
  history: Song[];
}

export interface SearchResult {
  songs: Song[];
  playlists: Playlist[];
  artists: Artist[];
  albums: Album[];
  totalResults: number;
  query: string;
}

export interface RecentActivity {
  id: string;
  type: 'play' | 'like' | 'playlist_create' | 'playlist_update' | 'follow';
  userId: string;
  itemId: string;
  itemType: 'song' | 'playlist' | 'artist' | 'album';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export interface ListeningSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  songsPlayed: {
    songId: string;
    playTime: number;
    completed: boolean;
  }[];
  totalDuration: number;
  device: string;
  location?: string;
}

// Enums para melhor type safety
export enum SongGenre {
  ROCK = 'Rock',
  POP = 'Pop',
  JAZZ = 'Jazz',
  CLASSICAL = 'Classical',
  ELECTRONIC = 'Electronic',
  HIP_HOP = 'Hip-Hop',
  COUNTRY = 'Country',
  BLUES = 'Blues',
  REGGAE = 'Reggae',
  FOLK = 'Folk',
  METAL = 'Metal',
  ALTERNATIVE = 'Alternative',
  RNB = 'R&B',
  SOUL = 'Soul',
  FUNK = 'Funk',
  INDIE = 'Indie',
  PUNK = 'Punk',
  WORLD = 'World',
  AMBIENT = 'Ambient',
  HOUSE = 'House',
  TECHNO = 'Techno',
  DRUM_AND_BASS = 'Drum & Bass',
  DUBSTEP = 'Dubstep',
  TRANCE = 'Trance',
}

export enum PlaylistType {
  USER_CREATED = 'user_created',
  SMART = 'smart',
  FEATURED = 'featured',
  ALGORITHMIC = 'algorithmic',
  COLLABORATIVE = 'collaborative',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum SortBy {
  TITLE = 'title',
  ARTIST = 'artist',
  DURATION = 'duration',
  PLAYS = 'plays',
  DATE_ADDED = 'dateAdded',
  LAST_PLAYED = 'lastPlayed',
  POPULARITY = 'popularity',
}

// Interfaces para componentes
export interface ComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface SongCardProps extends ComponentProps {
  song: Song;
  showPlays?: boolean;
  showIndex?: boolean;
  onPlay?: (song: Song) => void;
  onLike?: (song: Song) => void;
  onShare?: (song: Song) => void;
  onAddToQueue?: (song: Song) => void;
  onRemove?: (song: Song) => void;
  isPlaying?: boolean;
  isD