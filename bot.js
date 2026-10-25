// Russia TV Hub — бот @RussiaTVHub_bot
// Команды: /start, /help, /channels, /donate (Telegram Stars), /post (только администратор: публикует и закрепляет пост в канале).
// Настройки — в .env: BOT_TOKEN (обязательно), ADMIN_ID (числовой id администратора, нужен для /post).
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const TOKEN = process.env.BOT_TOKEN;
if (!TOKEN) { console.error('❌ BOT_TOKEN не задан. Создай .env с BOT_TOKEN=... (см. .env.example)'); process.exit(1); }
const ADMIN_ID = process.env.ADMIN_ID ? Number(process.env.ADMIN_ID) : null;

const CHANNEL = '@RussiaTV_Hub_Live';
const BOT_USERNAME = 'RussiaTVHub_bot';
const APP_URL = 'https://t.me/RussiaTVHub_bot/russiatv';          // прямая ссылка на мини-апп (для постов в канале; ?startapp=<id канала> откроет канал)
const WEB_URL = 'https://varenik-ai.github.io/russia-tv-hub/?v=14'; // адрес мини-аппа (кнопка web_app в личных сообщениях)
const SITE_URL = 'https://russian-tv.com/';
const TOTAL = 59;
const STARS = [25, 100, 500];

const bot = new TelegramBot(TOKEN, { polling: { interval: 2000, autoStart: true, params: { timeout: 10 } } });

