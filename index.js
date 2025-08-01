const mineflayer = require('mineflayer');
const express = require('express');
const config = require('./settings.json');
const loggers = require('./logging.js');

const logger = loggers.logger;
const app = express();

// Web server to prevent the app from idling (for Render/Railway)
app.get('/', (req, res) => {
  const currentUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  res.send(
    'Link to keep alive: <a href="' + currentUrl + '">' + currentUrl + '</a>'
  );
});

app.listen(3000, () => {
  logger.info('Web server is running on port 3000');
});

function createBot() {
  const bot = mineflayer.createBot({
    username: config['bot-account']['username'],
    password: config['bot-account']['password'],
    auth: config['bot-account']['type'], // 'microsoft' or 'mojang'
    host: config.server.ip,
    port: config.server.port,
    version: config.server.version
  });

  bot.once('spawn', () => {
    logger.info('Bot joined the server');

    // Auto-authentication
    if (config.utils['auto-auth'].enabled) {
      logger.info('Auto-auth module started');
      let password = config.utils['auto-auth'].password;
      setTimeout(() => {
        bot.chat(`/register ${password} ${password}`);
        bot.chat(`/login ${password}`);
        logger.info('Sent register/login commands');
      }, 500);
    }

    // Periodic chat messages
    if (config.utils['chat-messages'].enabled) {
      logger.info('Chat-messages module started');
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

    // Anti-AFK module
    if (config.utils['anti-afk'].enabled) {
      if (config.utils['anti-afk'].sneak) {
        bot.setControlState('sneak', true);
      }

      if (config.utils['anti-afk'].rotate) {
        setInterval(() => {
          bot.look(bot.entity.yaw + 1, bot.entity.pitch, true);
        }, 100);
      }

      // Jump every 10 seconds
      setInterval(() => {
        logger.info('Bot is jumping...');
        bot.setControlState('jump', true);
        setTimeout(() => {
          bot.setControlState('jump', false);
          logger.info('Jump completed.');
        }, 500);
      }, 10000);
    }
  });

  // Chat logging
  bot.on('chat', (username, message) => {
    if (config.utils['chat-log']) {
      logger.info(`<${username}> ${message}`);
    }
  });

  // Bot death logging
  bot.on('death', () => {
    logger.warn(`Bot died and respawned at ${bot.entity.position}`);
  });

  // Auto-reconnect on end
  if (config.utils['auto-reconnect']) {
    bot.on('end', () => {
      logger.warn('Bot disconnected. Reconnecting...');
      setTimeout(() => {
        createBot();
      }, config.utils['auto-reconnect-delay']);
    });
  }

  // Handle kicks
  bot.on('kicked', (reason) => {
    let reasonText = '';
    try {
      const reasonJson = JSON.parse(reason);
      reasonText = reasonJson.text || (reasonJson.extra?.[0]?.text ?? '');
    } catch (e) {
      reasonText = reason;
    }

    if (reasonText) {
      reasonText = reasonText.replace(/§./g, ''); // Remove Minecraft color codes
      logger.warn(`Bot was kicked: ${reasonText}`);
    } else {
      logger.warn(`Bot was kicked. Reason could not be determined.`);
    }
  });

  // Handle unexpected errors
  bot.on('error', (err) => {
    logger.error(`Bot error: ${err.message}`);
  });
}

createBot();
