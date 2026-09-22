#!/usr/bin/env node
const { db } = require('../config/database');

// Delete "Mobile Applications" (old name), keep "Mobile Apps"
db.prepare("DELETE FROM services WHERE slug = 'mobile-applications'").run();

// Delete X social link (not in required list)
db.prepare("DELETE FROM social_links WHERE platform = 'X'").run();

// Reorder services
const services = db.prepare('SELECT * FROM services ORDER BY title').all();
services.forEach((svc, i) => {
  db.prepare('UPDATE services SET ordering = ? WHERE id = ?').run(i + 1, svc.id);
});

// Reorder social links
const links = db.prepare('SELECT * FROM social_links ORDER BY platform').all();
links.forEach((link, i) => {
  db.prepare('UPDATE social_links SET ordering = ? WHERE id = ?').run(i + 1, link.id);
});

// Verify final state
console.log('=== Final Services ===');
console.log(db.prepare('SELECT id, title, slug, ordering FROM services ORDER BY ordering').all());
console.log('=== Final Social Links ===');
console.log(db.prepare('SELECT * FROM social_links ORDER BY ordering').all());

console.log('Fix completed');
