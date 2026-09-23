// russia-worker-v82.js
// CF Worker — CORS-only режим
// v82: фиксы сломанных каналов + оптимизация кеша
//
// ИЗМЕНЕНИЯ от v81:
//   ch360    : facecast.io (timeout) → thestream.cyou/live/7000.m3u8
//   ntv_hit  : cdn.ntv.ru (CORS блок, замены нет) → УДАЛЁН
//   russiyaK : ДОБАВЛЕН (cinerama.uz/1048) — Россия Культура
//   cacheEverything: false/cacheTtl:-1 → убраны (CF кешированием управляет s-maxage из ответа)
//
// ИЗМЕНЕНИЯ v82.3 (фикс "Кинопремьера останавливается через какое-то время"):
//   workerOrigin для переписывания суб-плейлистов был ЗАХАРДКОЖЕН на
//   'https://russia-worker.varenik-ai.workers.dev' — этот workers.dev адрес
//   перестал отвечать (Failed to fetch). Каналы с master-плейлистом (несколько
//   битрейтов), например Кинопремьера (cinerama.uz/1207), после первых
//   сегментов упирались в суб-плейлист, переписанный на мёртвый домен →
//   playback останавливался. У большинства каналов один битрейт без
//   суб-плейлистов, поэтому баг был не виден. Теперь workerOrigin берётся
//   динамически из request.url (тот же origin, через который пришёл запрос —
//   stream.russian-tv.com), а не хардкодится.
//
// ИЗМЕНЕНИЯ v82.4 (фикс "чёрный экран, статус Прямой эфир навсегда" у
// Первого канала, России 1, России 24):
//   Источник (cinerama.uz) для этих 3 каналов детектит датацентровый IP
//   Cloudflare Workers и вместо реального медиа-плейлиста отдаёт "ловушку" —
//   master-плейлист с единственным вариантом, который указывает сам на себя.
//   HLS.js уходит в бесконечный цикл запросов без единой реальной ошибки —
//   отсюда статус "Прямой эфир" висит вечно без картинки. Обычные браузеры
//   (не датацентр) получают от источника нормальный контент — то есть дело
//   не в нашем коде плеера, а в блокировке на стороне источника именно для
//   прокси-инфраструктуры. Добавлена детекция self-loop → вместо
//   зацикленного контента отдаём настоящую ошибку (502), это останавливает
//   шторм запросов и даёт клиентскому watchdog'у/ротации прокси реальный шанс
//   восстановиться или показать понятную ошибку вместо тихого зависания.

