const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../utils/upload');
const { z } = require('zod');

const projectSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  client: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  challenge: z.string().optional(),
  solution: z.string().optional(),
  process: z.string().optional(),
  technologies: z.string().optional(),
  results: z.string().optional(),
  testimonial: z.string().optional(),
  year: z.number().optional(),
  project_url: z.string().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  ordering: z.number().optional(),
});

router.get('/', (req, res) => {
  const { featured, category } = req.query;
  let query = 'SELECT * FROM portfolio_projects WHERE active = 1';
  const params = [];
  if (featured === 'true') {
    query += ' AND featured = 1';
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  query += ' ORDER BY ordering ASC, id DESC';
  const projects = db.prepare(query).all(...params);
  res.json({ success: true, data: projects });
});

router.get('/:id(\\d+)', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid project ID' });
  }
  const project = db.prepare('SELECT * FROM portfolio_projects WHERE id = ? AND active = 1').get(id);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }
  const images = db.prepare('SELECT * FROM project_images WHERE project_id = ? ORDER BY ordering ASC').all(project.id);
  const caseStudy = db.prepare('SELECT * FROM case_studies WHERE project_id = ?').get(project.id);
  res.json({ success: true, data: { ...project, images, caseStudy } });
});

router.get('/slug/:slug', (req, res) => {
  const project = db.prepare('SELECT * FROM portfolio_projects WHERE slug = ? AND active = 1').get(req.params.slug);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }
  const images = db.prepare('SELECT * FROM project_images WHERE project_id = ? ORDER BY ordering ASC').all(project.id);
  const caseStudy = db.prepare('SELECT * FROM case_studies WHERE project_id = ?').get(project.id);
  res.json({ success: true, data: { ...project, images, caseStudy } });
});

router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM portfolio_projects WHERE active = 1').all();
  res.json({ success: true, data: categories.map(c => c.category) });
});

router.post('/', authMiddleware, upload.single('cover_image'), (req, res) => {
  const result = projectSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, message: 'Invalid input', errors: result.error.errors });
  }

  const data = result.data;
  const coverImage = req.file ? `/uploads/portfolio/${req.file.filename}` : data.cover_image || null;

  const info = db.prepare(
    'INSERT INTO portfolio_projects (title, slug, client, category, description, challenge, solution, process, technologies, results, testimonial, year, project_url, cover_image, featured, active, ordering) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    data.title, data.slug, data.client, data.category, data.description,
    data.challenge || null, data.solution || null, data.process || null, data.technologies || null,
    data.results || null, data.testimonial || null, data.year || null, data.project_url || null,
    coverImage, data.featured ? 1 : 0, data.active ? 1 : 1, data.ordering || 0
  );

  res.json({ success: true, data: { id: info.lastInsertRowid }, message: 'Project created successfully' });
});

router.put('/:id', authMiddleware, upload.single('cover_image'), (req, res) => {
  const result = projectSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, message: 'Invalid input', errors: result.error.errors });
  }

  const existing = db.prepare('SELECT * FROM portfolio_projects WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  const data = result.data;
  const coverImage = req.file ? `/uploads/portfolio/${req.file.filename}` : (data.cover_image || existing.cover_image);

  db.prepare(
    'UPDATE portfolio_projects SET title = ?, slug = ?, client = ?, category = ?, description = ?, challenge = ?, solution = ?, process = ?, technologies = ?, results = ?, testimonial = ?, year = ?, project_url = ?, cover_image = ?, featured = ?, active = ?, ordering = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(
    data.title, data.slug, data.client, data.category, data.description,
    data.challenge || null, data.solution || null, data.process || null, data.technologies || null,
    data.results || null, data.testimonial || null, data.year || null, data.project_url || null,
    coverImage, data.featured ? 1 : 0, data.active ? 1 : 0, data.ordering || 0, req.params.id
  );

  res.json({ success: true, message: 'Project updated successfully' });
});

router.delete('/:id', authMiddleware, (req, res) => {
  const existing = db.prepare('SELECT * FROM portfolio_projects WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }
  db.prepare('DELETE FROM portfolio_projects WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Project deleted successfully' });
});

module.exports = router;
