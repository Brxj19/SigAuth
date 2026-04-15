require('dotenv').config();

const cors = require('cors');
const express = require('express');
const morgan = require('morgan');

const { authenticateRequest } = require('./middlewares/authenticate');

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4101'
  })
);
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'logistica-delivery-backend',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/me', authenticateRequest, (req, res) => {
  const organization = req.user.org_name || req.user.organization || req.user.tenant || null;

  res.json({
    user: {
      sub: req.user.sub,
      name: req.user.name || req.user.email || 'User',
      email: req.user.email || null,
      organization,
      roles: Array.isArray(req.user.roles) ? req.user.roles : [],
      permissions: Array.isArray(req.user.permissions) ? req.user.permissions : [],
      appRoles: Array.isArray(req.user.app_roles) ? req.user.app_roles : [],
      clientRole: req.clientRole
    }
  });
});

app.use((err, req, res, next) => {
  if (!err) return next();

  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Unexpected server error'
  });
});

module.exports = app;