const VERSION = '82.31.0';
// v82.30: Россия 24 всё ещё без звука у пользователя ПОСЛЕ v82.29 и синхронизации
// резервных Worker'ов (проверил все 3 — везде отдают одинаковый корректный
// synthetic-master, hls.js на desktop/Android декодирует звук без единой
// ошибки что с той же, что и с чужой страницы). Разгадка — v82.29-мастер шёл
// БЕЗ атрибута CODECS у EXT-X-STREAM-INF. hls.js это прощает, а нативный
// AVPlayer на iOS (мини-апп на iPhone идёт НЕ через hls.js, а через
// video.src напрямую — см. ветку canPlayType('application/vnd.apple.mpegurl'))
// в части версий из-за отсутствия CODECS может не надёжно привязать
// отдельную AUDIO-группу к видео-варианту — картинка идёт, звука нет.
// Добавлен CODECS="avc1.4d401f,mp4a.40.2" (стандартный H.264 baseline +
// AAC-LC) — по спецификации Apple HLS Authoring Guidelines это обязательный
// атрибут именно для надёжной работы alternate audio на AVPlayer.
// v82.29: РЕАЛЬНЫЙ фикс "Россия 24 без звука" (плюс объясняет часть
// репортов "заводится только с N-й попытки" — не было связано с прокси).
// Источник Россия 24 отдаёт видео и звук РАЗДЕЛЬНО (playlist_2 = только
// видео, playlist_6 = только звук) — не смешаны в одном файле, как у
// остальных каналов ВГТРК. Раньше playlist_2 использовался один — играло
// видео без звука. Теперь строим свой master-плейлист (SYNTHETIC_AV,
// buildSyntheticAVResponse), который стандартным HLS-механизмом
// (EXT-X-MEDIA TYPE=AUDIO) явно связывает видео- и аудио-дорожку — hls.js
// сам их мультиплексирует. Проверено вживую: реальное видео (305 кадров,
// 0 потерь) и звук (250КБ декодировано) одновременно, без ошибок.
// v82.28: Звезда — пользователь сообщил, что первые 2 варианта качества
// (hdlow 720p, hdhigh 1080p) не воспроизводятся, третий (sdhigh 576p) —
// работает. Убрали master-плейлист, указываем сразу на sdhigh. См.
// комментарий у STREAMS.zvezda.
// v82.27: по запросу пользователя проверил ВСЕ остальные каналы на тот же
// дефект, что был у МИР ("фейковый" master-плейлист с одним вариантом,
// лишний сетевой проход). Проверка (через сам Worker — важно проверять
// именно так, а не из обычного браузера: источник отдаёт разный ответ по
// IP, см. ниже про Viju+ Sport):
//   НТВ, ТВЦ, Звезда — настоящие ABR-меню (3 реальных варианта каждый),
//     не трогал.
//   Пятый канал — настоящие 2 варианта, не трогал.
//   floHockey/floRacing/redbull/unbeaten/freesports — настоящие ABR (5-6
//     вариантов), не трогал.
//   Первый/Дом Кино/Россия 1/24/Соловьёв/Карусель/Москва24/ТНТ4/
//     catcast.tv-каналы/M1 Global MMA — уже прямые медиа-плейлисты, без
//     мастера, ничего делать не нужно.
//   Viju+ Sport — НАШЁЛ тот же дефект: для датацентрового IP наших
//     Worker'ов источник (cinerama.uz) отдавал по пути 1229/mono.m3u8
//     "фейковый" master с одним вариантом (хотя из обычного браузера тот
//     же URL отдаёт медиа-плейлист напрямую — видимо, тот же механизм, что
//     отличает наш прокси-трафик, что и у self-loop блокировки). Исправлено
//     — путь в CINERAMA_PATH сразу указывает на tracks-v1a1/mono.m3u8.
// v82.26: МИР заводился только с 3-4 попытки. Источник (oktv.kz) отдавал
// master-плейлист (index.m3u8) с ОДНИМ вариантом — не настоящее ABR-меню,
// а просто лишняя пересылка. Из-за этого Worker на каждый запрос делал
// двойной проход (мастер → /playlist?url=... → реальный медиа-плейлист) —
// два сетевых похода вместо одного, вдвое больше точек, где что-то может
// не успеть/зависнуть. Проверил остальные многобитрейтные источники (НТВ,
// ТВЦ, Звезда) — у них НАСТОЯЩИЕ ABR-меню с 3 реальными вариантами
// качества каждый, тот же двойной проход там осознанный (hls.js сам
// выбирает битрейт) — их не трогал. У МИР же указываем сразу на реальный
// медиа-плейлист (tracks-v1a1/mono.m3u8), убирая лишний проход.
// v82.25: два независимых фикса по свежим репортам пользователя.
//
// 1) Первый канал "намертво фризится через пол минуты", Россия 1 фризится,
//    третий по счёту вариант качества у обоих работает стабильнее — понизил
//    битрейт у обоих:
//      perviy: thestream.cyou/210, БЫЛО -1k_v5 (576p, ~2.1 Мбит/с — самый
//        тяжёлый из 3 вариантов master-плейлиста) → СТАЛО -2k_v5 (360p,
//        ~800 кбит/с — третий по порядку вариант в master-плейлисте, тот,
//        который пользователь просил сделать основным).
//      rossiya1: stream.smotrim.ru/hls2/russia_hd, БЫЛО playlist_3
//        (~2.6 Мбит/с) → СТАЛО playlist_2 (~0.9 Мбит/с) — тот же источник,
//        ниже битрейт, должно устранить фризы на мобильной сети/Telegram
//        WebView.
//
// 2) Каналы на cinerama.uz продолжали давать "Ошибка сервера" (viju,
//    kinosvidanie, muzykaPervogo) — self-loop блокировка датацентрового IP
//    скачет между зеркалами (stream1/stream3/stream8) буквально каждые
//    несколько минут: один и тот же ID то заблокирован на stream8, то на
//    stream1, то снова разблокирован. Ручные правки конкретного зеркала под
//    конкретный канал (как в v82.24) не выдерживают — блокировка успевает
//    переехать на другое зеркало быстрее, чем мы деплоим фикс.
//    РЕШЕНИЕ: убрал жёстко прописанный хост для всех cinerama.uz-каналов,
//    Worker теперь сам перебирает зеркала (stream1 → stream3 → stream8) на
//    каждый запрос и отдаёт первое, которое не self-loop — см. CINERAMA_PATH
//    и fetchCinerama() ниже. Это устраняет весь класс проблемы, а не
//    конкретный сегодняшний список сломанных ID.
// v82.24: 9 каналов (nasheKino, istoriya, kinohit, viju, indiyskoekino, mult,
// muztv, muzykaPervogo, ohotarybalka) снова поймали self-loop блок cinerama.uz
// именно на хосте stream8 (ровно то, из-за чего пользователь видел "Ошибка
// сервера" на "Наше кино" и "Киносвидание"). ВАЖНАЯ НАХОДКА: блокировка
// привязана к конкретной паре host+ID, а не ко всему домену/аккаунту — тот же
// контент (тот же поток) доступен и с других mirror-хостов cinerama.uz
// (stream1, stream3), которые НЕ блокируют датацентровый IP наших Worker'ов
// для этих же ID. Переключил все 9 сломанных каналов на stream1 — проверено
// вживую через сам Worker (/playlist?url=...), self-loop не возникает.
// На будущее: если снова появится "Ошибка сервера" у канала на cinerama.uz,
// первым делом попробовать этот же ID на stream1/stream3 вместо поиска
// совершенно другого источника — обычно это тот же самый живой поток.
// v82.23: ДОБАВЛЕН новый канал Москва 24 (moskva24) — официальный CDN ВГТРК
// (stream.smotrim.ru/hls2/moscow_24/...), проверено вживую: живой
// PROGRAM-DATE-TIME, сегменты 200 с открытым CORS (Access-Control-Allow-
// Origin: *). ТНТ (не ТНТ4) и Кинокомедия — искал повторно, рабочей
// CORS-совместимой альтернативы не нашёл (официальные tnt-online.ru/
// premier.one отдают плеер через iframe/DRM без прямого m3u8, catcast.tv
// для кинокомедии остаётся единственным источником).
// v82.9: ещё нашлась замена для nasheKino (fs.uplink.kz/nashe_novoe_kino).
// Остальные 8 сломанных (t24, retro, kinopremiera, kinopokaz, rutv,
// ohotarybalka, zagorodnaya, unikum) — замену не нашёл несмотря на
// расширенный перебор slug'ов fs.uplink.kz и других источников.

// ИЗМЕНЕНИЯ v82.8 (блокировка cinerama.uz продолжила расширяться, теперь
// затронув ещё 11 каналов: ТВ Центр, T24, История, Дом кино, Кинохит, Ретро,
// Наше кино, Кинопоказ, Индийское кино, Охота и рыбалка, Загородная жизнь.
// ВАЖНО: сама блокировка похожа не на постоянный чёрный список ID, а на
// плавающую/ротирующуюся — часть каналов то ломается, то сама восстанавли-
// вается без наших изменений. Долгосрочно вся зависимость от cinerama.uz
// ненадёжна):
//   5 из 11 переведены на fs.uplink.kz — проверено вживую:
//   tvc, istoriya, domkino, kinohit, indiyskoekino
//   6 каналов (t24, retro, nasheKino, kinopokaz, ohotarybalka, zagorodnaya) —
//   замену с открытым CORS не нашёл, остаются на cinerama.uz.

// ── ПОДТВЕРЖДЁННЫЕ СЛАГИ fs.uplink.kz (для будущих миграций) ──────────────
// zvezda, mir, kinosvidanie, mult, muz_tv, muzyka_pervogo, rodnoe_kino,
// tvc, istoriya, dom_kino, kinohit, indiyskoe_kino,
// viju_nature, viju_explore, viju_history, viju_sport, zhara
// Паттерн URL: https://fs.uplink.kz/{slug}/mono.m3u8?token=onlinetv

// ИЗМЕНЕНИЯ v82.7 (срочно — cinerama.uz резко расширил self-loop блокировку
// датацентрового IP ещё на 12 каналов сразу: Звезда, Мир, Кинопремьера, Viju,
// Родное кино, Киносвидание, Мульт, Муз-ТВ, Музыка Первого, RU.TV, Охота и
// рыбалка, Уникум):
//   8 из 12 переведены на fs.uplink.kz (казахстанский агрегатор) — проверено
//   вживую, живой PROGRAM-DATE-TIME, открытый CORS на сегментах:
//   zvezda, mir, kinosvidanie, mult, muztv, rodnoeKino, muzykaPervogo, viju
//   (для viju точного аналога нет, взят ближайший тематический саб-бренд —
//   контент будет отличаться от исходного Viju TV, см. комментарий у ключа).
//   4 канала (kinopremiera, rutv, ohotarybalka, unikum) — альтернативу с
//   открытым CORS пока не нашёл, остаются на cinerama.uz с self-loop-
//   детектором (не виснут молча, но и не показывают картинку).
//   Учитывая, что блокировка cinerama.uz активно расширяется, остальные
//   каналы на cinerama.uz (istoriya, domkino, kinohit, retro, nasheKino,
//   kinopokaz, indiyskoekino, t24, tvc, zagorodnaya) тоже под риском —
//   нужен мониторинг.

