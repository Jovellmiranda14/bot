// index.js
require('dotenv').config();
const express = require('express');
const { logger } = require('./logging.js');
const apiRoutes = require('./routes/api.js');
const dashboardRoutes = require('./routes/dashboard.js');
const { initializeBots } = require('./bot_modules/bot-manager.js');

const app = express();
const port = 3000;

app.use(express.json());

// Use the route files
app.use('/api', apiRoutes);
app.use('/', dashboardRoutes);

// Start the server
app.listen(port, () => {
  logger.info(`Web server is running on port ${port}. Access the dashboard at http://localhost:${port}`);
  initializeBots();
});