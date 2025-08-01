// This is a simple bot script that jumps in place and chats.
// This version is designed to be stable and easy to set up.

const mineflayer = require('mineflayer');
const express = require('express');

const config = require('./settings.json');
const loggers = require('./logging.js');
const logger = loggers.logger;
const app = express();

// A simple web server to keep the bot alive if hosted on a platform
app.get('/', (req, res) => {
    const currentUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    res.send('Your Bot Is Ready! Subscribe My Youtube: <a href="https://youtube.com/@H2N_OFFICIAL?si=UOLwjqUv-C1mWkn4">H2N OFFICIAL</a><br>Link Web For Uptime: <a href="' + currentUrl + '">' + currentUrl + '</a>');
});

app.listen(3000, () => {
    logger.info('Web server is running on port 3000');
});

function createBot() {
    const bot = mineflayer.createBot({
        username: config['bot-account']['username'],
        password: config['bot-account']['password'],
        auth: config['bot-account']['type'],
        host: config.server.ip,
        port: config.server.port,
        version: config.server.version,
    });

    bot.once('spawn', () => {
        logger.info("Bot joined to the server");

        // Auto-authentication logic
        if (config.utils['auto-auth'].enabled) {
            logger.info('Started auto-auth module');
            let password = config.utils['auto-auth'].password;
            setTimeout(() => {
                bot.chat(`/register ${password} ${password}`);
                bot.chat(`/login ${password}`);
            }, 500);
            logger.info(`Authentication commands executed`);
        }

        // Periodic chat messages
        if (config.utils['chat-messages'].enabled) {
            logger.info('Started chat-messages module');
            let messages = config.utils['chat-messages']['messages'];
            if (config.utils['chat-messages'].repeat) {
                let delay = config.utils['chat-messages']['repeat-delay'];
                let i = 0;
                setInterval(() => {
                    bot.chat(`${messages[i]}`);
                    if (i + 1 === messages.length) {
                        i = 0;
                    } else i++;
                }, delay * 1000);
            } else {
                messages.forEach((msg) => {
                    bot.chat(msg);
                });
            }
        }

        // Anti-AFK logic, including jumping
        if (config.utils['anti-afk'].enabled) {
            if (config.utils['anti-afk'].sneak) {
                bot.setControlState('sneak', true);
            }

            if (config.utils['anti-afk'].rotate) {
                setInterval(() => {
                    bot.look(bot.entity.yaw + 1, bot.entity.pitch, true);
                }, 100);
            }

            // Jumping up and down
            setInterval(() => {
                logger.info('Bot is jumping...');
                bot.setControlState('jump', true);
                setTimeout(() => {
                    bot.setControlState('jump', false);
                    logger.info('Jump completed.');
                }, 500); // 500ms jump duration
            }, 10000); // Jump every 2 seconds
        }
    });

    // Chat logging
    bot.on('chat', (username, message) => {
        if (config.utils['chat-log']) {
            logger.info(`<${username}> ${message}`);
        }
    });

    // Death handler
    bot.on('death', () => {
        logger.warn(`Bot has been died and was respawned at ${bot.entity.position}`);
    });

    // Auto-reconnect logic
    if (config.utils['auto-reconnect']) {
        bot.on('end', () => {
            setTimeout(() => {
                createBot();
            }, config.utils['auto-reconnect-delay']);
        });
    }

    // Kicked handler
    bot.on('kicked', (reason) => {
        let reasonText = '';
        try {
            const reasonJson = JSON.parse(reason);
            reasonText = reasonJson.text || (reasonJson.extra && reasonJson.extra[0] && reasonJson.extra[0].text);
        } catch (e) {
            reasonText = reason;
        }

        if (reasonText) {
            reasonText = reasonText.replace(/§./g, '');
            logger.warn(`Bot was kicked from the server. Reason: ${reasonText}`);
        } else {
            logger.warn(`Bot was kicked from the server. Reason could not be determined.`);
        }
    });

    // Error handler
    bot.on('error', (err) =>
        logger.error(`${err.message}`)
    );
}

createBot();
