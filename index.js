require('dotenv').config();
const mineflayer = require('mineflayer');
const express = require('express');
const loggers = require('./logging.js');
const logger = loggers.logger;
const app = express();

app.get('/', (req, res) => {
  // Get the current URL from the request
  const currentUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const htmlResponse = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bot Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white font-sans min-h-screen flex items-center justify-center p-4">
  <div class="bg-gray-800 p-8 md:p-12 rounded-2xl shadow-2xl text-center max-w-4xl w-full">
    <div class="space-y-4">
      <h1 class="text-4xl md:text-5xl font-extrabold text-blue-400">Bot Dashboard</h1>
      <p class="text-gray-300 text-xl font-light">
        Your hub for monitoring and controlling your Minecraft bots.
      </p>
    </div>

    <div class="mt-8">
      <a href="${currentUrl}" class="
        inline-block
        px-10 py-4
        bg-blue-600 hover:bg-blue-700
        text-white font-bold
        rounded-full shadow-lg
        transform transition-transform duration-300 hover:scale-105
        text-lg
      ">
        ${currentUrl}
      </a>
      <p class="mt-4 text-gray-400 text-sm">Click the link to keep the server alive.</p>
    </div>

    <div class="mt-12 pt-8 border-t border-gray-700 text-left">
      <h2 class="text-3xl font-bold text-blue-300 mb-6">Core Functions</h2>
      <ul class="grid md:grid-cols-2 gap-6 text-lg">
        <li class="p-4 bg-gray-700 rounded-lg shadow-md">
          <span class="text-white font-bold">Auto Authentication:</span> Automatically logs into servers with stored credentials.
        </li>
        <li class="p-4 bg-gray-700 rounded-lg shadow-md">
          <span class="text-white font-bold">Anti-AFK:</span> Simulates player activity to prevent timeouts and kicks.
        </li>
        <li class="p-4 bg-gray-700 rounded-lg shadow-md">
          <span class="text-white font-bold">Auto Reconnect:</span> Ensures bot rejoins the server after any disconnection.
        </li>
        <li class="p-4 bg-gray-700 rounded-lg shadow-md">
          <span class="text-white font-bold">Chat Responses:</span> Engages with players by sending automated, time-gated replies.
        </li>
      </ul>
    </div>

    <div class="mt-12 pt-8 border-t border-dashed border-gray-600 text-left">
      <h2 class="text-3xl font-bold text-yellow-400 mb-6">🚧 Coming Soon</h2>
      <ul class="grid md:grid-cols-2 gap-6 text-lg">
        <li class="p-4 bg-gray-700 rounded-lg shadow-md">
          <span class="text-white font-bold">Advanced Features:</span> Smarter AI, inventory management, and more complex tasks.
        </li>
        <li class="p-4 bg-gray-700 rounded-lg shadow-md">
          <span class="text-white font-bold">Web Control Panel:</span> A full browser-based interface to manage all bot functions.
        </li>
      </ul>
    </div>
  </div>
</body>
</html>
  `;

  // Send the newly designed HTML
  res.send(htmlResponse);
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
