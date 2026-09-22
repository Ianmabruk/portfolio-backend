const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { z } = require('zod');

const communitySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  interest: z.string().optional(),
  company: z.string().optional(),
  message: z.string().optional(),
});

router.post('/', (req, res) => {
  const result = communitySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, message: 'Invalid input', errors: result.error.errors });
  }
  const data = result.data;
  db.prepare(
    'INSERT INTO community_members (name, email, phone, interest, company, message) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(data.name, data.email, data.phone || null, data.interest || null, data.company || null, data.message || null);
  res.json({ success: true, message: "You're in. We'll be in touch." });
});

router.post('/join', (req, res) => {
  const result = communitySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, message: 'Invalid input', errors: result.error.errors });
  }
  const data = result.data;
  db.prepare(
    'INSERT INTO community_members (name, email, phone, interest, company, message) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(data.name, data.email, data.phone || null, data.interest || null, data.company || null, data.message || null);
  res.json({ success: true, message: "You're in. We'll be in touch." });
});

router.get('/', (req, res) => {
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

router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE community_members SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true, message: 'Status updated' });
});

module.exports = router;