// ИЗМЕНЕНИЯ v82.6 (срочный фикс — cinerama.uz расширил блокировку
// датацентрового IP ещё на 3 канала: НТВ, Охота и рыбалка, Звезда):
//   НТВ переведён на thestream.cyou/213 (НТВ-Мир) — проверено вживую, работает.
//   Для "Охота и рыбалка" и "Звезда" альтернативный источник с открытым CORS
//   на сегментах пока НЕ найден, несмотря на проверку 10+ источников (список
//   см. в истории чата) — у большинства нет CORS вовсе, официальный
//   tvzvezda.ru отвечает на плейлист, но сегменты не отдаёт (таймаут).
//   Эти 2 канала временно остаются на cinerama.uz — self-loop-детектор
//   (v82.4) хотя бы не даёт им виснуть молча, а сразу отдаёт ошибку 502.

// ИЗМЕНЕНИЯ v82.5 (реальный фикс вещания Первого канала, России 1, России 24):
//   v82.4 только останавливала бесконечный цикл, но сами каналы оставались
//   недоступны — cinerama.uz продолжает блокировать датацентровый IP именно
//   для этих 3 каналов. Нашёл и проверил вживую (через наш же Worker,
//   с реальными живыми MEDIA-SEQUENCE/PROGRAM-DATE-TIME) альтернативные
//   источники с открытым CORS на сегментах:
//     perviy    → streaming.thestream.cyou (тот же провайдер, что уже
//                 успешно работает у нас для канала 360°)
//     rossiya1  → stream.smotrim.ru/hls2/... (официальный CDN ВГТРК — прямой
//                 доступ к HLS не гео-блокируется, в отличие от их iframe-плеера)
//     rossiya24 → stream.smotrim.ru/hls2/... (аналогично)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

