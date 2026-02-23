-- MusicDB Schema Initialization
-- Run this to create tables + sample data

-- Drop tables if they exist (development only)
DROP TABLE IF EXISTS audio_files;
DROP TABLE IF EXISTS lyrics;
DROP TABLE IF EXISTS songs;

-- 1. songs table
CREATE TABLE songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  project TEXT,
  version TEXT,
  status TEXT CHECK(status IN ('Idea', 'Writing', 'Recording', 'Mixing', 'Released')) DEFAULT 'Idea',
  bpm INTEGER CHECK(bpm BETWEEN 40 AND 220),
  key TEXT,
  theme TEXT,
  tags TEXT,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_edited DATETIME DEFAULT CURRENT_TIMESTAMP,
  distributor TEXT,
  release_date DATE,
  isrc TEXT UNIQUE,
  upc TEXT,
  notes TEXT
);

-- 2. lyrics table
CREATE TABLE lyrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
  body TEXT,
  complete BOOLEAN DEFAULT FALSE,
  last_edited DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(song_id)
);

-- 3. audio_files table
CREATE TABLE audio_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  size_bytes INTEGER,
  duration_seconds REAL,
  bitrate INTEGER,
  sample_rate INTEGER,
  uploaded_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(song_id, name)
);

-- Indexes for performance
CREATE INDEX idx_songs_status ON songs(status);
CREATE INDEX idx_songs_bpm ON songs(bpm);
CREATE INDEX idx_songs_tags ON songs(tags);
CREATE INDEX idx_songs_project ON songs(project);
CREATE INDEX idx_lyrics_song_id ON lyrics(song_id);

-- Sample data (matches React INITIAL_SONGS)
INSERT INTO songs (title, project, version, status, bpm, key, theme, tags)
VALUES
  ('Midnight Drive', 'Neon Horizons', 'Demo 1', 'Writing', 120, 'Am', 'Nostalgia', 'synthwave,night,driving'),
  ('Broken Glass', 'Acoustic Sessions', 'Final Mix', 'Released', 85, 'G', 'Heartbreak', 'ballad,acoustic,emotional'),
  ('Cyber Punk City', 'Neon Horizons', 'Instrumental', 'Idea', 140, 'Cm', 'Future', 'electronic,upbeat');

INSERT INTO lyrics (song_id, body, complete)
VALUES
  (1, 'Verse 1\nStreetlights passing by like memories\nIn the rear view mirror, that's where you'll be\n\nChorus\nDriving through the midnight rain\nTrying to wash away the pain', true),
  (2, 'Shattered pieces on the floor\nDon't know who I am anymore...', true),
  (3, '', false);

-- Verify
SELECT * FROM songs;
SELECT COUNT(*) FROM lyrics;
SELECT COUNT(*) FROM audio_files;
