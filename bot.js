const TelegramBot = require('node-telegram-bot-api');

const TOKEN   = '8846615980:AAGUUb1s2fUfzeLH5D14fEj9_asvTqltCN4';
const CHANNEL = '@RussiaTV_Hub_Live';
const APP_URL = 'https://t.me/RussiaTVHub_bot/russiatv';
const WEB_URL = 'https://varenik-ai.github.io/russia-tv-hub/?v=14';

const bot = new TelegramBot(TOKEN, { polling: { interval: 2000, autoStart: true, params: { timeout: 10 } } });

bot.onText(/\/start/, (msg) => {
  const name = msg.from.first_name || '';
  const lang = (msg.from.language_code || 'ru').split('-')[0];

  const greetings = {
    ru: `🇷🇺 Привет, ${name}!

📺 *РОССИЯ·ТВ — 35 каналов прямого эфира в Telegram*

Смотри российское телевидение онлайн — бесплатно, без VPN, без регистрации, 24/7.

📡 *Новости:* Первый канал, Россия 1, НТВ, Россия 24, Пятый, МИР, Звезда, ТВЦ, 360°
🎬 *Развлечения:* ТНТ, Россия К, Соловьёв Live, История
🎥 *Кино:* Дом Кино, Кинохит, Ретро, Кинокомедия, Viju, Наше кино, Родное кино и др.
👶 *Детские:* Карусель, Мульт, Nickelodeon, Уникум
🎵 *Музыка:* МУЗ-ТВ, Музыка Первого, RU.TV
🌿 *Хобби:* Охота и рыбалка, Загородная жизнь

✅ HD · iOS · Android · Desktop · 8 языков`,

    bg: `🇷🇺 Здравейте, ${name}!

📺 *РОССИЯ·ТВ — 35 руски канала на живо в Telegram*

Гледайте руска телевизия онлайн — безплатно, без VPN, без регистрация, 24/7.

📡 *Новини:* Первый канал, Россия 1, НТВ, Россия 24, МИР, Звезда
🎬 *Развлечения:* ТНТ, Россия К, Соловьёв Live
🎥 *Кино:* Дом Кино, Кинохит, Ретро, Наше кино и още
👶 *Детски:* Карусель, Мульт, Nickelodeon

✅ HD · iOS · Android · Desktop · 8 езика`,

    en: `🇷🇺 Hello, ${name}!

📺 *РОССИЯ·ТВ — 35 Russian TV channels live on Telegram*

Watch Russian television online — free, no VPN, no registration, 24/7.

📡 *News:* Channel One, Russia 1, NTV, Russia 24, MIR, Zvezda
🎬 *Entertainment:* TNT, Russia K, Solovyov Live
🎥 *Movies:* Dom Kino, KinoHit, Retro, Our Cinema and more
👶 *Kids:* Karusel, Mult, Nickelodeon

✅ HD · iOS · Android · Desktop · 8 languages`,

    uk: `🇷🇺 Привіт, ${name}!

📺 *РОССИЯ·ТВ — 35 каналів прямого ефіру в Telegram*

Дивись російське телебачення онлайн — безкоштовно, без VPN, без реєстрації, 24/7.

📡 *Новини:* Перший канал, Росія 1, НТВ, Росія 24, МИР, Зірка
🎬 *Розваги:* ТНТ, Росія К, Соловйов Live
🎥 *Кіно:* Дом Кіно, Кінохіт, Ретро, Наше кіно та інші
👶 *Дитячі:* Карусель, Мульт, Nickelodeon

✅ HD · iOS · Android · Desktop · 8 мов`,

    de: `🇷🇺 Hallo, ${name}!

📺 *РОССИЯ·ТВ — 35 russische Sender live auf Telegram*

Russisches Fernsehen online schauen — kostenlos, kein VPN, keine Anmeldung, 24/7.

📡 *Nachrichten:* Erster Kanal, Russland 1, NTV, Russland 24, MIR
🎬 *Unterhaltung:* TNT, Russland K, Solovyov Live
🎥 *Kino:* Dom Kino, KinoHit, Retro und mehr
👶 *Kinder:* Karusel, Mult, Nickelodeon

✅ HD · iOS · Android · Desktop · 8 Sprachen`,

    fr: `🇷🇺 Bonjour, ${name}!

📺 *РОССИЯ·ТВ — 35 chaînes russes en direct sur Telegram*

Regardez la télévision russe en ligne — gratuit, sans VPN, sans inscription, 24/7.

📡 *Actualités:* Première Chaîne, Russie 1, NTV, Russie 24, MIR
🎬 *Divertissement:* TNT, Russie K, Solovyov Live
🎥 *Cinéma:* Dom Kino, KinoHit, Rétro et plus
👶 *Enfants:* Karusel, Mult, Nickelodeon

✅ HD · iOS · Android · Desktop · 8 langues`,

    es: `🇷🇺 ¡Hola, ${name}!

📺 *РОССИЯ·ТВ — 35 canales rusos en vivo en Telegram*

Mira la televisión rusa en línea — gratis, sin VPN, sin registro, 24/7.

📡 *Noticias:* Canal Uno, Rusia 1, NTV, Rusia 24, MIR
🎬 *Entretenimiento:* TNT, Rusia K, Solovyov Live
🎥 *Cine:* Dom Kino, KinoHit, Retro y más
👶 *Infantil:* Karusel, Mult, Nickelodeon

✅ HD · iOS · Android · Desktop · 8 idiomas`,

    tr: `🇷🇺 Merhaba, ${name}!

📺 *РОССИЯ·ТВ — Telegram'da 35 Rus kanalı canlı yayın*

Rus televizyonunu çevrimiçi izleyin — ücretsiz, VPN'siz, kayıt gerekmez, 7/24.

📡 *Haberler:* Birinci Kanal, Rusya 1, NTV, Rusya 24, MIR
🎬 *Eğlence:* TNT, Rusya K, Solovyov Live
🎥 *Sinema:* Dom Kino, KinoHit, Retro ve daha fazlası
👶 *Çocuk:* Karusel, Mult, Nickelodeon

✅ HD · iOS · Android · Desktop · 8 dil`,
  };

  const btnWatch = {
    ru: '📺 Открыть Russia TV Live',
    bg: '📺 Отвори Russia TV Live',
    en: '📺 Open Russia TV Live',
    de: '📺 Russia TV Live öffnen',
    fr: '📺 Ouvrir Russia TV Live',
    uk: '📺 Відкрити Russia TV Live',
    es: '📺 Abrir Russia TV Live',
    tr: '📺 Russia TV Live Aç',
  };

  const btnBrowser = {
    ru: '🌐 Открыть в браузере',
    bg: '🌐 Отвори в браузър',
    en: '🌐 Open in browser',
    de: '🌐 Im Browser öffnen',
    fr: '🌐 Ouvrir dans le navigateur',
    uk: '🌐 Відкрити у браузері',
    es: '🌐 Abrir en navegador',
    tr: '🌐 Tarayıcıda aç',
  };

  bot.sendMessage(msg.chat.id, greetings[lang] || greetings.ru, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: btnWatch[lang]   || btnWatch.ru,   web_app: { url: WEB_URL } }],
        [{ text: btnBrowser[lang] || btnBrowser.ru, url: WEB_URL }],
      ]
    }
  });
});

