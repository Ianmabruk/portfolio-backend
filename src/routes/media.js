const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../utils/upload');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  const { category } = req.query;
  let query = 'SELECT * FROM media_assets WHERE 1=1';
  const params = [];
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  query += ' ORDER BY created_at DESC';
  const assets = db.prepare(query).all(...params);
  res.json({ success: true, data: assets });
});

router.post('/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const info = db.prepare(
    'INSERT INTO media_assets (filename, original_name, mime_type, size, url, alt_text, category) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, `/uploads/media/${req.file.filename}`, req.body.alt_text || null, req.body.category || 'general');
  res.json({ success: true, data: { id: info.lastInsertRowid, url: `/uploads/media/${req.file.filename}` }, message: 'File uploaded successfully' });
});

router.delete('/:id', authMiddleware, (req, res) => {
  const asset = db.prepare('SELECT * FROM media_assets WHERE id = ?').get(req.params.id);
  if (!asset) {
    return res.status(404).json({ success: false, message: 'Asset not found' });
  }
  db.prepare('DELETE FROM media_assets WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Asset deleted successfully' });
});

module.exports = router;
