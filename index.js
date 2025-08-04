require('dotenv').config();
const mineflayer = require('mineflayer');
const express = require('express');
const { logger } = require('./logging.js');

const app = express();
const activeBots = [];

app.use(express.json());

// Bots Status Route
app.get('/bots', (req, res) => {
  const botsStatus = activeBots.map(bot => {
    const username = bot.instance?.username || bot.config.username || 'Unknown';
    logger.info(`[Server] Bot - ${bot.index} status: username = ${username}, instance = ${!!bot.instance} `);
    return {
      username,
      status: bot.instance ? 'online' : 'offline',
      index: bot.index
    };
  });
  res.json(botsStatus);
});

// Control Route
app.post('/control', (req, res) => {
  const { command, index } = req.body;
  const bot = activeBots.find(b => b.index === index);

  if (!bot) {
    return res.status(404).json({ error: 'Bot not found' });
  }

  if (command === 'start' && !bot.instance) {
    logger.info(`[Server] Starting bot - ${index}...`);
    startBot(bot.config, index);
    return res.status(200).json({ message: `Bot - ${index} started` });
  }

  if (command === 'stop' && bot.instance) {
    logger.warn(`[Server] Stopping bot - ${index}...`);
    stopBot(index);
    return res.status(200).json({ message: `Bot - ${index} stopped` });
  }

  res.status(400).json({ error: `Invalid command or bot is already ${command === 'start' ? 'online' : 'offline'} ` });
});

