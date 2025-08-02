const mineflayer = require('mineflayer');
const express = require('express');
const config = require('./settings.json');
const loggers = require('./logging.js');

const logger = loggers.logger;
const app = express();

// Web server to keep bot alive
app.get('/', (req, res) => {
  const currentUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  res.send('Keep-alive link: <a href="' + currentUrl + '">' + currentUrl + '</a>');
});

app.listen(3000, () => {
  logger.info('Web server is running on port 3000');
});

function createBot(botConfig, index = 0) {
  const bot = mineflayer.createBot({
    username: botConfig.username,
    password: botConfig.password,
    auth: botConfig.type,
    host: config.server.ip,
    port: config.server.port,
    version: config.server.version
  });

  bot.once('spawn', () => {
    logger.info(`[Bot-${index}] Joined the server as ${bot.username}`);

    // Auto-auth
    if (config.utils['auto-auth'].enabled) {
      logger.info(`[Bot-${index}] Auto-auth starting`);
      const password = config.utils['auto-auth'].password;
      setTimeout(() => {
        bot.chat(`/register ${password} ${password}`);
        bot.chat(`/login ${password}`);
        logger.info(`[Bot-${index}] Sent register/login commands`);
      }, 500);
    }

    // Chat messages
    if (config.utils['chat-messages'].enabled) {
      const messages = config.utils['chat-messages'].messages;
      if (config.utils['chat-messages'].repeat) {
        const delay = config.utils['chat-messages']['repeat-delay'];
        let i = 0;
        setInterval(() => {
          bot.chat(messages[i]);
          i = (i + 1) % messages.length;
        }, delay * 1000);
      } else {
        messages.forEach(msg => bot.chat(msg));
      }
    }

    // Anti-AFK
    if (config.utils['anti-afk'].enabled) {
      if (config.utils['anti-afk'].sneak) {
        bot.setControlState('sneak', true);
      }

      if (config.utils['anti-afk'].rotate) {
        setInterval(() => {
          bot.look(bot.entity.yaw + 1, bot.entity.pitch, true);
        }, 100);
      }

      setInterval(() => {
        bot.setControlState('jump', true);
        setTimeout(() => {
          bot.setControlState('jump', false);
        }, 500);
      }, 10000);
    }
  });

  // Log and randomly reply to chat
  bot.on('chat', (username, message) => {
    if (config.utils['chat-log']) {
      logger.info(`[Bot-${index}] <${username}> ${message}`);
    }

    if (username === bot.username) return; // ignore self

    const shouldRespond = Math.random() < 0.5; // 20% chance
    if (shouldRespond) {
      const reply = `Hello ${username}`;
      setTimeout(() => bot.chat(reply), 1000 + Math.random() * 3000);
    }
  });

  bot.on('death', () => {
    logger.warn(`[Bot-${index}] Died and respawned`);
  });

  bot.on('end', () => {
    if (config.utils['auto-reconnect']) {
      logger.warn(`[Bot-${index}] Disconnected. Reconnecting...`);
      setTimeout(() => createBot(botConfig, index), config.utils['auto-reconnect-delay']);
    }
  });

  bot.on('kicked', (reason) => {
    let reasonText = '';
    try {
      const parsed = JSON.parse(reason);
      reasonText = parsed.text || (parsed.extra?.[0]?.text ?? '');
    } catch {
      reasonText = reason;
    }
    reasonText = String(reasonText).replace(/§./g, '');
    logger.warn(`[Bot-${index}] Kicked: ${reasonText || 'Unknown reason'}`);
  });

  bot.on('error', (err) => {
    logger.error(`[Bot-${index}] Error: ${err.message}`);
  });
}

config.bots.forEach((botConfig, index) => {
  createBot(botConfig, index);
});

logger.info('All bots have been created.');
