const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { initDatabase } = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'https://mabricks.netlify.app',
  'https://www.mabricks.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000',
];
const frontendUrl = process.env.FRONTEND_URL || 'https://mabrix-tech.netlify.app';

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin === frontendUrl) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

initDatabase();

app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/services'));
app.use('/api/projects', require('./routes/portfolio'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/community', require('./routes/community'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/contact', require('./routes/inquiries'));
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/social-links', require('./routes/socialLinks'));
app.use('/api/media', require('./routes/media'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/home', require('./routes/home'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`Mabrix Technologies API running on port ${PORT}`);
});