const LANGS = ['ru', 'en', 'bg', 'uk', 'de', 'fr', 'es', 'tr'];
const pickLang = (code) => { const l = (code || 'ru').split('-')[0].toLowerCase(); return LANGS.includes(l) ? l : 'en'; };
const esc = (s) => String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// ── Тексты ────────────────────────────────────────────────────────────────
const L = {
  ru: {
    start: (n) => `📺 <b>Привет${n ? ', ' + n : ''}!</b>\n${TOTAL} российских каналов в прямом эфире — бесплатно, без регистрации, из любой страны.\n\n👇 Откройте приложение и выберите канал`,
    open: '📺 Открыть Russia TV Live', site: '🌐 Сайт russian-tv.com', help: '❓ Помощь', donate: '⭐ Поблагодарить',
    help_t: `❓ <b>Как смотреть</b>\n1. Нажмите «Открыть Russia TV Live» и выберите канал.\n2. Нет звука? Нажмите «Включить звук».\n3. Картинка подвисает? ⚙ в плеере → качество ниже.\n4. Канал не грузится: подождите минуту или выберите другой.\n\n📺 <b>На телевизор</b>\n• Chrome на компьютере или Android: кнопка Cast в плеере на сайте (Chromecast или телевизор с Google Cast).\n• iPhone: сайт в Safari → кнопка AirPlay (Apple TV или телевизор с AirPlay).\n\n📧 Ошибка или вопрос по трансляциям: dyaltd@gmail.com`,
    channels_t: 'Каналы по темам', donate_t: 'Поддержать проект', donate_d: 'Спасибо, что смотрите! Звёзды помогают оплачивать серверы и поддерживать каналы в рабочем состоянии.', donate_ask: '⭐ Поблагодарить проект Звёздами Telegram. Сколько? Оплата Звёздами работает в приложении Telegram (телефон, компьютер); в веб-версии может не открыться.', donate_ok: '🙏 Спасибо за поддержку! Это очень помогает проекту.',
    desc: `Русское ТВ в Telegram: ${TOTAL} каналов в прямом эфире — новости, кино, детям, спорт, музыка. Бесплатно, без регистрации, из любой страны.`, short: `${TOTAL} российских каналов в прямом эфире`,
    menu: '📺 Смотреть', cmds: { start: 'Открыть приложение', help: 'Как смотреть и на телевизор', channels: 'Список каналов', donate: 'Поблагодарить проект' },
  },
  en: {
    start: (n) => `📺 <b>Hello${n ? ', ' + n : ''}!</b>\n${TOTAL} Russian TV channels live — free, no registration, from any country.\n\n👇 Open the app and pick a channel`,
    open: '📺 Open Russia TV Live', site: '🌐 Website russian-tv.com', help: '❓ Help', donate: '⭐ Say thanks',
    help_t: `❓ <b>How to watch</b>\n1. Tap “Open Russia TV Live” and pick a channel.\n2. No sound? Tap “Unmute”.\n3. Choppy picture? ⚙ in the player → lower quality.\n4. Channel not loading: wait a minute or pick another one.\n\n📺 <b>On your TV</b>\n• Chrome on a computer or Android: the Cast button in the player on the website (Chromecast or a TV with Google Cast).\n• iPhone: the website in Safari → AirPlay button (Apple TV or an AirPlay TV).\n\n📧 Found a problem or a question about streams: dyaltd@gmail.com`,
    channels_t: 'Channels by topic', donate_t: 'Support the project', donate_d: 'Thanks for watching! Stars help pay for servers and keep the channels running.', donate_ask: '⭐ Say thanks with Telegram Stars. How many? Stars payments work in the Telegram app (phone or desktop); they may not open in the web version.', donate_ok: '🙏 Thank you for your support! It really helps.',
    desc: `Russian TV on Telegram: ${TOTAL} live channels — news, movies, kids, sport, music. Free, no registration, from any country.`, short: `${TOTAL} Russian TV channels live`,
    menu: '📺 Watch', cmds: { start: 'Open the app', help: 'How to watch / on TV', channels: 'Channel list', donate: 'Say thanks' },
  },
  bg: {
    start: (n) => `📺 <b>Здравейте${n ? ', ' + n : ''}!</b>\n${TOTAL} руски канала на живо — безплатно, без регистрация, от всяка държава.\n\n👇 Отворете приложението и изберете канал`,
    open: '📺 Отвори Russia TV Live', site: '🌐 Сайт russian-tv.com', help: '❓ Помощ', donate: '⭐ Благодаря',
    help_t: `❓ <b>Как да гледате</b>\n1. Натиснете «Отвори Russia TV Live» и изберете канал.\n2. Няма звук? Натиснете «Включи звука».\n3. Картината заеква? ⚙ в плейъра → по-ниско качество.\n4. Каналът не зарежда: изчакайте минута или изберете друг.\n\n📺 <b>На телевизор</b>\n• Chrome на компютър или Android: бутонът Cast в плейъра на сайта (Chromecast или телевизор с Google Cast).\n• iPhone: сайтът в Safari → бутон AirPlay (Apple TV или телевизор с AirPlay).\n\n📧 Проблем или въпрос: dyaltd@gmail.com`,
    channels_t: 'Канали по теми', donate_t: 'Подкрепете проекта', donate_d: 'Благодарим, че гледате! Звездите помагат за сървърите и работата на каналите.', donate_ask: '⭐ Благодарете със Звезди на Telegram. Колко? Плащането със Звезди работи в приложението Telegram (телефон, компютър); в уеб версията може да не се отвори.', donate_ok: '🙏 Благодарим за подкрепата!',
    desc: `Руска телевизия в Telegram: ${TOTAL} канала на живо — новини, кино, деца, спорт, музика. Безплатно, без регистрация.`, short: `${TOTAL} руски канала на живо`,
    menu: '📺 Гледай', cmds: { start: 'Отвори приложението', help: 'Как да гледате', channels: 'Списък с канали', donate: 'Благодаря' },
  },
  uk: {
    start: (n) => `📺 <b>Привіт${n ? ', ' + n : ''}!</b>\n${TOTAL} російських каналів у прямому ефірі — безкоштовно, без реєстрації, з будь-якої країни.\n\n👇 Відкрийте застосунок і виберіть канал`,
    open: '📺 Відкрити Russia TV Live', site: '🌐 Сайт russian-tv.com', help: '❓ Допомога', donate: '⭐ Подякувати',
    help_t: `❓ <b>Як дивитися</b>\n1. Натисніть «Відкрити Russia TV Live» і виберіть канал.\n2. Немає звуку? Натисніть «Увімкнути звук».\n3. Картинка підвисає? ⚙ у плеєрі → нижча якість.\n4. Канал не завантажується: зачекайте хвилину або виберіть інший.\n\n📺 <b>На телевізор</b>\n• Chrome на комп’ютері або Android: кнопка Cast у плеєрі на сайті (Chromecast або телевізор з Google Cast).\n• iPhone: сайт у Safari → кнопка AirPlay (Apple TV або телевізор з AirPlay).\n\n📧 Помилка чи питання: dyaltd@gmail.com`,
    channels_t: 'Канали за темами', donate_t: 'Підтримати проєкт', donate_d: 'Дякуємо, що дивитеся! Зірки допомагають оплачувати сервери й підтримувати канали.', donate_ask: '⭐ Подякуйте Зірками Telegram. Скільки? Оплата Зірками працює в застосунку Telegram (телефон, комп’ютер); у веб-версії може не відкритися.', donate_ok: '🙏 Дякуємо за підтримку!',
    desc: `Російське ТБ у Telegram: ${TOTAL} каналів у прямому ефірі — новини, кіно, дітям, спорт, музика. Безкоштовно, без реєстрації.`, short: `${TOTAL} російських каналів у прямому ефірі`,
    menu: '📺 Дивитися', cmds: { start: 'Відкрити застосунок', help: 'Як дивитися', channels: 'Список каналів', donate: 'Подякувати' },
  },
  de: {
    start: (n) => `📺 <b>Hallo${n ? ', ' + n : ''}!</b>\n${TOTAL} russische Sender live — kostenlos, ohne Anmeldung, aus jedem Land.\n\n👇 App öffnen und Sender wählen`,
    open: '📺 Russia TV Live öffnen', site: '🌐 Website russian-tv.com', help: '❓ Hilfe', donate: '⭐ Danke sagen',
    help_t: `❓ <b>So schauen Sie</b>\n1. «Russia TV Live öffnen» tippen und einen Sender wählen.\n2. Kein Ton? «Ton einschalten» tippen.\n3. Bild ruckelt? ⚙ im Player → niedrigere Qualität.\n4. Sender lädt nicht: eine Minute warten oder einen anderen wählen.\n\n📺 <b>Auf dem Fernseher</b>\n• Chrome am Computer oder Android: Cast-Taste im Player auf der Website (Chromecast oder TV mit Google Cast).\n• iPhone: Website in Safari → AirPlay-Taste (Apple TV oder AirPlay-TV).\n\n📧 Problem oder Frage: dyaltd@gmail.com`,
    channels_t: 'Sender nach Thema', donate_t: 'Projekt unterstützen', donate_d: 'Danke fürs Zuschauen! Sterne helfen bei Servern und laufenden Sendern.', donate_ask: '⭐ Mit Telegram-Sternen danken. Wie viele? Zahlung mit Sternen funktioniert in der Telegram-App (Handy, Computer), in der Web-Version eventuell nicht.', donate_ok: '🙏 Danke für die Unterstützung!',
    desc: `Russisches TV auf Telegram: ${TOTAL} Sender live — Nachrichten, Kino, Kinder, Sport, Musik. Kostenlos, ohne Anmeldung.`, short: `${TOTAL} russische Sender live`,
    menu: '📺 Ansehen', cmds: { start: 'App öffnen', help: 'So schauen Sie / am TV', channels: 'Senderliste', donate: 'Danke sagen' },
  },
  fr: {
    start: (n) => `📺 <b>Bonjour${n ? ', ' + n : ''} !</b>\n${TOTAL} chaînes russes en direct — gratuit, sans inscription, depuis n’importe quel pays.\n\n👇 Ouvrez l’appli et choisissez une chaîne`,
    open: '📺 Ouvrir Russia TV Live', site: '🌐 Site russian-tv.com', help: '❓ Aide', donate: '⭐ Remercier',
    help_t: `❓ <b>Comment regarder</b>\n1. Touchez « Ouvrir Russia TV Live » et choisissez une chaîne.\n2. Pas de son ? Touchez « Activer le son ».\n3. Image saccadée ? ⚙ dans le lecteur → qualité plus basse.\n4. La chaîne ne charge pas : attendez une minute ou choisissez-en une autre.\n\n📺 <b>Sur la télévision</b>\n• Chrome sur ordinateur ou Android : bouton Cast dans le lecteur du site (Chromecast ou TV avec Google Cast).\n• iPhone : site dans Safari → bouton AirPlay (Apple TV ou TV AirPlay).\n\n📧 Problème ou question : dyaltd@gmail.com`,
    channels_t: 'Chaînes par thème', donate_t: 'Soutenir le projet', donate_d: 'Merci de regarder ! Les étoiles aident à payer les serveurs et à garder les chaînes en ligne.', donate_ask: '⭐ Remercier avec des étoiles Telegram. Combien ? Le paiement par étoiles fonctionne dans l’appli Telegram (téléphone, ordinateur) ; il peut ne pas s’ouvrir dans la version web.', donate_ok: '🙏 Merci pour votre soutien !',
    desc: `TV russe sur Telegram : ${TOTAL} chaînes en direct — actualités, cinéma, enfants, sport, musique. Gratuit, sans inscription.`, short: `${TOTAL} chaînes russes en direct`,
    menu: '📺 Regarder', cmds: { start: 'Ouvrir l’appli', help: 'Comment regarder / sur TV', channels: 'Liste des chaînes', donate: 'Remercier' },
  },
  es: {
    start: (n) => `📺 <b>¡Hola${n ? ', ' + n : ''}!</b>\n${TOTAL} canales rusos en vivo — gratis, sin registro, desde cualquier país.\n\n👇 Abre la app y elige un canal`,
    open: '📺 Abrir Russia TV Live', site: '🌐 Sitio russian-tv.com', help: '❓ Ayuda', donate: '⭐ Dar las gracias',
    help_t: `❓ <b>Cómo ver</b>\n1. Toca «Abrir Russia TV Live» y elige un canal.\n2. ¿Sin sonido? Toca «Activar sonido».\n3. ¿La imagen se corta? ⚙ en el reproductor → menor calidad.\n4. El canal no carga: espera un minuto o elige otro.\n\n📺 <b>En la tele</b>\n• Chrome en ordenador o Android: botón Cast en el reproductor del sitio (Chromecast o TV con Google Cast).\n• iPhone: el sitio en Safari → botón AirPlay (Apple TV o TV con AirPlay).\n\n📧 Problema o pregunta: dyaltd@gmail.com`,
    channels_t: 'Canales por tema', donate_t: 'Apoyar el proyecto', donate_d: '¡Gracias por ver! Las estrellas ayudan a pagar servidores y mantener los canales.', donate_ask: '⭐ Da las gracias con estrellas de Telegram. ¿Cuántas? El pago con estrellas funciona en la app de Telegram (móvil u ordenador); puede no abrirse en la versión web.', donate_ok: '🙏 ¡Gracias por tu apoyo!',
    desc: `TV rusa en Telegram: ${TOTAL} canales en vivo — noticias, cine, niños, deporte, música. Gratis, sin registro.`, short: `${TOTAL} canales rusos en vivo`,
    menu: '📺 Ver', cmds: { start: 'Abrir la app', help: 'Cómo ver / en la tele', channels: 'Lista de canales', donate: 'Dar las gracias' },
  },
  tr: {
    start: (n) => `📺 <b>Merhaba${n ? ', ' + n : ''}!</b>\n${TOTAL} Rus kanalı canlı — ücretsiz, kayıtsız, her ülkeden.\n\n👇 Uygulamayı açın ve kanal seçin`,
    open: '📺 Russia TV Live Aç', site: '🌐 Site russian-tv.com', help: '❓ Yardım', donate: '⭐ Teşekkür et',
    help_t: `❓ <b>Nasıl izlenir</b>\n1. «Russia TV Live Aç»a dokunun ve kanal seçin.\n2. Ses yok mu? «Sesi aç»a dokunun.\n3. Görüntü takılıyor mu? Oynatıcıda ⚙ → daha düşük kalite.\n4. Kanal açılmıyor: bir dakika bekleyin veya başka kanal seçin.\n\n📺 <b>Televizyonda</b>\n• Bilgisayarda veya Android'de Chrome: sitedeki oynatıcıda Cast düğmesi (Chromecast veya Google Cast'li TV).\n• iPhone: Safari'de site → AirPlay düğmesi (Apple TV veya AirPlay'li TV).\n\n📧 Sorun veya soru: dyaltd@gmail.com`,
    channels_t: 'Konuya göre kanallar', donate_t: 'Projeyi destekle', donate_d: 'İzlediğiniz için teşekkürler! Yıldızlar sunucu giderlerine yardım eder.', donate_ask: '⭐ Telegram Yıldızları ile teşekkür edin. Kaç tane? Yıldızla ödeme Telegram uygulamasında (telefon, bilgisayar) çalışır; web sürümünde açılmayabilir.', donate_ok: '🙏 Desteğiniz için teşekkürler!',
    desc: `Telegram'da Rus TV: ${TOTAL} canlı kanal — haber, sinema, çocuk, spor, müzik. Ücretsiz, kayıtsız.`, short: `${TOTAL} Rus kanalı canlı`,
    menu: '📺 İzle', cmds: { start: 'Uygulamayı aç', help: 'Nasıl izlenir / TV', channels: 'Kanal listesi', donate: 'Teşekkür et' },
  },
};

