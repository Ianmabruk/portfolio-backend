const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, '../../uploads/mabrix.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      content TEXT,
      icon TEXT,
      image TEXT,
      featured INTEGER DEFAULT 0,
      ordering INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS portfolio_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      client TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      challenge TEXT,
      solution TEXT,
      process TEXT,
      technologies TEXT,
      results TEXT,
      testimonial TEXT,
      year INTEGER,
      project_url TEXT,
      cover_image TEXT,
      featured INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      ordering INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      alt_text TEXT,
      ordering INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES portfolio_projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS case_studies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      challenge TEXT NOT NULL,
      solution TEXT NOT NULL,
      process TEXT NOT NULL,
      technologies TEXT NOT NULL,
      results TEXT NOT NULL,
      testimonial TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES portfolio_projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      role TEXT,
      image_url TEXT,
      testimonial TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      project_reference TEXT,
      featured INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      ordering INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      price REAL NOT NULL,
      billing_period TEXT DEFAULT 'monthly',
      description TEXT NOT NULL,
      features TEXT NOT NULL,
      featured INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      ordering INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS community_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      interest TEXT,
      company TEXT,
      message TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      company TEXT,
      service TEXT NOT NULL,
      budget TEXT,
      timeline TEXT,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'new',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      phone TEXT,
      company TEXT,
      status TEXT DEFAULT 'new',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS social_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      url TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      ordering INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS media_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      url TEXT NOT NULL,
      alt_text TEXT,
      category TEXT DEFAULT 'general',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      type TEXT DEFAULT 'text',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      admin_id INTEGER,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
    CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
    CREATE INDEX IF NOT EXISTS idx_portfolio_slug ON portfolio_projects(slug);
    CREATE INDEX IF NOT EXISTS idx_portfolio_active ON portfolio_projects(active);
    CREATE INDEX IF NOT EXISTS idx_testimonials_active ON testimonials(active);
    CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(active);
    CREATE INDEX IF NOT EXISTS idx_community_email ON community_members(email);
    CREATE INDEX IF NOT EXISTS idx_social_links_platform ON social_links(platform);
    CREATE INDEX IF NOT EXISTS idx_media_category ON media_assets(category);
  `);

  try { db.prepare('ALTER TABLE services ADD COLUMN content TEXT').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE inquiries ADD COLUMN phone TEXT').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE inquiries ADD COLUMN company TEXT').run(); } catch (e) {}

  const defaultAdmin = db.prepare('SELECT * FROM admin_users WHERE email = ?').get('Mabricks@gmail.com');
  if (!defaultAdmin) {
    const hash = bcrypt.hashSync('Admin 123', 10);
    db.prepare('INSERT INTO admin_users (email, password_hash, name) VALUES (?, ?, ?)').run(
      'Mabricks@gmail.com',
      hash,
      'Admin'
    );
    console.log('Default admin created: Mabricks@gmail.com');
  }

  const defaultSettings = [
    ['site_title', 'Mabrix Technologies', 'text'],
    ['site_description', 'We build digital experiences that move businesses forward.', 'text'],
    ['hero_eyebrow', 'MABRIX TECHNOLOGIES', 'text'],
    ['hero_heading', 'We build digital experiences that move businesses forward.', 'text'],
    ['hero_description', 'We design and build modern digital products, websites and technology experiences that help ambitious businesses grow.', 'text'],
    ['contact_email', 'hello@mabrix.com', 'text'],
    ['contact_phone', '', 'text'],
    ['stats_projects', '20+', 'text'],
    ['stats_businesses', '10+', 'text'],
    ['stats_solutions', '5+', 'text'],
    ['stats_commitment', '100%', 'text'],
  ];

  const insertSetting = db.prepare('INSERT OR IGNORE INTO site_settings (key, value, type) VALUES (?, ?, ?)');
  defaultSettings.forEach(([key, value, type]) => {
    insertSetting.run(key, value, type);
  });

  try {
    db.prepare('ALTER TABLE services ADD COLUMN content TEXT').run();
  } catch (e) {
    // column already exists
  }
  try {
    db.prepare('ALTER TABLE inquiries ADD COLUMN phone TEXT').run();
  } catch (e) {
    // column already exists
  }
  try {
    db.prepare('ALTER TABLE inquiries ADD COLUMN company TEXT').run();
  } catch (e) {
    // column already exists
  }

  console.log('Database initialized successfully');
};

module.exports = { db, initDatabase };
