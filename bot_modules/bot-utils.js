// bot_modules/bot-utils.js
const botsConfig = Array.from({ length: parseInt(process.env.BOT_COUNT) || 0 }).map((_, i) => ({
  username: process.env[`BOT_${i}_USERNAME`] || `Bot${i}`,
  password: process.env[`BOT_${i}_PASSWORD`] || '',
  type: process.env[`BOT_${i}_TYPE`] || 'offline'
}));

module.exports = {
  botsConfig,
};