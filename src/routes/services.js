const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../utils/upload');
const { z } = require('zod');

const serviceSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  content: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  ordering: z.number().optional(),
});

router.get('/', (req, res) => {
  const { featured } = req.query;
  let query = 'SELECT * FROM services WHERE active = 1';
  const params = [];
  if (featured === 'true') {
    query += ' AND featured = 1';
  }
  query += ' ORDER BY ordering ASC, id ASC';
  const services = db.prepare(query).all(...params);
  res.json({ success: true, data: services });
});

router.get('/:id(\\d+)', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid service ID' });
  }
  const service = db.prepare('SELECT * FROM services WHERE id = ? AND active = 1').get(id);
  if (!service) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }
  res.json({ success: true, data: service });
});

router.get('/:slug', (req, res) => {
  const service = db.prepare('SELECT * FROM services WHERE slug = ? AND active = 1').get(req.params.slug);
  if (!service) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }
  res.json({ success: true, data: service });
});

router.post('/', authMiddleware, upload.single('image'), (req, res) => {
  const result = serviceSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, message: 'Invalid input', errors: result.error.errors });
  }

  const data = result.data;
  const image = req.file ? `/uploads/services/${req.file.filename}` : data.image || null;

  db.prepare(
    'INSERT INTO services (title, slug, description, content, icon, image, featured, active, ordering) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(data.title, data.slug, data.description, data.content || null, data.icon || null, image, data.featured ? 1 : 0, data.active ? 1 : 1, data.ordering || 0);

  res.json({ success: true, message: 'Service created successfully' });
});

router.put('/:id', authMiddleware, upload.single('image'), (req, res) => {
  const result = serviceSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, message: 'Invalid input', errors: result.error.errors });
  }

  const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }

  const data = result.data;
  const image = req.file ? `/uploads/services/${req.file.filename}` : (data.image || existing.image);

  db.prepare(
    'UPDATE services SET title = ?, slug = ?, description = ?, content = ?, icon = ?, image = ?, featured = ?, active = ?, ordering = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(data.title, data.slug, data.description, data.content || null, data.icon || null, image, data.featured ? 1 : 0, data.active ? 1 : 0, data.ordering || 0, req.params.id);

  res.json({ success: true, message: 'Service updated successfully' });
});

router.delete('/:id', authMiddleware, (req, res) => {
  const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }
  db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Service deleted successfully' });
});

module.exports = router;
