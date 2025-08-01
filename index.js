const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Your bot is alive! Visit: <a href="https://your-railway-app-url">Bot on Railway</a>');
});

module.exports = app;