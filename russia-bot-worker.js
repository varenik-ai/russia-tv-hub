// russia-bot-worker.js — бот @RussiaTVHub_bot на Cloudflare Workers (webhook). Работает 24/7 и не зависит от вашего компьютера.
// Секреты задаются в Cloudflare (Workers & Pages → russia-bot-worker → Settings → Variables and secrets), НЕ в коде:
//   BOT_TOKEN — токен от @BotFather (тип Secret), ADMIN_ID — числовой Telegram id администратора (для /post).
// После деплоя один раз откройте https://russia-bot-worker.dyaltd.workers.dev/setup — воркер сам зарегистрирует webhook,
// команды, описание и кнопку меню. Тексты и команды совпадают с bot.js (локальный вариант на polling).
const CHANNEL = '@RussiaTV_Hub_Live';
const BOT_USERNAME = 'RussiaTVHub_bot';
const APP_URL = 'https://t.me/RussiaTVHub_bot/russiatv';
const WEB_URL = 'https://varenik-ai.github.io/russia-tv-hub/?v=14';
const SITE_URL = 'https://russian-tv.com/';
const TOTAL = 59;
const STARS = [25, 100, 500];
const DONATE_AMOUNTS = [25, 50, 100, 250];   // суммы окна «Поблагодарить» в мини-аппе (/invoice)
const DONATE_URL = APP_URL + '?startapp=donate';   // кнопка под постом открывает мини-апп сразу с окном выбора ⭐

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
  const rows = [[{ text: t.open, web_app: { url: WEB_URL } }], [{ text: t.site, url: SITE_URL }], [{ text: t.help, callback_data: 'help' }]];
  if (withDonate) rows[2].push({ text: t.donate, callback_data: 'donate' });
  return { inline_keyboard: rows };
}
const donateKb = () => ({ inline_keyboard: [STARS.map((n) => ({ text: '⭐ ' + n, callback_data: 'don:' + n }))] });
const helpKb = (lang) => ({ inline_keyboard: [[{ text: L[lang].open, web_app: { url: WEB_URL } }], [{ text: L[lang].site, url: SITE_URL }]] });

async function sha256hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const webhookSecret = async (env) => (await sha256hex(env.BOT_TOKEN + ':rtvhub-webhook')).slice(0, 48);

async function tg(env, method, body) {
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });
  return r.json().catch(() => ({ ok: false }));
}
const send = (env, chat_id, text, extra = {}) => tg(env, 'sendMessage', { chat_id, text, ...extra });

async function handleMessage(env, msg) {
  if (msg.successful_payment) return send(env, msg.chat.id, L[pickLang(msg.from && msg.from.language_code)].donate_ok);
  const text = (msg.text || '').trim();
  if (!text.startsWith('/')) return;
  const chatId = msg.chat.id, lang = pickLang(msg.from && msg.from.language_code), t = L[lang];
  const m = /^\/(\w+)(?:@\w+)?(?:\s+(\w+))?/.exec(text);
  if (!m) return;
  const cmd = m[1].toLowerCase(), arg = m[2];
  if (cmd === 'start') {
    if (arg === 'help') return send(env, chatId, t.help_t, { parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: helpKb(lang) });
    if (arg === 'donate') return send(env, chatId, t.donate_ask, { reply_markup: donateKb() });
    return send(env, chatId, t.start(esc(msg.from && msg.from.first_name)), { parse_mode: 'HTML', reply_markup: kb(lang) });
  }
  if (cmd === 'help') return send(env, chatId, t.help_t, { parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: helpKb(lang) });
  if (cmd === 'channels') {
    const body = `<b>${esc(t.channels_t)} (${TOTAL})</b>\n\n` + GROUPS.map(([e, name, list]) => `${e} <b>${esc(name)}</b>\n${esc(list)}`).join('\n\n');
    return send(env, chatId, body, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: t.open, web_app: { url: WEB_URL } }]] } });
  }
  if (cmd === 'donate') return send(env, chatId, t.donate_ask, { reply_markup: donateKb() });
  if (cmd === 'fixpost') {
    if (!env.ADMIN_ID || String(msg.from && msg.from.id) !== String(env.ADMIN_ID)) return;   // только администратор
    // Правит кнопки закреплённого поста на месте (editMessageReplyMarkup): новое сообщение не уходит, подписчики ничего не получают
    const chat = await tg(env, 'getChat', { chat_id: CHANNEL });
    const pin = chat.ok && chat.result.pinned_message;
    if (!pin) return send(env, chatId, '❌ Закреплённый пост не найден: ' + (chat.description || 'нет закреплённого сообщения'));
    const ru = L.ru;
    const old = JSON.stringify(pin.reply_markup ? pin.reply_markup.inline_keyboard.map((r) => r.map((b) => b.text + ' → ' + (b.url || ''))) : null);
    const r = await tg(env, 'editMessageReplyMarkup', { chat_id: CHANNEL, message_id: pin.message_id, reply_markup: { inline_keyboard: [[{ text: ru.open, url: APP_URL }], [{ text: ru.site, url: SITE_URL }], [{ text: ru.help, url: `https://t.me/${BOT_USERNAME}?start=help` }, { text: ru.donate, url: DONATE_URL }]] } });
    return send(env, chatId, r.ok ? '✅ Кнопки закреплённого поста (id ' + pin.message_id + ') обновлены, подписчикам ничего не отправлено.\nБыло: ' + old : '❌ Не удалось: ' + (r.description || 'unknown') + '\nКнопки сейчас: ' + old);
  }
  if (cmd === 'post') {
    if (!env.ADMIN_ID || String(msg.from && msg.from.id) !== String(env.ADMIN_ID)) return;   // только администратор
    const ru = L.ru;
    const post = await send(env, CHANNEL, `📺 <b>Русское ТВ в Telegram — ${TOTAL} каналов в прямом эфире</b>\n\nНовости, кино, детям, спорт, музыка. Бесплатно, без регистрации, из любой страны.\n\n👇 Откройте приложение и выберите канал`, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[{ text: ru.open, url: APP_URL }], [{ text: ru.site, url: SITE_URL }], [{ text: ru.help, url: `https://t.me/${BOT_USERNAME}?start=help` }, { text: ru.donate, url: DONATE_URL }]] },
    });
    if (post && post.ok) { await tg(env, 'pinChatMessage', { chat_id: CHANNEL, message_id: post.result.message_id }); return send(env, chatId, '✅ Пост опубликован и закреплён в ' + CHANNEL); }
    return send(env, chatId, '❌ Ошибка: ' + ((post && post.description) || 'не удалось опубликовать'));
  }
}

