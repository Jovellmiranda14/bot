// routes/dashboard.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
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
            const response = await fetch('/api/bots');
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
            const response = await fetch('/api/control', {
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

module.exports = router;