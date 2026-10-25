# Russia TV Hub — Эталон v1.3 (25 октября 2026)

Список того, что в мини-аппе работает и **не должно ломаться** при правках.

## Что работает
- Экран «хаб» (группы каналов по темам) + экран плеера
- Fullscreen: Android `container.requestFullscreen()`, iOS `video.webkitEnterFullscreen()`
- После выхода из fullscreen на iOS: `stopStream()` + `init()`
- Фоновый звук Android: `audio-bg` (muted=true, играет для сессии)
- Фоновый звук iOS: Media Session API
- Auto-fullscreen при запуске: `tg.requestFullscreen()` только на мобильных
- Safe area: `--tg-safe-top` через `Telegram.WebApp.safeAreaInsets`
- Unmute toggle: флаг `userUnmuted`, `enforceMute` синхронно в событии `play`
- PiP: только ПК (`requestPictureInPicture`), скрыт на iOS/Android
- Кнопка «Каналы»: `Telegram.WebApp.close()`
- **Выбор качества** (⚙ в панели кнопок): `initQuality(hls)` для hls.js и `initQualityNative(streamUrl)` для iOS (нативный HLS, фиксированный уровень через воркер `/stream-q`); кнопка скрыта, если у канала один уровень; выбор хранится в `localStorage` (`rtv_quality`)
- `isIOS()` включает `Telegram.WebApp.platform === "ios"`
- **Звук после автопереподключения:** если пользователь включил звук, `_soundWanted` возвращает его после реконнекта (`_restoreSound()`); смена канала сбрасывает. Если браузер не даёт включить звук без жеста — через 1,5 с возврат в режим без звука и кнопка «Включить звук»
- **НТВ на iPhone/iPad:** встроенный плеер Apple и официальный источник `cdn.ntv.ru` (воркер `/stream?channel=ntv&native=1`), hls.js для НТВ на iOS не используется
- **Кнопка «Смотреть на сайте»:** есть у всех каналов, кроме «Россия К» (её нет на сайте)
- **AirPlay (iOS):** кнопка «📲 AirPlay» видна на iPhone/iPad у каналов с обычным видео (не у каналов с iframe OK.ru). Если WebView отдаёт AirPlay API: первое нажатие на канале через hls.js переключает его на нативный плеер (`_forceNative`), второе открывает системный выбор устройства (`webkitShowPlaybackTargetPicker`). Если API нет — кнопка открывает страницу канала на сайте во внешнем браузере (там есть AirPlay). Cast из WebView Telegram технически невозможен
- **Прямые ссылки на канал:** `t.me/RussiaTVHub_bot/russiatv?startapp=<id канала>` (например `ntv`) открывает мини-апп сразу на этом канале; параметр читается из `tg.initDataUnsafe.start_param` в конце скрипта (для кнопок «Смотреть НТВ» в постах)
- Каналы сгруппированы по темам: Новости и общие, Развлечения, Кино, Детские, Музыка, Хобби и стиль, Спорт

## Критичные правила
- `video` вне overlay (не гаснет при автоскрытии интерфейса)
- НЕ вызывать `Telegram.WebApp.requestFullscreen()` И `container.requestFullscreen()` одновременно
- `userUnmuted = false` сбрасывается в начале `loadStream`
- `video.muted = true` перед `play()` в `MANIFEST_PARSED`
- Настройки hls.js в мини-аппе: `startLevel: 0`, `capLevelToPlayerSize: true` (в «Авто» уровень не выше размера плеера), `abrEwmaDefaultEstimate: 500000` — защита от частых переключений уровней и фризов; ручной выбор качества эти ограничения обходит
- Вызов `initQuality(hls)` — сразу после `hls.attachMedia(video)`; для нативной ветки `initQualityNative(streamUrl)` — сразу после `video.src = streamUrl`
- **hls.js закреплён: `1.5.15`** (`cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js`) — та же версия, что на сайте; `@latest` не использовать
- **Повторные подключения:** только через `_scheduleInit(baseMs)` — пауза растёт ×2 до 30 с, после `MAX_FAIL_STREAK` (6) неудач подряд показывается «Канал временно недоступен» с кнопкой «Повторить»; счётчик сбрасывается событием `playing`, кнопкой и открытием канала (`_resetRetry()`). Прямых `setTimeout(() => init(), …)` в коде быть не должно
- **Профилактический перезапуск** (`PREEMPTIVE_REFRESH_MS`, 6 мин) — только для каналов из `PREEMPTIVE_IDS` (источник `cinerama.uz`); при добавлении такого канала внесите его id в этот список
- **Android, фоновый звук:** `audio-bg` играет тихую зацикленную дорожку (`SILENT_WAV`), второй hls.js на тот же поток не поднимается
- Авторефреш плейлиста каждые 20 минут (`tokenRefreshTimer`) удалён — воркер всегда отдаёт m3u8, лишний запрос не нужен

## Структура канала
```js
{ id, name, desc, icon, color, iconBg, logo?, slug?, stream }
// stream: PROXY + '/stream?channel=' + id
```
`logo` — необязательная картинка, `slug` — страница канала на сайте (кнопка «Смотреть на сайте»). Подробности: `CHANNEL_TEMPLATE.md`.

## Воркеры (Cloudflare, аккаунт dyaltd)
- `russia-worker` (он же `https://stream.russian-tv.com`), `birch-creek`, `oak-valley`
- Маршруты: `/stream?channel=ID`, `/stream-q?channel=ID&q=КБИТ/С`, `/playlist?url=…`, `/version`
- Сегменты воркеры не проксируют (CORS-only режим): их берёт сам плеер напрямую у источника
- `GET /stream?channel=ntv&native=1` отдаёт официальный поток НТВ (`cdn.ntv.ru`) для встроенного плеера Apple; параметр `native=1` передаёт и `/stream-q`
- Копия кода воркера: `russia-worker.js` (версия 82.36.0; боевой код лежит в Cloudflare, копию синхронизируют вручную; после деплоя воркеров обновляйте её)

## Исторические заметки (до перехода на Cloudflare Workers)
- Прежние прокси на Vercel (`rossiya1-proxy`, `russia-tv-proxy`) в коде мини-аппа и воркеров больше не упоминаются; правила про `.ts` для iOS/Android относились к ним.

## Запуск бота
```bash
cd ~/russia-tv-hub && ALL_PROXY=socks5://[::1]:1080 node bot.js
```
