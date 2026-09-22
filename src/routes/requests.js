const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { z } = require('zod');

const requestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  service: z.string().min(1),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  description: z.string().min(1),
});

router.post('/', (req, res) => {
  const result = requestSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, message: 'Invalid input', errors: result.error.errors });
  }
  const data = result.data;
  db.prepare(
    'INSERT INTO service_requests (name, email, phone, company, service, budget, timeline, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(data.name, data.email, data.phone || null, data.company || null, data.service, data.budget || null, data.timeline || null, data.description);
  res.json({ success: true, message: 'Service request submitted successfully' });
});

router.get('/', authMiddleware, (req, res) => {
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

router.put('/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE service_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  res.json({ success: true, message: 'Status updated' });
});

module.exports = router;