// Каналы по темам (названия одинаковы на всех языках; список совпадает с мини-аппом)
const GROUPS = [
  ['📡', 'Новости', 'Первый канал · Россия 1 · НТВ · Россия 24 · Пятый канал · ТВЦ · МИР · Звезда · 360° · Москва 24 · Россия-К · Санкт-Петербург · Соловьёв Live'],
  ['🎬', 'Развлечения', 'ТНТ4 · История · Союз · Прима · RT Documentary'],
  ['🎥', 'Кино', 'Дом Кино · Кинохит · Кинокомедия · Viju TV1000 · Наше кино · Родное кино · Киносвидание · Индийское кино · Кино Экшн · Честный детектив'],
  ['👶', 'Детские', 'Карусель · Мульт · Карусель International · Рыжий'],
  ['🎵', 'Музыка и радио', 'МУЗ-ТВ · Музыка Первого · Муз Союз · FON Music · Страна FM · Вести FM'],
  ['🌿', 'Хобби', 'Охота и рыбалка · Мой мир · Приключения · Точка отрыва · Живая планета · Зоопарк · Драйв · Домашние животные · Здоровое ТВ · Большая планета · Бобер'],
  ['⚽', 'Спорт', 'FloSports Hockey · FloSports Racing · Viju+ Sport · M1 Global MMA · Red Bull TV · Unbeaten Boxing · World of Freesports · Спортивный · Trace Sport Stars'],
];

