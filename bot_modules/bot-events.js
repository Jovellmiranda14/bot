// bot_modules/bot-events.js
const { logger } = require('../logging.js');

function setupBotEventListeners(bot, index, startBot, getBotState, setBotManuallyStopped) {
  const lastReplyTime = new Map();

  bot.once('spawn', () => {
    logger.info(`[Bot-${index}] ${bot.username} joined the server.`);
    if (process.env.AUTO_AUTH_ENABLED === 'true') {
      const password = process.env.AUTO_AUTH_PASSWORD;
      if (!password) {
        logger.warn(`[Bot-${index}] AUTO_AUTH_PASSWORD not set for auto-auth.`);
        return;
      }
      setTimeout(() => {
        bot.chat(`/register ${password} ${password}`);
        bot.chat(`/login ${password}`);
        logger.info(`[Bot-${index}] Attempted auto-auth.`);
      }, 500);
    }

    if (process.env.CHAT_MESSAGES_ENABLED === 'true') {
      const messages = process.env.CHAT_MESSAGES_LIST?.split(',') || [];
      if (process.env.CHAT_MESSAGES_REPEAT === 'true') {
        const delay = parseInt(process.env.CHAT_MESSAGES_REPEAT_DELAY) || 15;
        let i = 0;
        bot.chatInterval = setInterval(() => {
          if (messages[i]) {
            bot.chat(messages[i]);
            logger.debug(`[Bot-${index}] Sent scheduled chat message: "${messages[i]}".`);
          }
          i = (i + 1) % messages.length;
        }, delay * 1000);
      } else {
        messages.forEach(msg => {
          bot.chat(msg);
          logger.debug(`[Bot-${index}] Sent one-time chat message: "${msg}".`);
        });
      }
    }

    if (process.env.ANTI_AFK_ENABLED === 'true') {
      logger.info(`[Bot-${index}] Anti-AFK is enabled.`);
      if (process.env.ANTI_AFK_SNEAK === 'true') bot.setControlState('sneak', true);
      if (process.env.ANTI_AFK_ROTATE === 'true') {
        bot.rotateInterval = setInterval(() => bot.look(bot.entity.yaw + 1, bot.entity.pitch, true), 100);
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
    if (process.env.CHAT_LOG === 'true' && username !== bot.username) {
      logger.info(`[Bot-${index}] <${username}> ${message}`);
    }
    if (username === bot.username) return;

    const now = Date.now();
    const last = lastReplyTime.get(username) || 0;
    const FIVE_MIN = 5 * 60 * 1000;
    if (now - last >= FIVE_MIN && Math.random() < 0.1) {
      setTimeout(() => bot.chat(`Hello ${username}`), 500 + Math.random() * 1500);
      lastReplyTime.set(username, now);
      logger.debug(`[Bot-${index}] Sent random reply to ${username}.`);
    }
  });

  bot.on('end', () => {
    clearBotIntervals(bot);
    const botState = getBotState(index);

    if (botState.manuallyStopped) {
      logger.warn(`[Bot-${index}] Manually stopped. Auto-reconnect is disabled.`);
      setBotManuallyStopped(index, false);
    } else {
      logger.warn(`[Bot-${index}] Disconnected. Attempting to reconnect...`);
      if (process.env.AUTO_RECONNECT === 'true') {
        setTimeout(() => startBot(index), parseInt(process.env.AUTO_RECONNECT_DELAY) || 5000);
      }
    }
  });

  bot.on('kicked', (reason) => {
    try {
      const parsed = JSON.parse(reason);
      logger.warn(`[Bot-${index}] Kicked: ${parsed.text || parsed.extra?.[0]?.text || 'Unknown reason'}`);
    } catch {
      logger.warn(`[Bot-${index}] Kicked: ${reason}`);
    }
  });

  bot.on('error', (err) => {
    logger.error(`[Bot-${index}] An error occurred: ${err.message}`);
  });
}

function clearBotIntervals(bot) {
  if (bot.chatInterval) clearInterval(bot.chatInterval);
  if (bot.rotateInterval) clearInterval(bot.rotateInterval);
  if (bot.jumpInterval) clearInterval(bot.jumpInterval);
}

module.exports = {
  setupBotEventListeners,
  clearBotIntervals,
};