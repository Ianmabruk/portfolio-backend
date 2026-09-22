#!/usr/bin/env node
const { db } = require('../config/database');

// Clean up duplicate social links - keep only one per platform
const allLinks = db.prepare('SELECT * FROM social_links ORDER BY id').all();
const seen = new Set();
for (const link of allLinks) {
  const key = link.platform;
  if (seen.has(key)) {
    db.prepare('DELETE FROM social_links WHERE id = ?').run(link.id);
    console.log(`Deleted duplicate social link: ${link.platform} (id:${link.id})`);
  } else {
    seen.add(key);
  }
}

// Clean up duplicate services - keep only one per slug
const allServices = db.prepare('SELECT * FROM services ORDER BY id').all();
const seenServices = new Set();
for (const svc of allServices) {
  const key = svc.slug;
  if (seenServices.has(key)) {
    db.prepare('DELETE FROM services WHERE id = ?').run(svc.id);
    console.log(`Deleted duplicate service: ${svc.title} (id:${svc.id})`);
  } else {
    seenServices.add(key);
  }
}

// Clean up duplicate testimonials
const allTestimonials = db.prepare('SELECT * FROM testimonials ORDER BY id').all();
const seenTestimonials = new Set();
for (const t of allTestimonials) {
  const key = `${t.name}-${t.company}-${t.testimonial}`;
  if (seenTestimonials.has(key)) {
    db.prepare('DELETE FROM testimonials WHERE id = ?').run(t.id);
    console.log(`Deleted duplicate testimonial: ${t.name} (id:${t.id})`);
  } else {
    seenTestimonials.add(key);
  }
}

// Clean up duplicate admin users - keep only the new one
const allAdmins = db.prepare('SELECT * FROM admin_users ORDER BY id').all();
if (allAdmins.length > 1) {
  for (const admin of allAdmins) {
    if (admin.email !== 'Mabricks@gmail.com') {
      db.prepare('DELETE FROM admin_users WHERE id = ?').run(admin.id);
      console.log(`Deleted old admin: ${admin.email} (id:${admin.id})`);
    }
  }
}

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

console.log('Database cleanup completed');
