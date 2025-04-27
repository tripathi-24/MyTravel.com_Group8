// generateAdminToken.js
require('dotenv').config();
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    id: 'main_admin',
    email: 'admin@example.com',
    role: 'admin'
  },
  '3kfjv9832hf!@9sdklf2lfjWQElKZ', // 👈 Use the exact JWT_SECRET from backend
  { expiresIn: '1d' }
);

console.log('🔐 Admin Token:\n', token);
