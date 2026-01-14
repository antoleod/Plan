const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const excelRoutes = require('./routes/excel');
const authRoutes = require('./routes/auth');
const planningRoutes = require('./routes/planning');
const auditRoutes = require('./routes/audit');
const insightsRoutes = require('./routes/insights'); // Nueva ruta
const preplanRoutes = require('./routes/preplan'); // Nueva ruta
const reportsRoutes = require('./routes/reports'); // Nueva ruta

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/excel', excelRoutes);
app.use('/api/planning', planningRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/insights', insightsRoutes); // Registrar nueva ruta
app.use('/api/preplan', preplanRoutes); // Registrar nueva ruta
app.use('/api/reports', reportsRoutes); // Registrar nueva ruta

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
