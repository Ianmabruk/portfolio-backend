const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.get('/', (req, res) => {
  const links = db.prepare('SELECT * FROM social_links WHERE active = 1 ORDER BY ordering ASC').all();
  res.json({ success: true, data: links });
});

router.post('/', authMiddleware, (req, res) => {
  const { platform, url, active, ordering } = req.body;
  db.prepare('INSERT INTO social_links (platform, url, active, ordering) VALUES (?, ?, ?, ?)').run(platform, url, active ? 1 : 0, ordering || 0);
  res.json({ success: true, message: 'Social link created' });
});

router.put('/:id', authMiddleware, (req, res) => {
  const { platform, url, active, ordering } = req.body;
  db.prepare('UPDATE social_links SET platform = ?, url = ?, active = ?, ordering = ? WHERE id = ?').run(platform, url, active ? 1 : 0, ordering || 0, req.params.id);
  res.json({ success: true, message: 'Social link updated' });
});

router.delete('/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM social_links WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Social link deleted' });
});

module.exports = router;
