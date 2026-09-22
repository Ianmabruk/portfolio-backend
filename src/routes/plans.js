const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { z } = require('zod');

const planSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  price: z.number().min(0),
  billing_period: z.string().optional(),
  description: z.string().min(1),
  features: z.string().min(1),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  ordering: z.number().optional(),
});

router.get('/', (req, res) => {
  const plans = db.prepare('SELECT * FROM plans WHERE active = 1 ORDER BY ordering ASC, id ASC').all();
  res.json({ success: true, data: plans });
});

router.post('/', authMiddleware, (req, res) => {
  const result = planSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, message: 'Invalid input', errors: result.error.errors });
  }
  const data = result.data;
  db.prepare(
    'INSERT INTO plans (name, slug, price, billing_period, description, features, featured, active, ordering) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(data.name, data.slug, data.price, data.billing_period || 'monthly', data.description, data.features, data.featured ? 1 : 0, data.active ? 1 : 1, data.ordering || 0);
  res.json({ success: true, message: 'Plan created successfully' });
});

router.put('/:id', authMiddleware, (req, res) => {
  const result = planSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, message: 'Invalid input', errors: result.error.errors });
  }
  const existing = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Plan not found' });
  }
  const data = result.data;
  db.prepare(
    'UPDATE plans SET name = ?, slug = ?, price = ?, billing_period = ?, description = ?, features = ?, featured = ?, active = ?, ordering = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(data.name, data.slug, data.price, data.billing_period || 'monthly', data.description, data.features, data.featured ? 1 : 0, data.active ? 1 : 0, data.ordering || 0, req.params.id);
  res.json({ success: true, message: 'Plan updated successfully' });
});

router.delete('/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM plans WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Plan deleted successfully' });
});

module.exports = router;