function kb(lang, withDonate = true) {
  const t = L[lang];
  const rows = [
    [{ text: t.open, web_app: { url: WEB_URL } }],
    [{ text: t.site, url: SITE_URL }],
    [{ text: t.help, callback_data: 'help' }],
  ];
  if (withDonate) rows[2].push({ text: t.donate, callback_data: 'donate' });
  return { inline_keyboard: rows };
}
function donateKb(lang) {
  return { inline_keyboard: [STARS.map((n) => ({ text: '⭐ ' + n, callback_data: 'don:' + n }))] };
}
const langOf = (msg) => pickLang(msg.from && msg.from.language_code);

function sendStart(chatId, from) {
  const lang = pickLang(from && from.language_code), t = L[lang];
  return bot.sendMessage(chatId, t.start(esc(from && from.first_name)), { parse_mode: 'HTML', reply_markup: kb(lang) });
}
function sendHelp(chatId, lang) {
  const t = L[lang];
  return bot.sendMessage(chatId, t.help_t, { parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: { inline_keyboard: [[{ text: t.open, web_app: { url: WEB_URL } }], [{ text: t.site, url: SITE_URL }]] } });
}
function sendChannels(chatId, lang) {
  const t = L[lang];
  const text = `<b>${esc(t.channels_t)} (${TOTAL})</b>\n\n` + GROUPS.map(([e, name, list]) => `${e} <b>${esc(name)}</b>\n${esc(list)}`).join('\n\n');
  return bot.sendMessage(chatId, text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: t.open, web_app: { url: WEB_URL } }]] } });
}
function sendDonate(chatId, lang) {
  return bot.sendMessage(chatId, L[lang].donate_ask, { reply_markup: donateKb(lang) });
}
function sendInvoice(chatId, lang, amount) {
  const t = L[lang];
  return bot.sendInvoice(chatId, t.donate_t, t.donate_d, 'donate_' + amount, '', 'XTR', [{ label: t.donate_t, amount }]);
}

