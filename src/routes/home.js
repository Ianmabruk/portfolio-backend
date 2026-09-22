const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

router.get('/', (req, res) => {
  const services = db.prepare('SELECT * FROM services WHERE active = 1 ORDER BY ordering ASC').all();
  const projects = db.prepare('SELECT * FROM portfolio_projects WHERE active = 1 AND featured = 1 ORDER BY ordering ASC').all();
  const testimonials = db.prepare('SELECT * FROM testimonials WHERE active = 1 ORDER BY ordering ASC').all();
  const settings = db.prepare('SELECT * FROM site_settings').all();
  const socialLinks = db.prepare('SELECT * FROM social_links WHERE active = 1 ORDER BY ordering ASC').all();

  const settingsData = {};
  settings.forEach(s => { settingsData[s.key] = s.value; });

  res.json({
    success: true,
    data: {
      services,
      projects,
      testimonials,
      settings: settingsData,
      socialLinks,
    },
  });
});

module.exports = router;
