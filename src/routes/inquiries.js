const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { z } = require('zod');

const inquirySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
  phone: z.string().optional(),
  company: z.string().optional(),
});

router.post('/', (req, res) => {
  const result = inquirySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, message: 'Invalid input', errors: result.error.errors });
  }
  const data = result.data;
  db.prepare(
    'INSERT INTO inquiries (name, email, subject, message) VALUES (?, ?, ?, ?)'
  ).run(data.name, data.email, data.subject, data.message);
  res.json({ success: true, message: 'Inquiry submitted successfully' });
});

router.post('/contact', (req, res) => {
  const result = inquirySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, message: 'Invalid input', errors: result.error.errors });
  }
  const data = result.data;
  db.prepare(
    'INSERT INTO inquiries (name, email, subject, message) VALUES (?, ?, ?, ?)'
  ).run(data.name, data.email, data.subject, data.message);
  res.json({ success: true, message: 'Inquiry submitted successfully' });
});

router.get('/', authMiddleware, (req, res) => {
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

router.put('/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE inquiries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  res.json({ success: true, message: 'Status updated' });
});

module.exports = router;