const STREAMS = {
  // ── Новости ─────────────────────────────────────────────────────
  // БЫЛО: rutube.ru (CORS заблокирован)   → СТАЛО: cinerama.uz (CORS открыт)
  // v82.5: БЫЛО cinerama.uz/1214 (источник начал блокировать датацентровый IP
  // для этого канала — см. комментарий у VERSION) → СТАЛО thestream.cyou
  perviy:       'https://streaming.thestream.cyou/live/210-req_offset_28000000-req_window_0-2k_v5.m3u8', // v82.25: БЫЛО -1k_v5 (576p, ~2.1 Мбит/с) — пользователь сообщил, что фризится намертво через ~30 сек. СТАЛО -2k_v5 (360p, ~800 кбит/с) — третий вариант в master-плейлисте источника, ниже битрейт, стабильнее на мобильной сети/Telegram WebView.
  // v82.5: БЫЛО cinerama.uz/1020 (блокировка датацентрового IP) → СТАЛО
  // официальный прямой CDN ВГТРК (smotrim.ru), CORS открыт, гео-блок
  // применяется только к их iframe-плееру, не к самому HLS
  rossiya1:     'https://stream.smotrim.ru/hls2/russia_hd/playlist_2.m3u8', // v82.25: БЫЛО playlist_3 (~2.6 Мбит/с) — пользователь сообщил про фризы. СТАЛО playlist_2 (~0.9 Мбит/с), тот же источник, ниже битрейт.
  // v82.6: БЫЛО cinerama.uz/1023 (источник расширил блокировку датацентрового
  // IP ещё и на этот канал — та же ловушка-петля, что раньше у Первого/России,
  // см. isSelfLoopingMaster) → СТАЛО thestream.cyou/213 (НТВ-Мир — международная
  // версия НТВ, тот же провайдер что уже работает у нас для Первого/360°).
  // Проверено вживую: живой PROGRAM-DATE-TIME, открытый CORS на сегментах.
  ntv:          'https://streaming.thestream.cyou/live/213.m3u8',
  // v82.5: БЫЛО cinerama.uz/1021 (блокировка датацентрового IP) → СТАЛО
  // официальный прямой CDN ВГТРК (smotrim.ru)
  // rossiya24: перенесён в SYNTHETIC_AV (см. ниже) — источник раздельно
  // отдаёт видео и аудио, playlist_2 сам по себе воспроизводился без звука.
  // Пятый — cinerama.uz нет, оставляем skygo.mn
  pyatyy:       'https://cdn4.skygo.mn/live/disk1/Channel_5/HLSv3-FTA/Channel_5.m3u8',
  // v82.20: БЫЛО fs.uplink.kz (CORS/сеть были в порядке, но живая
  // диагностика показала, что MSE-декодер браузера намертво зависал на
  // этих сегментах — readyState не продвигался дальше HAVE_METADATA,
  // playback не восстанавливался ни повторными попытками, ни ротацией
  // прокси; похоже на проблему самой кодировки у источника, а не сети)
  // → СТАЛО официальный CDN ВГТРК/cdnvideo.ru — проверено вживую,
  // стабильное воспроизведение в реальном времени.
  tvc:          'https://tvc-hls.cdnvideo.ru/tvc-res/smil:vd9221.smil/playlist.m3u8',
  // russiyaK: удалён — предупреждение от Google
  // v82.20: БЫЛО fs.uplink.kz (тот же MSE-стопор, что у tvc/mir) → СТАЛО
  // официальный CDN канала (tvzvezda.ru) — проверено вживую, стабильное
  // воспроизведение в реальном времени.
  // v82.28: пользователь сообщил, что первые 2 варианта качества (hdlow
  // 720p/2.4 Мбит, hdhigh 1080p/5.3 Мбит) не воспроизводятся, третий
  // (sdhigh 576p/1.25 Мбит — самый лёгкий) — работает стабильно. БЫЛО:
  // master-плейлист playlist.m3u8 (hls.js сам выбирал вариант через ABR,
  // иногда попадая на тяжёлые) → СТАЛО: указываем сразу на playlist_sdhigh,
  // без ABR-скачков. Проверено вживую.
  zvezda:       'https://tvchannelstream1.tvzvezda.ru/cdn/tvzvezda/playlist_sdhigh.m3u8',
  // v82.20: БЫЛО fs.uplink.kz (тот же MSE-стопор) → СТАЛО казахстанский
  // агрегатор oktv.kz — проверено вживую, стабильное воспроизведение в
  // реальном времени.
  // v82.26: БЫЛО index.m3u8 — это master-плейлист с ОДНИМ вариантом (не
  // настоящее ABR-меню), просто лишний уровень пересылки. Worker поэтому
  // делал двойной проход на каждый запрос (мастер → /playlist?url=... →
  // реальный медиа-плейлист) — пользователь сообщил, что канал заводится
  // только с 3-4 попытки. СТАЛО: указываем сразу на реальный медиа-плейлист
  // (tracks-v1a1/mono.m3u8), один проход вместо двух. Проверено вживую.
  mir:          'https://tvcdn01.oktv.kz/tv/mir/tracks-v1a1/mono.m3u8',
  ch360:        'https://streaming.thestream.cyou/live/7000.m3u8',  // Канал 360° (был facecast.io — timeout)
  // v82.23: НОВЫЙ канал (по запросу пользователя) — официальный CDN ВГТРК,
  // проверено вживую: живой PROGRAM-DATE-TIME, сегменты 200 с открытым CORS.
  moskva24:     'https://stream.smotrim.ru/hls2/moscow_24/playlist_3.m3u8',
  // ── Развлечения ─────────────────────────────────────────────────
  // ТНТ4 — нет на cinerama.uz, оставляем fs.uplink.kz
  tnt:          'https://fs.uplink.kz/tnt4/mono.m3u8?token=onlinetv', // ЗАМЕНА (v82.10): у rutube-CDN (bl.rutube.ru/rtbcdn.ru) сегменты без CORS — плеер зависал ("Обнаружено зависание, переподключение..."). Источника САМОГО ТНТ с открытым CORS не нашли — это ТНТ4 (родственный канал того же холдинга), решение пользователя.
  soloviev:     'https://stream.smotrim.ru/hls/solovievlive/playlist_3.m3u8', // ЗАМЕНА (v82.11): playlist_6 = ~8.4 Мбит/с — фриз на мобильной сети. playlist_3 = ~2 Мбит/с, тот же источник.
  // v82.20: БЫЛО fs.uplink.kz (тот же MSE-стопор, что у tvc/mir/zvezda) →
  // СТАЛО thestream.cyou/44 (тот же провайдер, что уже стабильно работает
  // для Первого/НТВ/360°) — проверено вживую, стабильное воспроизведение.
  domkino:      'https://streaming.thestream.cyou/live/44-req_offset_28000000-req_window_0-1k_v5.m3u8',
  // catcast.tv каналы — нет cinerama.uz замены, оставляем (CORS неизвестен)
  kinokomediya: 'https://cityeden.catcast.tv/content/41331/index.m3u8',
  kinodetektiv: 'https://cityeden.catcast.tv/content/38398/index.m3u8',
  kinoekshn:    'https://cityeden.catcast.tv/content/45268/index.m3u8',
  // ── Детские ─────────────────────────────────────────────────────
  // БЫЛО: interskytech.com → СТАЛО: stream.smotrim.ru (тот же CDN что Soloviev)
  karusel:      'https://stream.smotrim.ru/hls2/karusel/playlist_3.m3u8',
  // ── Спорт ───────────────────────────────────────────────────────
  floHockey:    'https://amg02278-amg02278c2-flosports-worldwide-9916.playouts.now.amagi.tv/playlist.m3u8',
  floRacing:    'https://amg02278-amg02278c1-flosports-worldwide-7592.playouts.now.amagi.tv/playlist.m3u8',
  redbull:      'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
  unbeaten:     'https://unbeaten-tcl.amagi.tv/playlist.m3u8',
  freesports:   'https://mainstreammedia-worldoffreesportsintl-rakuten.amagi.tv/playlist.m3u8',
  // ── cinerama.uz-каналы — см. CINERAMA_PATH ниже ────────────────────
  // v82.25: все каналы на cinerama.uz (была self-loop блокировка, скачущая
  // между зеркалами stream1/stream3/stream8 быстрее, чем мы успевали
  // деплоить фиксы под конкретное зеркало) перенесены из этого объекта в
  // CINERAMA_PATH — Worker теперь сам перебирает зеркала на каждый запрос,
  // см. fetchCinerama(). Список: t24, istoriya, kinohit, retro, kinopremiera,
  // viju, nasheKino, rodnoeKino, kinopokaz, kinosvidanie, indiyskoekino,
  // mult, muztv, muzykaPervogo, rutv, ohotarybalka, zagorodnaya, unikum,
  // vijuSport, m1mma.
};

// v82.25: пути (ID + суффикс) каналов на cinerama.uz. Ключ — тот же channel
// id, что и в CHANNEL_GROUPS/на сайте. fetchCinerama() перебирает зеркала
// CINERAMA_MIRRORS в порядке списка и отдаёт первое, которое не self-loop.
const CINERAMA_MIRRORS = ['stream1', 'stream3', 'stream8'];
const CINERAMA_PATH = {
  t24:           '1037/tracks-v1a1/mono.m3u8',
  istoriya:      '1266/tracks-v1a1/mono.m3u8',
  kinohit:       '1055/tracks-v1a1/mono.m3u8',
  retro:         '1047/tracks-v1a1/mono.m3u8',
  kinopremiera:  '1207/tracks-v1a1/mono.m3u8',
  viju:          '1058/tracks-v1a1/mono.m3u8',
  nasheKino:     '1051/tracks-v1a1/mono.m3u8',
  rodnoeKino:    '1052/tracks-v1a1/mono.m3u8',
  kinopokaz:     '1057/tracks-v1a1/mono.m3u8',
  kinosvidanie:  '1203/tracks-v1a1/mono.m3u8',
  indiyskoekino: '1060/tracks-v1a1/mono.m3u8',
  mult:          '1246/tracks-v1a1/mono.m3u8',
  muztv:         '1200/tracks-v1a1/mono.m3u8',
  muzykaPervogo: '1201/tracks-v1a1/mono.m3u8',
  rutv:          '1202/tracks-v1a1/mono.m3u8',
  ohotarybalka:  '1038/tracks-v1a1/mono.m3u8',
  zagorodnaya:   '1044/tracks-v1a1/mono.m3u8',
  unikum:        '1033/tracks-v1a1/mono.m3u8',
  // v82.27: БЫЛО '1229/mono.m3u8' — для датацентрового IP наших Worker'ов
  // источник отдавал по этому пути "фейковый" master с ОДНИМ вариантом
  // (точно та же болезнь, что была у МИР в v82.26), хотя из обычного
  // браузера тот же URL отдаёт прямой медиа-плейлист. СТАЛО: сразу
  // tracks-v1a1/mono.m3u8 (тот же паттерн, что у всех остальных
  // cinerama.uz-каналов) — убирает лишний проход независимо от того, как
  // источник видит наш IP.
  vijuSport:     '1229/tracks-v1a1/mono.m3u8',
  m1mma:         '1226/mono.m3u8', // проверено — уже отдаёт медиа-плейлист напрямую, без лишнего мастера
};