bot.onText(/^\/start(?:@\w+)?(?:\s+(\w+))?/, (msg, m) => {
  const lang = langOf(msg);
  if (m && m[1] === 'help') return sendHelp(msg.chat.id, lang);
  if (m && m[1] === 'donate') return sendDonate(msg.chat.id, lang);
  return sendStart(msg.chat.id, msg.from);
});
bot.onText(/^\/help(?:@\w+)?$/, (msg) => sendHelp(msg.chat.id, langOf(msg)));
bot.onText(/^\/channels(?:@\w+)?$/, (msg) => sendChannels(msg.chat.id, langOf(msg)));
bot.onText(/^\/donate(?:@\w+)?$/, (msg) => sendDonate(msg.chat.id, langOf(msg)));

bot.on('callback_query', async (q) => {
  const lang = pickLang(q.from && q.from.language_code), chatId = q.message && q.message.chat.id;
  try { await bot.answerCallbackQuery(q.id); } catch (e) {}
  if (!chatId) return;
  if (q.data === 'help') return sendHelp(chatId, lang);
  if (q.data === 'donate') return sendDonate(chatId, lang);
  const m = /^don:(\d+)$/.exec(q.data || '');
  if (m && STARS.includes(Number(m[1]))) return sendInvoice(chatId, lang, Number(m[1]));
});

