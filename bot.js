const TelegramBot = require('node-telegram-bot-api');

const TOKEN   = '8846615980:AAGUUb1s2fUfzeLH5D14fEj9_asvTqltCN4';
const CHANNEL = '@RussiaTV_Hub_Live';
const APP_URL = 'https://t.me/RussiaTVHub_bot/russiatv';
const WEB_URL = 'https://varenik-ai.github.io/russia-tv-hub/?v=13';

const bot = new TelegramBot(TOKEN, { polling: { interval: 2000, autoStart: true, params: { timeout: 10 } } });

bot.onText(/\/start/, (msg) => {
  const name = msg.from.first_name || '';
  const lang = (msg.from.language_code || 'ru').split('-')[0];

  const greetings = {
    ru: `🇷🇺 Привет, ${name}! Добро пожаловать в *Russia TV Live*

📺 *18 российских каналов прямо в Telegram* — бесплатно, без регистрации, 24/7.

🔴 *Самые популярные:*
▪️ Россия 1, Первый Канал, НТВ
▪️ Россия 24, Пятый канал, ОТР, РЕН ТВ
▪️ Матч ТВ, Матч Премьер, Матч Футбол 1/2/3
▪️ ТНТ, СТС, Пятница, Домашний, ТВ-3
▪️ Карусель, Мульт, Disney Channel, Nickelodeon
▪️ МУЗ-ТВ, RU.TV, Bridge TV

✅ HD качество · iOS, Android, Desktop · 8 языков`,

    bg: `🇷🇺 Здравейте, ${name}! Добре дошли в *Russia TV Live*

📺 *18 руски канала директно в Telegram* — безплатно, без регистрация, 24/7.

🔴 *Най-популярните канали:*
▪️ Россия 1, Первый Канал, НТВ
▪️ Россия 24, РЕН ТВ, Матч ТВ
▪️ ТНТ, СТС, Карусель, Мульт

✅ HD качество · iOS, Android, Desktop · 8 езика`,

    en: `🇷🇺 Hello, ${name}! Welcome to *Russia TV Live*

📺 *18 Russian TV channels right in Telegram* — free, no registration, 24/7.

🔴 *Most popular channels:*
▪️ Russia 1, Channel One, NTV
▪️ Russia 24, Ren TV, Match TV
▪️ TNT, STS, Karusel, Mult

✅ HD quality · iOS, Android, Desktop · 8 languages`,

    uk: `🇷🇺 Привіт, ${name}! Ласкаво просимо до *Russia TV Live*

📺 *18 російських каналів прямо в Telegram* — безкоштовно, без реєстрації, 24/7.

🔴 *Найпопулярніші канали:*
▪️ Россия 1, Первый Канал, НТВ
▪️ Россия 24, РЕН ТВ, Матч ТВ
▪️ ТНТ, СТС, Карусель, Мульт

✅ HD якість · iOS, Android, Desktop · 8 мов`,

    de: `🇷🇺 Hallo, ${name}! Willkommen bei *Russia TV Live*

📺 *18 russische Sender direkt in Telegram* — kostenlos, ohne Anmeldung, 24/7.

🔴 *Beliebteste Sender:*
▪️ Rossija 1, Perwyi Kanal, NTW
▪️ Rossija 24, Match TV, TNT, STS

✅ HD-Qualität · iOS, Android, Desktop · 8 Sprachen`,

    fr: `🇷🇺 Bonjour, ${name}! Bienvenue sur *Russia TV Live*

📺 *18 chaînes russes directement dans Telegram* — gratuit, sans inscription, 24/7.

🔴 *Chaînes les plus populaires:*
▪️ Russie 1, Première Chaîne, NTV
▪️ Russie 24, Match TV, TNT, STS

✅ Qualité HD · iOS, Android, Desktop · 8 langues`,

    es: `🇷🇺 Hola, ${name}! Bienvenido a *Russia TV Live*

📺 *18 canales rusos directamente en Telegram* — gratis, sin registro, 24/7.

🔴 *Canales más populares:*
▪️ Rusia 1, Canal Uno, NTV
▪️ Rusia 24, Match TV, TNT, STS

✅ Calidad HD · iOS, Android, Desktop · 8 idiomas`,

    tr: `🇷🇺 Merhaba, ${name}! *Russia TV Live*'a hoş geldiniz

📺 *Telegram'da 18 Rus kanalı* — ücretsiz, kayıt gerekmez, 7/24.

🔴 *En popüler kanallar:*
▪️ Rossiya 1, Perviy Kanal, NTV
▪️ Rossiya 24, Match TV, TNT, STS

✅ HD kalite · iOS, Android, Desktop · 8 dil`,
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
`🇷🇺 *RUSSIA TV LIVE — 18 КАНАЛОВ В ПРЯМОМ ЭФИРЕ* 🔴

Смотрите *ведущие российские телеканалы* прямо в Telegram — *бесплатно, без регистрации, 24/7.*

━━━━━━━━━━━━━━━━━━━━
📡 *НОВОСТИ И ОБЩИЕ*
▪️ Россия 1 · НТВ · Россия 24
▪️ Пятый канал · РЕН ТВ · ТВЦ
▪️ МИР · Звезда

🎬 *РАЗВЛЕЧЕНИЯ И КИНО*
▪️ СТС · Пятница · ТНТ4
▪️ Россия К · Соловьёв Live

👶 *ДЕТСКИЕ*
▪️ Карусель · Мульт · Nickelodeon

🎵 *МУЗЫКА*
▪️ МУЗ-ТВ · RU.TV
━━━━━━━━━━━━━━━━━━━━

✅ HD качество 24/7
✅ iOS · Android · Desktop

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
