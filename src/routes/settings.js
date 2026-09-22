const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

router.get('/', (req, res) => {
  const settings = db.prepare('SELECT * FROM site_settings').all();
  const data = {};
  settings.forEach(s => {
    data[s.key] = s.value;
  });
  res.json({ success: true, data });
});

router.get('/:key', (req, res) => {
  const setting = db.prepare('SELECT * FROM site_settings WHERE key = ?').get(req.params.key);
  if (!setting) {
    return res.status(404).json({ success: false, message: 'Setting not found' });
  }
  res.json({ success: true, data: setting });
});

router.post('/', (req, res) => {
  const { key, value, type } = req.body;
  if (!key) {
    return res.status(400).json({ success: false, message: 'Key is required' });
  }
  const existing = db.prepare('SELECT * FROM site_settings WHERE key = ?').get(key);
  if (existing) {
    db.prepare('UPDATE site_settings SET value = ?, type = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').run(value || '', type || 'text', key);
  } else {
    db.prepare('INSERT INTO site_settings (key, value, type) VALUES (?, ?, ?)').run(key, value || '', type || 'text');
  }
  res.json({ success: true, message: 'Setting saved' });
});

module.exports = router;
