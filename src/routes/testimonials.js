const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../utils/upload');
const { z } = require('zod');

const testimonialSchema = z.object({
  name: z.string().min(1),
  company: z.string().min(1),
  role: z.string().optional(),
  testimonial: z.string().min(1),
  rating: z.number().min(1).max(5).optional(),
  project_reference: z.string().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  ordering: z.number().optional(),
});

router.get('/', (req, res) => {
  const { featured } = req.query;
  let query = 'SELECT * FROM testimonials WHERE active = 1';
  const params = [];
  if (featured === 'true') {
    query += ' AND featured = 1';
  }
  query += ' ORDER BY ordering ASC, id DESC';
  const testimonials = db.prepare(query).all(...params);
  res.json({ success: true, data: testimonials });
});

router.post('/', authMiddleware, upload.single('image'), (req, res) => {
  const result = testimonialSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, message: 'Invalid input', errors: result.error.errors });
  }
  const data = result.data;
  const image = req.file ? `/uploads/testimonials/${req.file.filename}` : data.image_url || null;

  db.prepare(
    'INSERT INTO testimonials (name, company, role, image_url, testimonial, rating, project_reference, featured, active, ordering) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(data.name, data.company, data.role || null, image, data.testimonial, data.rating || 5, data.project_reference || null, data.featured ? 1 : 0, data.active ? 1 : 1, data.ordering || 0);

  res.json({ success: true, message: 'Testimonial created successfully' });
});

router.put('/:id', authMiddleware, upload.single('image'), (req, res) => {
  const result = testimonialSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, message: 'Invalid input', errors: result.error.errors });
  }
  const existing = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Testimonial not found' });
  }
  const data = result.data;
  const image = req.file ? `/uploads/testimonials/${req.file.filename}` : (data.image_url || existing.image_url);

  db.prepare(
    'UPDATE testimonials SET name = ?, company = ?, role = ?, image_url = ?, testimonial = ?, rating = ?, project_reference = ?, featured = ?, active = ?, ordering = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(data.name, data.company, data.role || null, image, data.testimonial, data.rating || 5, data.project_reference || null, data.featured ? 1 : 0, data.active ? 1 : 0, data.ordering || 0, req.params.id);

  res.json({ success: true, message: 'Testimonial updated successfully' });
});

router.delete('/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM testimonials WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Testimonial deleted successfully' });
});

module.exports = router;