async function handleCallback(env, q) {
  const lang = pickLang(q.from && q.from.language_code), chatId = q.message && q.message.chat && q.message.chat.id, t = L[lang];
  await tg(env, 'answerCallbackQuery', { callback_query_id: q.id });
  if (!chatId) return;
  if (q.data === 'help') return send(env, chatId, t.help_t, { parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: helpKb(lang) });
  if (q.data === 'donate') return send(env, chatId, t.donate_ask, { reply_markup: donateKb() });
  const m = /^don:(\d+)$/.exec(q.data || '');
  if (m && STARS.includes(Number(m[1]))) {
    const amount = Number(m[1]);
    const inv = await tg(env, 'sendInvoice', { chat_id: chatId, title: t.donate_t, description: t.donate_d, payload: 'donate_' + amount, provider_token: '', currency: 'XTR', prices: [{ label: t.donate_t, amount }] });
    if (!inv.ok) await send(env, chatId, '⚠️ ' + t.donate_t + ' — ' + (inv.description || 'error'));   // показываем причину отказа Telegram, а не молчим
    return inv;
  }
}

async function handleUpdate(env, u) {
  if (u.message) return handleMessage(env, u.message);
  if (u.callback_query) return handleCallback(env, u.callback_query);
  if (u.pre_checkout_query) return tg(env, 'answerPreCheckoutQuery', { pre_checkout_query_id: u.pre_checkout_query.id, ok: true });
}

async function setup(env, origin) {
  const out = {};
  out.webhook = (await tg(env, 'setWebhook', { url: origin + '/hook', secret_token: await webhookSecret(env), allowed_updates: ['message', 'callback_query', 'pre_checkout_query'] })).ok;
  for (const lang of LANGS) {
    const t = L[lang], extra = lang === 'ru' ? {} : { language_code: lang };
    await tg(env, 'setMyCommands', { commands: Object.entries(t.cmds).map(([command, description]) => ({ command, description })), ...extra });
    await tg(env, 'setMyDescription', { description: t.desc, ...extra });
    await tg(env, 'setMyShortDescription', { short_description: t.short, ...extra });
  }
  out.menu = (await tg(env, 'setChatMenuButton', { menu_button: { type: 'web_app', text: L.ru.menu, web_app: { url: WEB_URL } } })).ok;
  const info = await tg(env, 'getWebhookInfo', {});
  out.webhookUrl = info.result && info.result.url; out.pending = info.result && info.result.pending_update_count; out.lastError = info.result && info.result.last_error_message;
  return out;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!env.BOT_TOKEN) return new Response('BOT_TOKEN не задан: добавьте секрет в настройках воркера', { status: 500 });
    if (url.pathname === '/invoice') {   // /invoice?amount=50 — ссылка на оплату Stars для мини-аппа: tg.openInvoice(url)
      const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
      const amount = parseInt(url.searchParams.get('amount'), 10);
      if (!DONATE_AMOUNTS.includes(amount)) return new Response(JSON.stringify({ error: 'bad amount' }), { status: 400, headers: cors });
      const r = await tg(env, 'createInvoiceLink', { title: L.ru.donate_t, description: L.ru.donate_d, payload: 'donate_' + amount, provider_token: '', currency: 'XTR', prices: [{ label: 'Russia TV', amount }] });
      return new Response(JSON.stringify(r.ok ? { url: r.result } : { error: r.description }), { status: r.ok ? 200 : 502, headers: cors });
    }
    if (url.pathname === '/setup') return new Response(JSON.stringify(await setup(env, url.origin), null, 2), { headers: { 'content-type': 'application/json' } });
    if (request.method === 'POST' && url.pathname === '/hook') {
      if (request.headers.get('x-telegram-bot-api-secret-token') !== (await webhookSecret(env))) return new Response('forbidden', { status: 403 });
      let update; try { update = await request.json(); } catch (e) { return new Response('bad request', { status: 400 }); }
      ctx.waitUntil(handleUpdate(env, update).catch(() => {}));
      return new Response('ok');
    }
    return new Response('Russia TV Hub bot');
  },
};
