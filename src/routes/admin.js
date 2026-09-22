const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../utils/upload');

router.use(authMiddleware);

router.get('/dashboard', (req, res) => {
  const projects = db.prepare('SELECT COUNT(*) as count FROM portfolio_projects').get().count;
  const services = db.prepare('SELECT COUNT(*) as count FROM services').get().count;
  const testimonials = db.prepare('SELECT COUNT(*) as count FROM testimonials').get().count;
  const plans = db.prepare('SELECT COUNT(*) as count FROM plans').get().count;
  const requests = db.prepare('SELECT COUNT(*) as count FROM service_requests').get().count;
  const inquiries = db.prepare('SELECT COUNT(*) as count FROM inquiries').get().count;
  const community = db.prepare('SELECT COUNT(*) as count FROM community_members').get().count;

  const recentRequests = db.prepare('SELECT * FROM service_requests ORDER BY created_at DESC LIMIT 5').all();
  const recentInquiries = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 5').all();
  const recentCommunity = db.prepare('SELECT * FROM community_members ORDER BY created_at DESC LIMIT 5').all();

  res.json({
    success: true,
    data: {
      stats: { projects, services, testimonials, plans, requests, inquiries, community },
      recentRequests,
      recentInquiries,
      recentCommunity,
    },
  });
});

router.get('/services', (req, res) => {
  const services = db.prepare('SELECT * FROM services ORDER BY ordering ASC, id ASC').all();
  res.json({ success: true, data: services });
});

router.get('/portfolio', (req, res) => {
  const projects = db.prepare('SELECT * FROM portfolio_projects ORDER BY ordering ASC, id DESC').all();
  res.json({ success: true, data: projects });
});

router.get('/testimonials', (req, res) => {
  const testimonials = db.prepare('SELECT * FROM testimonials ORDER BY ordering ASC, id DESC').all();
  res.json({ success: true, data: testimonials });
});

router.get('/plans', (req, res) => {
  const plans = db.prepare('SELECT * FROM plans ORDER BY ordering ASC, id ASC').all();
  res.json({ success: true, data: plans });
});

router.get('/community', (req, res) => {
  const { search, status } = req.query;
  let query = 'SELECT * FROM community_members WHERE 1=1';
  const params = [];
  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ? OR company LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  query += ' ORDER BY created_at DESC';
  const members = db.prepare(query).all(...params);
  res.json({ success: true, data: members });
});

router.get('/requests', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM service_requests WHERE 1=1';
  const params = [];
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  query += ' ORDER BY created_at DESC';
  const requests = db.prepare(query).all(...params);
  res.json({ success: true, data: requests });
});

router.get('/inquiries', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM inquiries WHERE 1=1';
  const params = [];
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  query += ' ORDER BY created_at DESC';
  const inquiries = db.prepare(query).all(...params);
  res.json({ success: true, data: inquiries });
});

router.get('/contact', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM inquiries WHERE 1=1';
  const params = [];
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  query += ' ORDER BY created_at DESC';
  const inquiries = db.prepare(query).all(...params);
  res.json({ success: true, data: inquiries });
});

router.get('/media', (req, res) => {
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

router.post('/media/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const info = db.prepare(
    'INSERT INTO media_assets (filename, original_name, mime_type, size, url, alt_text, category) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, `/uploads/media/${req.file.filename}`, req.body.alt_text || null, req.body.category || 'general');
  res.json({ success: true, data: { id: info.lastInsertRowid, url: `/uploads/media/${req.file.filename}` }, message: 'File uploaded' });
});

router.get('/settings', (req, res) => {
  const settings = db.prepare('SELECT * FROM site_settings').all();
  const data = {};
  settings.forEach(s => { data[s.key] = s.value; });
  res.json({ success: true, data });
});

router.post('/settings', (req, res) => {
  const { key, value, type } = req.body;
  if (!key) return res.status(400).json({ success: false, message: 'Key required' });
  const existing = db.prepare('SELECT * FROM site_settings WHERE key = ?').get(key);
  if (existing) {
    db.prepare('UPDATE site_settings SET value = ?, type = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').run(value || '', type || 'text', key);
  } else {
    db.prepare('INSERT INTO site_settings (key, value, type) VALUES (?, ?, ?)').run(key, value || '', type || 'text');
  }
  res.json({ success: true, message: 'Setting saved' });
});

router.get('/activities', (req, res) => {
  const activities = db.prepare('SELECT * FROM activities ORDER BY created_at DESC LIMIT 50').all();
  res.json({ success: true, data: activities });
});

router.get('/social-links', (req, res) => {
  const links = db.prepare('SELECT * FROM social_links ORDER BY ordering ASC').all();
  res.json({ success: true, data: links });
});

module.exports = router;
