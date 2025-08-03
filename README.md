# 🧠 Multi-Bot Minecraft System using Mineflayer

A Node.js-based Minecraft bot system powered by [Mineflayer](https://github.com/PrismarineJS/mineflayer), supporting multiple offline/online bots with configurable features like auto-auth, auto-reconnect, anti-AFK, and scheduled chat messages.

---

## 💪 Features

* 🔁 Auto Reconnect
* ✍️ Chat Logging
* 🔐 Auto Authentication (/register & /login)
* 🚪 Auto Join
* 💬 Scheduled Chat Messages
* 🛌 Anti-AFK Movements
* 🧹 Supports multiple bots with `.env`-based configuration

---

## 📁 Folder Structure

```
.
├── index.js               # Main entry point
├── .env                   # Actual environment config (based on .env.example)
├── .env.example           # Template file for environment variables
├── settings.json          # (Optional) legacy config file, if used
├── logging.js             # Logging module (uses Winston or Console)
├── package.json
└── README.md
```

---

## 📦 Installation

```bash
git clone https://github.com/Jovellmiranda14/bot.git
cd bot
npm install
cp .env.example .env
```

Edit `.env` with your desired bot usernames, server IP, and configurations.

---

## 🚀 Usage

```bash
node index.js
```

The system will automatically read your `.env` file and spawn the configured bots with all utilities enabled.

---

## ⚙️ Configuration via `.env`

Update values inside `.env` or `.env.example`:

```env
# Example
SERVER_IP=minecraft.example.com
BOT_0_USERNAME=
AUTO_RECONNECT=
CHAT_MESSAGES_LIST=Hi there!,Anyone online?,Beep boop 🤖
```

See the full `.env.example` file [here](./.env.example).

---

## 📋 Example Bot Behavior

* Connects to the server
* Logs chat to console
* Sends chat messages every 15 seconds (if enabled)
* Performs simple anti-AFK actions like jumping
* Reconnects after disconnection
* Optionally authenticates if required by server

---

## 📌 Dependencies

* [mineflayer](https://www.npmjs.com/package/mineflayer)
* [dotenv](https://www.npmjs.com/package/dotenv)
* [winston](https://www.npmjs.com/package/winston) (optional for logging)

Install with:

```bash
npm install mineflayer dotenv winston
```

---

## 🧹 Customization Tips

* Add more bots by increasing `BOT_COUNT` and defining `BOT_2_...`, `BOT_3_...`, etc.
* Customize `logging.js` to store logs in a file or Discord webhook.
* Integrate Express.js for a basic web dashboard to control/view bots (optional).

---

## Coming Soon

- More bot features
- Web control panel
- Multi-server support