// /post — публикует и закрепляет пост в канале @RussiaTV_Hub_Live
bot.onText(/\/post/, async (msg) => {
  try {
    const post = await bot.sendMessage(CHANNEL,
`🇷🇺 *РОССИЯ·ТВ — 35 КАНАЛОВ В ПРЯМОМ ЭФИРЕ* 🔴

Смотрите *ведущие российские телеканалы* прямо в Telegram — *бесплатно, без VPN, без регистрации, 24/7.*

━━━━━━━━━━━━━━━━━━━━
📡 *НОВОСТИ*
▪️ Первый канал · Россия 1 · НТВ · НТВ Хит
▪️ Россия 24 · Пятый канал · ТВЦ · МИР · Звезда · 360°

🎬 *РАЗВЛЕЧЕНИЯ*
▪️ ТНТ · Россия К · Соловьёв Live · История

🎥 *КИНО*
▪️ Дом Кино · T24 · Кинохит · Ретро · Кинокомедия
▪️ Кинопремьера · Viju · Наше кино · Родное кино
▪️ Кинопоказ · Киносвидание · Индийское кино

👶 *ДЕТСКИЕ*
▪️ Карусель · Мульт · Nickelodeon · Уникум

🎵 *МУЗЫКА*
▪️ МУЗ-ТВ · Музыка Первого · RU.TV

🌿 *ХОББИ*
▪️ Охота и рыбалка · Загородная жизнь
━━━━━━━━━━━━━━━━━━━━

✅ HD · iOS · Android · Desktop · 8 языков

👇 *Нажмите кнопку и выберите канал:*`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '📺 Открыть Russia TV Live', url: APP_URL }
          ]]
        }
      }
    );
    await bot.pinChatMessage(CHANNEL, post.message_id);
    bot.sendMessage(msg.chat.id, '✅ Пост опубликован и закреплён в @RussiaTV_Hub_Live!');
  } catch(e) {
    bot.sendMessage(msg.chat.id, '❌ Ошибка: ' + e.message);
  }
});

console.log('✅ Russia TV Hub бот запущен!');
