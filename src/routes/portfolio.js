const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { db } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../utils/upload');
const { z } = require('zod');

const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads');

/**
 * multipart/form-data delivers booleans as strings, so "false" would otherwise be
 * truthy and every unchecked box would be stored as enabled.
 */
const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'on';
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const optional = (value) => {
  if (value === undefined) return null;
  const trimmed = typeof value === 'string' ? value.trim() : value;
  return trimmed === '' ? null : trimmed;
};

/** Deletes an uploaded file, refusing any path outside the uploads root. */
const removeUploadedFile = async (url) => {
  if (!url || typeof url !== 'string' || !url.startsWith('/uploads/')) return;

  const target = path.resolve(UPLOADS_ROOT, url.replace('/uploads/', ''));
  if (target !== UPLOADS_ROOT && !target.startsWith(UPLOADS_ROOT + path.sep)) return;

  try {
    await fs.promises.unlink(target);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error(`Failed to remove ${target}:`, err.message);
  }
};

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
  year: z.union([z.string(), z.number()]).optional(),
  project_url: z.string().optional(),
  github_url: z.string().optional(),
  status: z.string().optional(),
  featured: z.union([z.boolean(), z.string(), z.number()]).optional(),
  active: z.union([z.boolean(), z.string(), z.number()]).optional(),
  ordering: z.union([z.string(), z.number()]).optional(),
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

  // Attach gallery images so consumers get a complete project in one request.
  const data = projects.map((project) => ({
    ...project,
    images: db
      .prepare('SELECT * FROM project_images WHERE project_id = ? ORDER BY ordering ASC, id ASC')
      .all(project.id),
  }));

  res.json({ success: true, data });
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
  const coverImage = req.file ? `/uploads/portfolio/${req.file.filename}` : optional(data.cover_image);

  const info = db.prepare(
    'INSERT INTO portfolio_projects (title, slug, client, category, description, challenge, solution, process, technologies, results, testimonial, year, project_url, github_url, status, cover_image, featured, active, ordering) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    data.title, data.slug, data.client, data.category, data.description,
    optional(data.challenge), optional(data.solution), optional(data.process), optional(data.technologies),
    optional(data.results), optional(data.testimonial),
    data.year ? toNumber(data.year, null) : null,
    optional(data.project_url), optional(data.github_url),
    optional(data.status) || 'live',
    coverImage,
    toBool(data.featured) ? 1 : 0,
    toBool(data.active, true) ? 1 : 0,
    toNumber(data.ordering, 0)
  );

  res.status(201).json({ success: true, data: { id: info.lastInsertRowid }, message: 'Project created successfully' });
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
  const previousCover = existing.cover_image;
  const coverImage = req.file ? `/uploads/portfolio/${req.file.filename}` : (optional(data.cover_image) || previousCover);

  // Fields the caller omitted keep their stored value, so a partial update cannot
  // erase URLs that were not sent.
  const keep = (value, stored) => (value === undefined ? stored ?? null : optional(value));

  db.prepare(
    'UPDATE portfolio_projects SET title = ?, slug = ?, client = ?, category = ?, description = ?, challenge = ?, solution = ?, process = ?, technologies = ?, results = ?, testimonial = ?, year = ?, project_url = ?, github_url = ?, status = ?, cover_image = ?, featured = ?, active = ?, ordering = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(
    data.title, data.slug, data.client, data.category, data.description,
    optional(data.challenge), optional(data.solution), optional(data.process), optional(data.technologies),
    optional(data.results), optional(data.testimonial),
    data.year === undefined ? existing.year : (data.year ? toNumber(data.year, null) : null),
    keep(data.project_url, existing.project_url),
    keep(data.github_url, existing.github_url),
    optional(data.status) || existing.status || 'live',
    coverImage,
    toBool(data.featured) ? 1 : 0,
    toBool(data.active) ? 1 : 0,
    toNumber(data.ordering, 0),
    req.params.id
  );

  // Replacing the cover image should not leave the previous file behind.
  if (req.file && previousCover && previousCover !== coverImage) {
    removeUploadedFile(previousCover);
  }

  res.json({ success: true, message: 'Project updated successfully' });
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const existing = db.prepare('SELECT * FROM portfolio_projects WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  // project_images rows are removed by ON DELETE CASCADE; the files are not.
  const images = db.prepare('SELECT image_url FROM project_images WHERE project_id = ?').all(existing.id);
  db.prepare('DELETE FROM portfolio_projects WHERE id = ?').run(req.params.id);

  await Promise.all([
    removeUploadedFile(existing.cover_image),
    ...images.map((image) => removeUploadedFile(image.image_url)),
  ]);

  res.json({ success: true, message: 'Project deleted successfully' });
});

/* ----------------------------- gallery images ----------------------------- */

router.post('/:id/images', authMiddleware, upload.single('image'), async (req, res) => {
  const project = db.prepare('SELECT id FROM portfolio_projects WHERE id = ?').get(req.params.id);
  if (!project) {
    if (req.file) await removeUploadedFile(`/uploads/portfolio/${req.file.filename}`);
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  const imageUrl = req.file ? `/uploads/portfolio/${req.file.filename}` : optional(req.body.image_url);
  if (!imageUrl) {
    return res.status(400).json({ success: false, message: 'An image file or image_url is required' });
  }

  const nextOrdering = db
    .prepare('SELECT COALESCE(MAX(ordering), 0) + 1 AS next FROM project_images WHERE project_id = ?')
    .get(project.id).next;

  const info = db.prepare(
    'INSERT INTO project_images (project_id, image_url, alt_text, ordering) VALUES (?, ?, ?, ?)'
  ).run(project.id, imageUrl, optional(req.body.alt_text), toNumber(req.body.ordering, nextOrdering));

  res.status(201).json({
    success: true,
    data: db.prepare('SELECT * FROM project_images WHERE id = ?').get(info.lastInsertRowid),
    message: 'Image added',
  });
});

router.put('/:id/images/:imageId', authMiddleware, (req, res) => {
  const image = db
    .prepare('SELECT * FROM project_images WHERE id = ? AND project_id = ?')
    .get(req.params.imageId, req.params.id);
  if (!image) {
    return res.status(404).json({ success: false, message: 'Image not found' });
  }

  db.prepare('UPDATE project_images SET alt_text = ?, ordering = ? WHERE id = ?').run(
    optional(req.body.alt_text) || image.alt_text,
    toNumber(req.body.ordering, image.ordering),
    image.id
  );

  res.json({
    success: true,
    data: db.prepare('SELECT * FROM project_images WHERE id = ?').get(image.id),
    message: 'Image updated',
  });
});

router.delete('/:id/images/:imageId', authMiddleware, async (req, res) => {
  const image = db
    .prepare('SELECT * FROM project_images WHERE id = ? AND project_id = ?')
    .get(req.params.imageId, req.params.id);
  if (!image) {
    return res.status(404).json({ success: false, message: 'Image not found' });
  }

  db.prepare('DELETE FROM project_images WHERE id = ?').run(image.id);
  await removeUploadedFile(image.image_url);

  res.json({ success: true, message: 'Image deleted' });
});

module.exports = router;