// Dashboard Route
app.get('/', (req, res) => {
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
          <h2 class="text-3xl font-bold text-blue-300 mb-6">Bot Status & Control</h2>
          <div id="bot-list" class="grid md:grid-cols-2 gap-6"></div>
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

      <script>
        const botList = document.getElementById('bot-list');

        const fetchBotStatus = async () => {
          try {
            const response = await fetch('/bots');
            if (!response.ok) throw new Error('Failed to fetch bot status');
            const bots = await response.json();
            botList.innerHTML = '';

            bots.forEach(bot => {
              const statusColor = bot.status === 'online' ? 'bg-green-500' : 'bg-red-500';
              const buttonColor = bot.status === 'online' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700';
              const buttonText = bot.status === 'online' ? 'Stop' : 'Start';
              const command = bot.status === 'online' ? 'stop' : 'start';
              const username = bot.username || 'Unknown';

              const card = document.createElement('div');
              card.className = 'p-6 bg-gray-700 rounded-xl shadow-md flex justify-between items-center';
              card.innerHTML = \`
                <div>
                  <div class="text-xl font-semibold text-white">\${username}</div>
                  <div class="flex items-center mt-1 text-sm text-gray-400">
                    <span class="w-3 h-3 \${statusColor} rounded-full mr-2"></span>\${bot.status}
                  </div>
                </div>
                <button
                  onclick="controlBot('\${command}', \${bot.index})"
                  class="px-4 py-2 \${buttonColor} text-white rounded-md font-semibold transition"
                >
                  \${buttonText}
                </button>
              \`;
              botList.appendChild(card);
            });
          } catch (error) {
            console.error('Error fetching bot status:', error);
          }
        };

        const controlBot = async (command, index) => {
          try {
            const response = await fetch('/control', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ command, index })
            });
            if (!response.ok) throw new Error('Failed to control bot');
            setTimeout(fetchBotStatus, 3000); // Delay for Aternos server startup
          } catch (error) {
            console.error('Error controlling bot:', error);
          }
        };

        fetchBotStatus();
        setInterval(fetchBotStatus, 5000);
      </script>
    </body>
    </html>
  `;
  res.send(htmlResponse);
});

// Bot Configuration
const botsConfig = Array.from({ length: parseInt(process.env.BOT_COUNT) || 0 }).map((_, i) => {
  const config = {
    username: process.env[`BOT_${i}_USERNAME`] || `Bot${i}`,
    password: process.env[`BOT_${i}_PASSWORD`] || '',
    type: process.env[`BOT_${i}_TYPE`] || 'offline'
  };
  logger.info(`[Config] Bot-${i}: username=${config.username}, type=${config.type}`);
  return config;
});

// Bot Creation
function createBotInstance(botConfig, index) {
  const serverDetails = {
    host: process.env.SERVER_IP || 'localhost',
    port: parseInt(process.env.SERVER_PORT) || 25565,
    version: process.env.SERVER_VERSION || false
  };
  logger.info(`[Bot-${index}] Creating bot with username: ${botConfig.username}, host: ${serverDetails.host}, port: ${serverDetails.port}, version: ${serverDetails.version}`);

  try {
    const bot = mineflayer.createBot({
      username: botConfig.username,
      password: botConfig.password,
      auth: botConfig.type,
      ...serverDetails
    });

    bot.username = botConfig.username; // Set username immediately
    setupBotEventListeners(bot, botConfig, index);
    return bot;
  } catch (err) {
    logger.error(`[Bot-${index}] Failed to create bot instance: ${err.message}`);
    return null;
  }
}

// Bot Event Listeners
function setupBotEventListeners(bot, botConfig, index) {
  const lastReplyTime = new Map();

  bot.once('spawn', () => {
    logger.info(`[Bot-${index}] Successfully joined as ${bot.username}`);
    if (process.env.AUTO_AUTH_ENABLED === 'true') {
      const password = process.env.AUTO_AUTH_PASSWORD;
      if (!password) {
        logger.warn(`[Bot-${index}] AUTO_AUTH_PASSWORD not set`);
        return;
      }
      setTimeout(() => {
        bot.chat(`/register ${password} ${password}`);
        bot.chat(`/login ${password}`);
      }, 500);
    }

    if (process.env.CHAT_MESSAGES_ENABLED === 'true') {
      const messages = process.env.CHAT_MESSAGES_LIST?.split(',') || [];
      if (process.env.CHAT_MESSAGES_REPEAT === 'true') {
        const delay = parseInt(process.env.CHAT_MESSAGES_REPEAT_DELAY) || 15;
        let i = 0;
        bot.chatInterval = setInterval(() => {
          if (messages[i]) bot.chat(messages[i]);
          i = (i + 1) % messages.length;
        }, delay * 1000);
      } else {
        messages.forEach(msg => bot.chat(msg));
      }
    }

    if (process.env.ANTI_AFK_ENABLED === 'true') {
      if (process.env.ANTI_AFK_SNEAK === 'true') bot.setControlState('sneak', true);
      if (process.env.ANTI_AFK_ROTATE === 'true') {
        bot.rotateInterval = setInterval(() => {
          bot.look(bot.entity.yaw + 1, bot.entity.pitch, true);
        }, 100);
      }
      if (process.env.ANTI_AFK_JUMP === 'true') {
        bot.jumpInterval = setInterval(() => {
          bot.setControlState('jump', true);
          setTimeout(() => bot.setControlState('jump', false), 500);
        }, 10000);
      }
    }
  });

  bot.on('chat', (username, message) => {
    if (process.env.CHAT_LOG === 'true') {
      logger.info(`[Bot-${index}] <${username}> ${message}`);
    }
    if (username === bot.username) return;

    const now = Date.now();
    const last = lastReplyTime.get(username) || 0;
    const FIVE_MIN = 5 * 60 * 1000;
    if (now - last >= FIVE_MIN && Math.random() < 0.1) {
      setTimeout(() => bot.chat(`Hello ${username}`), 500 + Math.random() * 1500);
      lastReplyTime.set(username, now);
    }
  });

  bot.on('death', () => logger.warn(`[Bot-${index}] Died and respawned`));

  bot.on('end', () => {
    logger.info(`[Bot-${index}] Disconnected`);
    clearBotIntervals(bot);

    const botState = activeBots[index];
    botState.instance = null;

    // Check if the stop was manual
    if (botState.manuallyStopped) {
      logger.warn(`[Bot-${index}] Manually stopped. Auto-reconnect is disabled.`);
      botState.manuallyStopped = false;
    }
  });

  bot.on('kicked', (reason) => {
    try {
      const parsed = JSON.parse(reason);
      logger.warn(`[Bot-${index}] Kicked: ${parsed.text || parsed.extra?.[0]?.text || 'Unknown'}`);
    } catch {
      logger.warn(`[Bot-${index}] Kicked: ${reason}`);
    }
    if (process.env.AUTO_RECONNECT === 'true' && !botState.manuallyStopped) {
      logger.warn(`[Bot-${index}] Reconnecting in ${process.env.AUTO_RECONNECT_DELAY || 5000}ms...`);
      setTimeout(() => startBot(botState.config, index), parseInt(process.env.AUTO_RECONNECT_DELAY) || 5000);
    }
  });

  bot.on('error', (err) => {
    logger.error(`[Bot-${index}] Error: ${err.message}`);
  });

  bot.on('login', () => {
    logger.info(`[Bot-${index}] Logged in to server`);
  });
}

// Bot Control Functions
function startBot(botConfig, index) {
  const botInstance = createBotInstance(botConfig, index);
  if (botInstance) {
    activeBots[index].instance = botInstance;
    logger.info(`[Bot-${index}] Started with username: ${botConfig.username}`);
  } else {
    logger.error(`[Bot-${index}] Failed to start bot`);
    activeBots[index].instance = null;
  }
}

function stopBot(index) {
  const bot = activeBots[index].instance;
  if (bot) {
    clearBotIntervals(bot);
    bot.quit();
    activeBots[index].instance = null;
    logger.info(`[Bot-${index}] Stopped`);
  }
}

function clearBotIntervals(bot) {
  if (bot.chatInterval) clearInterval(bot.chatInterval);
  if (bot.rotateInterval) clearInterval(bot.rotateInterval);
  if (bot.jumpInterval) clearInterval(bot.jumpInterval);
}

// Initialize Bots
function initializeBots() {
  const requiredEnvVars = ['BOT_COUNT', 'SERVER_IP', 'SERVER_PORT'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      logger.error(`Missing required environment variable: ${envVar}`);
      return;
    }
  }

  botsConfig.forEach((config, index) => {
    if (!config.username) {
      logger.error(`[Bot-${index}] No username specified`);
      return;
    }
    activeBots.push({ config, instance: null, index });
    logger.info(`[Bot-${index}] Initialized with username: ${config.username}`);
  });

  if (activeBots.length === 0) {
    logger.error('No bots initialized due to configuration errors');
    return;
  }

  logger.info('All bots initialized. You can now start them from the dashboard.');

  // Auto-join if enabled
  if (process.env.AUTO_JOIN_ENABLED === 'true') {
    activeBots.forEach(bot => {
      logger.info(`[Bot-${bot.index}] Auto-joining server...`);
      startBot(bot.config, bot.index);
    });
  }
}

// Start Server
app.listen(3000, () => {
  logger.info('Web server running on port 3000');
  initializeBots();
});
