#!/usr/bin/env node
const { db } = require('../config/database');

const order = [
  'web-development',
  'software-development',
  'ui-ux-design',
  'mobile-apps',
  'digital-marketing',
  'graphics-design',
];

order.forEach((slug, i) => {
  db.prepare('UPDATE services SET ordering = ? WHERE slug = ?').run(i + 1, slug);
});

console.log('Service ordering updated');
