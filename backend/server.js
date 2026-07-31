require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { requireAuth } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

app.get('/', (req, res) => {
  res.json({ message: 'Three-Way Match API is running' });
});

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  res.json({ token: process.env.STATIC_TOKEN });
});

const skuMasterRoutes = require('./routes/skuMaster.routes');
app.use('/masters/sku', skuMasterRoutes);
const documentsRoutes = require('./routes/documents.routes');
app.use('/documents', documentsRoutes);
const matchRoutes = require('./routes/match.routes');
app.use('/match', matchRoutes);
const summaryRoutes = require('./routes/summary.routes');
app.use('/summary', summaryRoutes);
const poListRoutes = require('./routes/poList.routes');
app.use('/po-list', poListRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));