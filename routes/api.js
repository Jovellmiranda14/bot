// routes/api.js
const express = require('express');
const router = express.Router();
const { getBotsStatus, startBot, stopBot } = require('../bot_modules/bot-manager.js');
const { logger } = require('../logging.js');

router.get('/bots', (req, res) => {
  const botsStatus = getBotsStatus();
  res.json(botsStatus);
});

router.post('/control', (req, res) => {
  const { command, index } = req.body;
  const bot = getBotsStatus().find(b => b.index === index);

  if (!bot) {
    logger.error(`[Server] Command '${command}' failed. Bot-${index} not found.`);
    return res.status(404).json({ error: 'Bot not found' });
  }

  if (command === 'start' && bot.status !== 'online') {
    logger.info(`[Server] Received 'start' command for Bot-${index}.`);
    startBot(index);
    return res.status(200).json({ message: `Bot-${index} started.` });
  }

  if (command === 'stop' && bot.status === 'online') {
    logger.info(`[Server] Received 'stop' command for Bot-${index}.`);
    stopBot(index);
    return res.status(200).json({ message: `Bot-${index} stopped.` });
  }

  logger.warn(`[Server] Invalid command '${command}' for Bot-${index}. Bot is already ${bot.status}.`);
  res.status(400).json({ error: `Invalid command or bot is already ${command === 'start' ? 'online' : 'offline'}.` });
});

module.exports = router;