import initSqlJs from 'sql.js';
import { useState, useEffect, useRef, useCallback } from 'react';

// --- DB WRAPPER HOOK --- export const useMusicDB = () => {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dbRef = useRef(null);

  // Load sql.js and init DB
  useEffect(() => {
    let cancelled = false;

    const initDB = async () => {
      try {
        setLoading(true);
        const SQL = await initSqlJs({
          locateFile: file => `https://sql.js.org/dist/${file}`
        });

        // Fetch and run schema-init.sql
        const schemaResponse = await fetch('/db/schema-init.sql');
        const schemaText = await schemaResponse.text();

        // Create DB from schema
        const newDb = new SQL.Database();
        newDb.run(schemaText);

        if (!cancelled) {
          dbRef.current = newDb;
          setDb(newDb);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initDB();

    return () => {
      cancelled = true;
      if (dbRef.current) {
        dbRef.current.close();
      }
    };
  }, []);

  // Generic query helper
  const query = useCallback((sql, params = []) => {
    if (!db) throw new Error('DB not ready');
    const stmt = db.prepare(sql);
    const result = stmt.getAsObject(params);
    stmt.free();
    return result;
  }, [db]);

  // Song CRUD
  const getSongs = useCallback((filters = {}) => {
    let sql = `
      SELECT * FROM songs
      ${filters.status ? 'WHERE status = ?' : ''}
      ${filters.project ? 'WHERE project = ?' : ''}
      ORDER BY last_edited DESC
    `;
    const params = [];
    if (filters.status) params.push(filters.status);
    if (filters.project) params.push(filters.project);
    return db ? db.exec(sql, {returnData: true})[0]?.values || [] : [];
  }, [db]);

  const createSong = useCallback((songData) => {
    const sql = `
      INSERT INTO songs (title, project, version, status, bpm, key, theme, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const stmt = db.prepare(sql);
    const result = stmt.run(
      songData.title, songData.project, songData.version,
      songData.status, songData.bpm, songData.key,
      songData.theme, songData.tags
    );
    stmt.free();
    return result.lastInsertRowid;
  }, [db]);

  const updateSong = useCallback((id, updates) => {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const sql = `UPDATE songs SET ${fields}, last_edited = CURRENT_TIMESTAMP WHERE id = ?`;
    const stmt = db.prepare(sql);
    const values = [...Object.values(updates), id];
    stmt.run(...values);
    stmt.free();
  }, [db]);

  // Lyrics CRUD
  const getLyrics = useCallback((songId) => {
    return query('SELECT * FROM lyrics WHERE song_id = ?', [songId]);
  }, [query]);

  const updateLyrics = useCallback((songId, body, complete) => {
    query(
      'INSERT OR REPLACE INTO lyrics (song_id, body, complete, last_edited) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [songId, body, !!complete]
    );
  }, [query]);

  // Audio CRUD
  const addAudioFile = useCallback((songId, fileInfo) => {
    query(
      'INSERT INTO audio_files (song_id, name, file_path, size_bytes, duration_seconds) VALUES (?, ?, ?, ?, ?)',
      [songId, fileInfo.name, fileInfo.path, fileInfo.size, fileInfo.duration]
    );
  }, [query]);

  return {
    db,
    loading,
    error,
    getSongs,
    createSong,
    updateSong,
    getLyrics,
    updateLyrics,
    addAudioFile
  };
};

// Export for DB.html
const MusicDB = { useMusicDB };
export default MusicDB;

/*
Usage in React component:

const { getSongs, createSong } = useMusicDB();

const songs = getSongs({ status: 'Writing' });
*/