// v82.29: Россия 24 — источник (stream.smotrim.ru/hls2/russia24nl_smotrim)
// раздельно отдаёт видео (playlist_1..5, разные битрейты, БЕЗ звука) и
// отдельно аудио (playlist_6, только звук, без видео) — не как у остальных
// каналов ВГТРК (russia_hd, karusel, solovievlive, moscow_24 — там звук и
// видео уже смешаны в одном файле). Раньше мы использовали playlist_2
// напрямую → канал играл видео без звука. Проверено вживую (hls.js,
// getVideoPlaybackQuality, webkitAudioDecodedByteCount): playlist_2 — 0
// байт звука, playlist_6 — 0 кадров видео. Собираем свой master-плейлист
// по стандарту HLS (EXT-X-MEDIA TYPE=AUDIO + AUDIO="group" в STREAM-INF),
// который явно связывает видео-дорожку playlist_2 со звуковой playlist_6 —
// проверено вживую, реальное декодирование и видео (305 кадров/0 потерь),
// и звука (250КБ декодировано) одновременно.
// v82.31: v82.29 (EXT-X-MEDIA alternate-audio) и v82.30 (+CODECS) починили
// звук в hls.js (Android/десктоп/сайт), но НЕ на iPhone — там мини-апп идёт
// не через hls.js, а через нативный AVPlayer (video.src напрямую), а
// связывание отдельных TS-рендишенов видео и аудио через alternate-audio
// group — известное слабое место именно AVPlayer с MPEG-TS сегментами
// (в отличие от hls.js, который сам демультиплексирует TS и всегда честно
// собирает оба SourceBuffer). Проверил вживую: PROGRAM-DATE-TIME/MEDIA-
// SEQUENCE у playlist_2 (видео) и playlist_6 (аудио) идеально совпадают
// сегмент-в-сегмент — дело не в рассинхроне.
// РЕАЛЬНОЕ РЕШЕНИЕ: вместо alternate-audio group Worker теперь сам
// мультиплексирует видео- и аудио-сегменты в ОДИН обычный TS-сегмент (как
// в настоящем эфирном вещании — один PAT/PMT на оба потока), см.
// muxTsSegments()/handleMuxSegment() ниже. Результат — самый обычный
// однодорожечный HLS-поток, без какой-либо специфики alternate-audio,
// поэтому работает одинаково в hls.js И в нативном AVPlayer. Проверено
// вживую (hls.js, webkitAudioDecodedByteCount/videoDecodedByteCount):
// и видео, и звук декодируются без ошибок из смультиплексированного
// сегмента.
const MUXED_AV = {
  rossiya24: {
    video: 'https://stream.smotrim.ru/hls2/russia24nl_smotrim/playlist_2.m3u8',
    audio: 'https://stream.smotrim.ru/hls2/russia24nl_smotrim/playlist_6.m3u8',
  },
};

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // /mux-segment?v=ENCODED&a=ENCODED — сшивает видео- и аудио-TS-сегмент
    // в один (см. MUXED_AV/v82.31 выше). Единственное место, где Worker
    // реально проксирует байты сегмента — необходимо, т.к. смешать два
    // раздельных TS-потока можно только вживую, серверная перепаковка PAT/
    // PMT на клиенте невозможна.
    if (path === '/mux-segment') {
      const vUrl = url.searchParams.get('v');
      const aUrl = url.searchParams.get('a');
      if (!vUrl || !aUrl) return new Response('Missing v/a', { status: 400, headers: CORS });
      return handleMuxSegment(vUrl, aUrl);
    }

    // /stream?channel=NAME — возвращает m3u8 с прямыми URL сегментов
    if (path === '/stream') {
      const channel = url.searchParams.get('channel');
      // v82.31: каналы с раздельными видео/аудио источниками — мультиплексируем
      // сегменты попарно на лету (см. MUXED_AV выше)
      if (MUXED_AV[channel]) {
        return buildMuxedAVPlaylist(MUXED_AV[channel], url.origin);
      }
      // v82.25: cinerama.uz-каналы — перебор зеркал на каждый запрос
      if (CINERAMA_PATH[channel]) {
        return fetchCinerama(CINERAMA_PATH[channel], url.origin);
      }
      const streamUrl = STREAMS[channel];
      if (!streamUrl) {
        return new Response(JSON.stringify({ error: 'Channel not found', channel }), {
          status: 404,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
      return fetchPlaylistOnly(streamUrl, url.origin);
    }

    // /playlist?url=ENCODED — прокси только для .m3u8 суб-плейлистов (НЕ сегментов)
    if (path === '/playlist') {
      const target = url.searchParams.get('url');
      if (!target) return new Response('Missing url', { status: 400, headers: CORS });
      // Отказываем если URL выглядит как сегмент
      if (isSegment(target)) {
        return new Response('Segment proxying disabled (CF ToS)', { status: 403, headers: CORS });
      }
      return fetchPlaylistOnly(target, url.origin);
    }

    // /proxy — ОТКЛЮЧЁН (был причиной нарушения ToS)
    if (path === '/proxy') {
      return new Response('Proxy disabled — CF ToS compliance. Segments served directly.', {
        status: 410,
        headers: { ...CORS, 'Content-Type': 'text/plain' },
      });
    }

    if (path === '/version') {
      return new Response(JSON.stringify({ version: VERSION, channels: Object.keys(STREAMS).length + Object.keys(CINERAMA_PATH).length + Object.keys(MUXED_AV).length, mode: 'cors-only' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(`Russia TV Worker v${VERSION} — CORS-only mode`, { headers: CORS });
  }
};

function isSegment(url) {
  return /\.(ts|aac|mp4|m4s|fmp4)([?#]|$)/i.test(url);
}

function resolveUrl(base, relative) {
  if (!relative) return base;
  if (relative.startsWith('http://') || relative.startsWith('https://')) return relative;
  try {
    let result = new URL(relative, base).href;
    result = result.replace(/\/([^\/]*[a-zA-Z][^\/]*)\/\1\//, '/$1/');
    return result;
  } catch {
    return relative;
  }
}

function baseDir(url) {
  return url.substring(0, url.lastIndexOf('/') + 1);
}

// См. комментарий у места вызова (fetchPlaylistOnly) — детектим "фейковый"
// master-плейлист, который источник иногда отдаёт вместо реального медиа-
// плейлиста: единственный #EXT-X-STREAM-INF, чей вариант резолвится в тот
// же самый URL, который мы только что запросили (self-loop).
function isSelfLoopingMaster(content, sourceUrl) {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const streamInfIdx = lines.findIndex(l => l.startsWith('#EXT-X-STREAM-INF'));
  if (streamInfIdx === -1) return false;
  const variantLine = lines[streamInfIdx + 1];
  if (!variantLine || variantLine.startsWith('#')) return false;
  const base = baseDir(sourceUrl);
  const resolvedVariant = resolveUrl(base, variantLine);
  // Сравниваем без учёта query-параметров (наш собственный /playlist?url=... тоже считается self-loop)
  const norm = u => u.split('?')[0].replace(/^https?:\/\//, '');
  if (norm(resolvedVariant) !== norm(sourceUrl)) return false;
  // Это единственная содержательная строка после STREAM-INF (не полноценный
  // master с несколькими реальными битрейтами) — типичный признак "ловушки"
  return lines.filter(l => !l.startsWith('#')).length === 1;
}

// Переписать m3u8: суб-плейлисты → через /playlist?url=, сегменты → прямые URL
function rewritePlaylist(content, sourceUrl, workerOrigin) {
  const base = baseDir(sourceUrl);
  const lines = content.split('\n');
  const out = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.startsWith('#EXT-X-MEDIA') && line.includes('TYPE=SUBTITLES')) continue;

    if (line === '' || line.startsWith('#')) {
      // URI= внутри тегов (ключи AES) — через /playlist (они небольшие, не видео)
      let fixed = line.replace(/URI="([^"]+)"/g, (_, uri) => {
        const abs = resolveUrl(base, uri);
        if (isSegment(abs)) return `URI="${abs}"`; // ключи не сегменты, но страхуемся
        return `URI="${workerOrigin}/playlist?url=${encodeURIComponent(abs)}"`;
      });
      if (fixed.startsWith('#EXT-X-STREAM-INF')) {
        fixed = fixed.replace(/,?SUBTITLES="[^"]*"/, '');
      }
      out.push(fixed);
    } else {
      const abs = resolveUrl(base, line);
      if (isSegment(abs)) {
        // Сегмент — прямой URL, браузер тянет сам (обходим CF)
        out.push(abs);
      } else {
        // Суб-плейлист — через /playlist (только текст, ~2KB)
        out.push(`${workerOrigin}/playlist?url=${encodeURIComponent(abs)}`);
      }
    }
  }
  return out.join('\n');
}

async function fetchPlaylistOnly(streamUrl, workerOrigin) {
  let res;
  try {
    const referer = streamUrl.includes('cinerama.uz')
      ? 'https://russian-tv.com/'
      : new URL(streamUrl).origin + '/';
    res = await fetch(streamUrl, {
      headers: { 'User-Agent': UA, 'Referer': referer },
      // v82.13: было cacheTtl:3, cacheEverything:true — кеширование плейлиста
      // на Cloudflare edge. Поймали в реальных логах (Web Inspector, iPhone
      // Safari) серию 404 на .ts-сегментах у нескольких разных каналов
      // подряд: у части источников (fs.uplink.kz) в плейлисте всего ~4
      // сегмента в живом окне (~24 сек при TARGETDURATION=6) — при кеше
      // плейлиста на несколько секунд клиент получает устаревший список, и
      // к моменту скачивания сегмента тот уже выкатился из живого окна
      // источника. Плейлист крошечный (~1-2 КБ), кешировать его ради
      // нагрузки смысла нет — свежесть важнее.
      cf: { cacheTtl: 0, cacheEverything: false },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  if (!res.ok) {
    return new Response(`Source returned ${res.status}`, { status: res.status, headers: CORS });
  }

  const body = await res.text();

  // ЛОВУШКА-ЗАЦИКЛИВАНИЕ (v82.4): см. подробный комментарий у fetchCinerama()
  // — тот же self-loop детект, для не-cinerama источников (сохранено для
  // источников вне CINERAMA_PATH, которые в теории тоже могут так себя вести).
  if (isSelfLoopingMaster(body, streamUrl)) {
    return new Response(
      JSON.stringify({ error: 'Source returned a self-referencing master playlist (likely datacenter-IP block)', streamUrl }),
      { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }

  return buildPlaylistResponse(body, streamUrl, workerOrigin);
}

// v82.25: общий "последний шаг" для fetchPlaylistOnly и fetchCinerama —
// переписывает плейлист (сегменты → прямые URL, суб-плейлисты → через
// /playlist) и оборачивает в Response с нужными заголовками.
function buildPlaylistResponse(body, streamUrl, workerOrigin) {
  // ВАЖНО: workerOrigin берётся из фактического origin запроса (request.url),
  // а не хардкодится — иначе суб-плейлисты (master m3u8 с вариантами, как у
  // Кинопремьеры) переписываются на потенциально неработающий домен, даже
  // если сам запрос пришёл через рабочий custom domain (stream.russian-tv.com).
  const rewritten = rewritePlaylist(body, streamUrl, workerOrigin);
  return new Response(rewritten, {
    headers: {
      ...CORS,
      'Content-Type': 'application/vnd.apple.mpegurl',
      // v82.13: было s-maxage=5 — вниз по цепочке (общие/edge-кеши) могли
      // держать плейлист до 5 сек, тот же риск устаревших сегментов, что и
      // с cf.cacheTtl выше. no-store — каждый клиент получает честно свежий
      // плейлист.
      'Cache-Control': 'no-store',
    },
  });
}

// v82.31: строит ОБЫЧНЫЙ (однодорожечный) media-плейлист для каналов с
// раздельными видео/аудио источниками — берёт EXTINF/PROGRAM-DATE-TIME из
// видео-плейлиста, но каждый сегмент указывает на /mux-segment?v=..&a=..,
// который на лету сшивает видео- и аудио-TS-сегмент в один (см. ниже).
// Видео- и аудио-плейлисты у источника идеально синхронны по MEDIA-SEQUENCE
// (проверено вживую) — сопоставляем сегменты просто по порядковому номеру.
async function buildMuxedAVPlaylist(cfg, workerOrigin) {
  let vRes, aRes;
  try {
    [vRes, aRes] = await Promise.all([
      fetch(cfg.video, { headers: { 'User-Agent': UA, 'Referer': new URL(cfg.video).origin + '/' } }),
      fetch(cfg.audio, { headers: { 'User-Agent': UA, 'Referer': new URL(cfg.audio).origin + '/' } }),
    ]);
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
  if (!vRes.ok || !aRes.ok) {
    return new Response(`Source error: video=${vRes.status} audio=${aRes.status}`, { status: 502, headers: CORS });
  }
  const [vBody, aBody] = await Promise.all([vRes.text(), aRes.text()]);

  function segUrls(body, sourceUrl) {
    const base = baseDir(sourceUrl);
    return body.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(l => resolveUrl(base, l));
  }
  const vSegs = segUrls(vBody, cfg.video);
  const aSegs = segUrls(aBody, cfg.audio);
  const n = Math.min(vSegs.length, aSegs.length);

  // Заголовок и EXTINF/PDT-строки берём из видео-плейлиста как есть, только
  // URI сегментов заменяем на /mux-segment
  const vLines = vBody.split('\n');
  const out = [];
  let segIdx = 0;
  for (const rawLine of vLines) {
    const line = rawLine.trimEnd();
    if (line === '' || line.startsWith('#')) {
      out.push(line);
    } else {
      if (segIdx < n) {
        const muxUrl = `${workerOrigin}/mux-segment?v=${encodeURIComponent(vSegs[segIdx])}&a=${encodeURIComponent(aSegs[segIdx])}`;
        out.push(muxUrl);
      }
      segIdx++;
    }
  }
  return new Response(out.join('\n'), {
    headers: { ...CORS, 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-store' },
  });
}

// v82.31: скачивает видео- и аудио-TS-сегмент и мультиплексирует их в один
// обычный TS-сегмент (единый PAT/PMT на оба элементарных потока) — см.
// подробный комментарий у MUXED_AV выше про то, почему это нужно вместо
// alternate-audio group (AVPlayer на iOS ненадёжно связывает раздельные TS-
// рендишены). MPEG-TS псевдокод: оба входных .ts — независимые однопотоковые
// транспортные потоки каждый со своим PAT/PMT. Патчим ВСЕ повторы PMT
// видео-потока, добавляя туда ES-запись аудио (пересчитывая CRC32 секции),
// а из аудио-потока вырезаем его собственные PAT/PMT-пакеты и перепрописываем
// PID его элементарного потока на свободный (не занятый видео) — затем
// просто конкатенируем оба потока байт в байт. Проверено вживую (hls.js,
// webkitAudioDecodedByteCount/videoDecodedByteCount на результате): оба
// потока декодируются без единой ошибки.
async function handleMuxSegment(vUrl, aUrl) {
  let vRes, aRes;
  try {
    [vRes, aRes] = await Promise.all([
      fetch(vUrl, { headers: { 'User-Agent': UA, 'Referer': new URL(vUrl).origin + '/' } }),
      fetch(aUrl, { headers: { 'User-Agent': UA, 'Referer': new URL(aUrl).origin + '/' } }),
    ]);
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
  if (!vRes.ok || !aRes.ok) {
    return new Response(`Segment fetch error: video=${vRes.status} audio=${aRes.status}`, { status: 502, headers: CORS });
  }
  const [vBuf, aBuf] = await Promise.all([vRes.arrayBuffer(), aRes.arrayBuffer()]);
  let combined;
  try {
    combined = muxTsSegments(new Uint8Array(vBuf), new Uint8Array(aBuf));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'mux failed: ' + e.message }), { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
  return new Response(combined, {
    headers: { ...CORS, 'Content-Type': 'video/mp2t', 'Cache-Control': 'no-store' },
  });
}

// ── MPEG-TS мультиплексор (v82.31) ──────────────────────────────────────
function crc32mpeg2(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= (bytes[i] << 24);
    for (let b = 0; b < 8; b++) {
      if (crc & 0x80000000) crc = ((crc << 1) ^ 0x04C11DB7) >>> 0;
      else crc = (crc << 1) >>> 0;
    }
  }
  return crc >>> 0;
}
function findPacketsByPid(bytes, pid) {
  const out = [];
  for (let i = 0; i + 188 <= bytes.length; i += 188) {
    if (bytes[i] !== 0x47) continue;
    const p = ((bytes[i + 1] & 0x1F) << 8) | bytes[i + 2];
    if (p === pid) out.push(i);
  }
  return out;
}
function parsePAT(bytes) {
  const idxs = findPacketsByPid(bytes, 0);
  if (!idxs.length) throw new Error('no PAT found');
  const off = idxs[0];
  const pusi = (bytes[off + 1] & 0x40) !== 0;
  let p = off + 4;
  if (pusi) p += 1 + bytes[off + 4];
  const sectionLength = ((bytes[p + 1] & 0x0F) << 8) | bytes[p + 2];
  const sectionEnd = p + 3 + sectionLength;
  let q = p + 8;
  const programs = [];
  while (q < sectionEnd - 4) {
    const programNumber = (bytes[q] << 8) | bytes[q + 1];
    const pid = ((bytes[q + 2] & 0x1F) << 8) | bytes[q + 3];
    programs.push({ programNumber, pid });
    q += 4;
  }
  return { programs };
}
function parsePMTAt(bytes, off) {
  const pusi = (bytes[off + 1] & 0x40) !== 0;
  let p = off + 4;
  if (pusi) p += 1 + bytes[off + 4];
  const sectionLength = ((bytes[p + 1] & 0x0F) << 8) | bytes[p + 2];
  const pcrPid = ((bytes[p + 8] & 0x1F) << 8) | bytes[p + 9];
  const programInfoLength = ((bytes[p + 10] & 0x0F) << 8) | bytes[p + 11];
  let q = p + 12 + programInfoLength;
  const sectionEnd = p + 3 + sectionLength;
  const streams = [];
  while (q < sectionEnd - 4) {
    const streamType = bytes[q];
    const elementaryPid = ((bytes[q + 1] & 0x1F) << 8) | bytes[q + 2];
    const esInfoLength = ((bytes[q + 3] & 0x0F) << 8) | bytes[q + 4];
    streams.push({ streamType, elementaryPid, esInfoLength });
    q += 5 + esInfoLength;
  }
  return { packetOffset: off, sectionStart: p, pusi, pcrPid, programInfoLength, streams, sectionLength };
}
function collectUsedPids(bytes) {
  const set = new Set();
  for (let i = 0; i + 188 <= bytes.length; i += 188) {
    if (bytes[i] !== 0x47) continue;
    set.add(((bytes[i + 1] & 0x1F) << 8) | bytes[i + 2]);
  }
  return set;
}
function buildPatchedPmtPacket(bytes, pmt, newAudioPid, audioStreamType) {
  const off = pmt.packetOffset;
  const sectionStart = pmt.sectionStart;
  const headerLen = 12 + pmt.programInfoLength;
  const head = bytes.slice(sectionStart, sectionStart + headerLen);
  const streamsEnd = sectionStart + 3 + pmt.sectionLength - 4;
  const existingStreams = bytes.slice(sectionStart + headerLen, streamsEnd);
  const newEntry = new Uint8Array(5);
  newEntry[0] = audioStreamType;
  newEntry[1] = 0xE0 | ((newAudioPid >> 8) & 0x1F);
  newEntry[2] = newAudioPid & 0xFF;
  newEntry[3] = 0xF0;
  newEntry[4] = 0x00;
  const newSectionLength = (headerLen - 3) + existingStreams.length + newEntry.length + 4;
  const newHead = new Uint8Array(head);
  newHead[1] = (newHead[1] & 0xF0) | ((newSectionLength >> 8) & 0x0F);
  newHead[2] = newSectionLength & 0xFF;
  const sectionNoCrc = new Uint8Array(newHead.length + existingStreams.length + newEntry.length);
  sectionNoCrc.set(newHead, 0);
  sectionNoCrc.set(existingStreams, newHead.length);
  sectionNoCrc.set(newEntry, newHead.length + existingStreams.length);
  const crc = crc32mpeg2(sectionNoCrc);
  const fullSection = new Uint8Array(sectionNoCrc.length + 4);
  fullSection.set(sectionNoCrc, 0);
  fullSection[sectionNoCrc.length] = (crc >>> 24) & 0xFF;
  fullSection[sectionNoCrc.length + 1] = (crc >>> 16) & 0xFF;
  fullSection[sectionNoCrc.length + 2] = (crc >>> 8) & 0xFF;
  fullSection[sectionNoCrc.length + 3] = crc & 0xFF;
  const pkt = new Uint8Array(188);
  pkt.set(bytes.slice(off, off + 4), 0);
  let p = 4;
  if (pmt.pusi) { pkt[4] = 0; p = 5; }
  pkt.set(fullSection, p);
  for (let i = p + fullSection.length; i < 188; i++) pkt[i] = 0xFF;
  if (p + fullSection.length > 188) throw new Error('PMT section too large: ' + (p + fullSection.length));
  return pkt;
}
function remapAudioStream(bytes, pmtPidA, audioElemPidA, newAudioPid) {
  const out = [];
  for (let i = 0; i + 188 <= bytes.length; i += 188) {
    if (bytes[i] !== 0x47) continue;
    const pid = ((bytes[i + 1] & 0x1F) << 8) | bytes[i + 2];
    if (pid === 0 || pid === pmtPidA) continue; // выкидываем собственные PAT/PMT аудио-потока
    const pkt = bytes.slice(i, i + 188);
    if (pid === audioElemPidA) {
      pkt[1] = (pkt[1] & 0xE0) | ((newAudioPid >> 8) & 0x1F);
      pkt[2] = newAudioPid & 0xFF;
    }
    out.push(pkt);
  }
  const total = out.reduce((s, p) => s + p.length, 0);
  const combined = new Uint8Array(total);
  let off = 0;
  for (const p of out) { combined.set(p, off); off += p.length; }
  return combined;
}
function muxTsSegments(video, audio) {
  const patV = parsePAT(video);
  const progV = patV.programs.find(p => p.programNumber !== 0);
  if (!progV) throw new Error('no program in video PAT');
  const pmtPidV = progV.pid;
  const pmtOffsetsV = findPacketsByPid(video, pmtPidV);
  if (!pmtOffsetsV.length) throw new Error('no PMT in video');

  const patA = parsePAT(audio);
  const progA = patA.programs.find(p => p.programNumber !== 0);
  if (!progA) throw new Error('no program in audio PAT');
  const pmtPidA = progA.pid;
  const pmtOffsetsA = findPacketsByPid(audio, pmtPidA);
  if (!pmtOffsetsA.length) throw new Error('no PMT in audio');
  const pmtA0 = parsePMTAt(audio, pmtOffsetsA[0]);
  if (!pmtA0.streams.length) throw new Error('no elementary stream in audio PMT');
  const audioElemPidA = pmtA0.streams[0].elementaryPid;
  const audioStreamType = pmtA0.streams[0].streamType;

  const usedByVideo = collectUsedPids(video);
  let newAudioPid = 0x0140;
  while (usedByVideo.has(newAudioPid)) newAudioPid++;

  const patchedVideo = new Uint8Array(video);
  for (const off of pmtOffsetsV) {
    const pmt = parsePMTAt(video, off);
    const patchedPkt = buildPatchedPmtPacket(video, pmt, newAudioPid, audioStreamType);
    patchedVideo.set(patchedPkt, off);
  }

  const remappedAudio = remapAudioStream(audio, pmtPidA, audioElemPidA, newAudioPid);

  const combined = new Uint8Array(patchedVideo.length + remappedAudio.length);
  combined.set(patchedVideo, 0);
  combined.set(remappedAudio, patchedVideo.length);
  return combined;
}

// v82.25: cinerama.uz — self-loop блокировка датацентрового IP Cloudflare
// Workers привязана к конкретной паре host+ID (не ко всему домену), и она
// динамически скачет между зеркалами (stream1/stream3/stream8) — один и тот
// же канал может быть заблокирован на stream8, но свободен на stream1, а
// через несколько минут наоборот. Раньше мы вручную прописывали конкретное
// зеркало под конкретный канал (v82.22-82.24) — блокировка успевала
// переехать быстрее, чем мы успевали задеплоить фикс. Теперь Worker сам
// перебирает зеркала на каждый запрос и отдаёт первое, которое возвращает
// настоящий медиа-плейлист (не self-loop "ловушку", см. isSelfLoopingMaster).
async function fetchCinerama(path, workerOrigin) {
  let lastError = null;
  for (const host of CINERAMA_MIRRORS) {
    const streamUrl = `https://${host}.cinerama.uz/${path}`;
    let res;
    try {
      res = await fetch(streamUrl, {
        headers: { 'User-Agent': UA, 'Referer': 'https://russian-tv.com/' },
        cf: { cacheTtl: 0, cacheEverything: false },
      });
    } catch (e) {
      lastError = { mirror: host, error: e.message };
      continue;
    }
    if (!res.ok) {
      lastError = { mirror: host, status: res.status };
      continue;
    }
    const body = await res.text();
    if (isSelfLoopingMaster(body, streamUrl)) {
      lastError = { mirror: host, error: 'self-referencing master (datacenter-IP block)' };
      continue;
    }
    return buildPlaylistResponse(body, streamUrl, workerOrigin);
  }
  // Все зеркала заблокированы/недоступны одновременно — редкий случай, но
  // возможен. Отдаём понятную ошибку вместо тихого зависания.
  return new Response(
    JSON.stringify({ error: 'All cinerama.uz mirrors blocked or unavailable', path, lastError }),
    { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } }
  );
}
