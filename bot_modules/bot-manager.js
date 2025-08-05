// bot_modules/bot-manager.js
const mineflayer = require('mineflayer');
const { logger } = require('../logging.js');
const { setupBotEventListeners, clearBotIntervals } = require('./bot-events.js');
const { botsConfig } = require('./bot-utils.js');

const activeBots = [];

// A utility function to safely get a bot's state
const getBotState = (index) => activeBots[index];
const setBotInstance = (index, instance) => activeBots[index].instance = instance;
const setBotManuallyStopped = (index, value) => activeBots[index].manuallyStopped = value;

// Bot Control Functions
function createBotInstance(botConfig, index) {
  const serverDetails = {
    host: process.env.SERVER_IP || 'localhost',
    port: parseInt(process.env.SERVER_PORT) || 25565,
    version: process.env.SERVER_VERSION || false
  };

  try {
    const bot = mineflayer.createBot({
      username: botConfig.username,
      password: botConfig.password,
      auth: botConfig.type,
      ...serverDetails
    });

    bot.username = botConfig.username;
    // Pass the startBot function and a way to get/set the bot's state
    setupBotEventListeners(bot, index, startBot, getBotState, setBotManuallyStopped);
    return bot;
  } catch (err) {
    logger.error(`[Bot-${index}] Failed to create bot instance: ${err.message}`);
    return null;
  }
}

function startBot(index) {
  const botConfig = activeBots[index].config;
  const botInstance = createBotInstance(botConfig, index);
  if (botInstance) {
    setBotInstance(index, botInstance);
    logger.info(`[Bot-${index}] Instance created and added to activeBots.`);
  } else {
    logger.error(`[Bot-${index}] Failed to create bot instance.`);
    setBotInstance(index, null);
  }
}

function stopBot(index) {
  const bot = getBotState(index).instance;
  if (bot) {
    setBotManuallyStopped(index, true);
    clearBotIntervals(bot);
    bot.quit();
    logger.info(`[Bot-${index}] Quit command sent to bot instance.`);
  } else {
    logger.warn(`[Bot-${index}] Stop command ignored, bot is not online.`);
  }
}

function getBotsStatus() {
  return activeBots.map(bot => {
    const username = bot.instance?.username || bot.config.username || 'Unknown';
    return {
      username,
      status: bot.instance ? 'online' : 'offline',
      index: bot.index
    };
  });
}

// Initialize Bots
function initializeBots() {
  const requiredEnvVars = ['BOT_COUNT', 'SERVER_IP', 'SERVER_PORT'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      logger.error(`Missing required environment variable: ${envVar}. Bot management server will not start.`);
      return;
    }
  }

  botsConfig.forEach((config, index) => {
    if (!config.username) {
      logger.error(`[Config] Bot-${index} has no username specified. Skipping initialization.`);
      return;
    }
    activeBots.push({ config, instance: null, index, manuallyStopped: false });
    logger.info(`[Config] Initialized bot configuration for Bot-${index} (${config.username}).`);
  });

  if (activeBots.length === 0) {
    logger.warn('No bots initialized due to configuration errors. Check your .env file.');
    return;
  }

  logger.info(`Initialized ${activeBots.length} bot(s).`);

  if (process.env.AUTO_JOIN_ENABLED === 'true') {
    logger.info('Auto-join is enabled. Starting all bots...');
    activeBots.forEach((_, index) => startBot(index));
  } else {
    logger.info('Auto-join is disabled. Start bots manually from the web dashboard.');
  }
}

module.exports = {
  initializeBots,
  startBot,
  stopBot,
  getBotsStatus,
};