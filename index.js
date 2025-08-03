require('dotenv').config();
const mineflayer = require('mineflayer');
const express = require('express');
const loggers = require('./logging.js');
const logger = loggers.logger;
const app = express();

app.get('/', (req, res) => {
  const currentUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  res.send('Keep-alive link: <a href="' + currentUrl + '">' + currentUrl + '</a>');
});

app.listen(3000, () => {
  logger.info('Web server is running on port 3000');
});

const bots = Array.from({ length: parseInt(process.env.BOT_COUNT) }).map((_, i) => ({
  username: process.env[`BOT_${i}_USERNAME`],
  password: process.env[`BOT_${i}_PASSWORD`] || '',
  type: process.env[`BOT_${i}_TYPE`] || 'offline'
}));

function createBot(botConfig, index = 0) {
  const bot = mineflayer.createBot({
    username: botConfig.username,
    password: botConfig.password,
    auth: botConfig.type,
    host: process.env.SERVER_IP,
    port: parseInt(process.env.SERVER_PORT),
    version: process.env.SERVER_VERSION
  });

  bot.once('spawn', () => {
    logger.info(`[Bot-${index}] Joined as ${bot.username}`);

    if (process.env.AUTO_AUTH_ENABLED === 'true') {
      logger.info(`[Bot-${index}] Auto-auth enabled`);
      const password = process.env.AUTO_AUTH_PASSWORD;
      setTimeout(() => {
        bot.chat(`/register ${password} ${password}`);
        bot.chat(`/login ${password}`);
      }, 500);
    }

    if (process.env.CHAT_MESSAGES_ENABLED === 'true') {
      const messages = process.env.CHAT_MESSAGES_LIST.split(',');
      if (process.env.CHAT_MESSAGES_REPEAT === 'true') {
        const delay = parseInt(process.env.CHAT_MESSAGES_REPEAT_DELAY);
        let i = 0;
        setInterval(() => {
          bot.chat(messages[i]);
          i = (i + 1) % messages.length;
        }, delay * 1000);
      } else {
        messages.forEach(msg => bot.chat(msg));
      }
    }

    if (process.env.ANTI_AFK_ENABLED === 'true') {
      if (process.env.ANTI_AFK_SNEAK === 'true') bot.setControlState('sneak', true);

      if (process.env.ANTI_AFK_ROTATE === 'true') {
        setInterval(() => {
          bot.look(bot.entity.yaw + 1, bot.entity.pitch, true);
        }, 100);
      }

      if (process.env.ANTI_AFK_JUMP === 'true') {
        setInterval(() => {
          bot.setControlState('jump', true);
          setTimeout(() => {
            bot.setControlState('jump', false);
          }, 500);
        }, 10000);
      }
    }
  });

  const lastReplyTime = new Map();

  bot.on('chat', (username, message) => {
    if (process.env.CHAT_LOG === 'true') {
      logger.info(`[Bot-${index}] <${username}> ${message}`);
    }

    if (username === bot.username) return;

    const now = Date.now();
    const last = lastReplyTime.get(username) || 0;
    const FIVE_MIN = 5 * 60 * 1000;

    if (now - last >= FIVE_MIN && Math.random() < 0.2) {
      setTimeout(() => bot.chat(`Hello ${username}`), 500 + Math.random() * 1500);
      lastReplyTime.set(username, now);
    }
  });

  bot.on('death', () => logger.warn(`[Bot-${index}] Died and respawned`));

  bot.on('end', () => {
    if (process.env.AUTO_RECONNECT === 'true') {
      logger.warn(`[Bot-${index}] Disconnected. Reconnecting...`);
      setTimeout(() => createBot(botConfig, index), parseInt(process.env.AUTO_RECONNECT_DELAY));
    }
  });

  bot.on('kicked', (reason) => {
    try {
      const parsed = JSON.parse(reason);
      logger.warn(`[Bot-${index}] Kicked: ${parsed.text || parsed.extra?.[0]?.text || 'Unknown'}`);
    } catch {
      logger.warn(`[Bot-${index}] Kicked: ${reason}`);
    }
  });

  bot.on('error', (err) => {
    logger.error(`[Bot-${index}] Error: ${err.message}`);
  });
}

bots.forEach((botConfig, index) => createBot(botConfig, index));

logger.info('All bots initialized.');