// Оплата Звёздами (XTR): подтверждаем счёт и благодарим
bot.on('pre_checkout_query', (q) => { bot.answerPreCheckoutQuery(q.id, true).catch(() => {}); });
bot.on('message', (msg) => {
  if (msg.successful_payment) bot.sendMessage(msg.chat.id, L[langOf(msg)].donate_ok).catch(() => {});
});

// /post — публикует и закрепляет пост в канале (только ADMIN_ID)
bot.onText(/^\/post(?:@\w+)?$/, async (msg) => {
  if (!ADMIN_ID || msg.from.id !== ADMIN_ID) return;   // раньше команду мог вызвать любой пользователь
  const t = L.ru;
  try {
    const post = await bot.sendMessage(CHANNEL,
      `📺 <b>Русское ТВ в Telegram — ${TOTAL} каналов в прямом эфире</b>\n\nНовости, кино, детям, спорт, музыка. Бесплатно, без регистрации, из любой страны.\n\n👇 Откройте приложение и выберите канал`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: t.open, url: APP_URL }],
            [{ text: t.site, url: SITE_URL }],
            [{ text: t.help, url: `https://t.me/${BOT_USERNAME}?start=help` }, { text: t.donate, url: `https://t.me/${BOT_USERNAME}?start=donate` }],
          ],
        },
      });
    await bot.pinChatMessage(CHANNEL, post.message_id);
    bot.sendMessage(msg.chat.id, '✅ Пост опубликован и закреплён в ' + CHANNEL);
  } catch (e) {
    bot.sendMessage(msg.chat.id, '❌ Ошибка: ' + e.message);
  }
});

// Профиль бота: команды, описание, кнопка меню (запускается при старте, ошибки не критичны)
(async () => {
  try {
    for (const lang of LANGS) {
      const t = L[lang], opts = lang === 'ru' ? {} : { language_code: lang };
      await bot.setMyCommands(Object.entries(t.cmds).map(([command, description]) => ({ command, description })), opts);
      await bot.setMyDescription({ description: t.desc, ...opts });
      await bot.setMyShortDescription({ short_description: t.short, ...opts });
    }
    await bot.setChatMenuButton({ menu_button: JSON.stringify({ type: 'web_app', text: L.ru.menu, web_app: { url: WEB_URL } }) });
    console.log('✅ Профиль бота обновлён (команды, описание, кнопка меню)');
  } catch (e) { console.error('⚠️ Не удалось обновить профиль бота:', e.message); }
})();

console.log('✅ Russia TV Hub бот запущен!');
