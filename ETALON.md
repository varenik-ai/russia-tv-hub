# Russia TV Hub — Эталон v1.1 (9 октября 2026)

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
- Каналы сгруппированы по темам: Новости и общие, Развлечения, Кино, Детские, Музыка, Хобби и стиль, Спорт

## Критичные правила
- `video` вне overlay (не гаснет при автоскрытии интерфейса)
- НЕ вызывать `Telegram.WebApp.requestFullscreen()` И `container.requestFullscreen()` одновременно
- `userUnmuted = false` сбрасывается в начале `loadStream`
- `video.muted = true` перед `play()` в `MANIFEST_PARSED`
- Настройки hls.js в мини-аппе: `startLevel: 0`, `capLevelToPlayerSize: true` (в «Авто» уровень не выше размера плеера), `abrEwmaDefaultEstimate: 500000` — защита от частых переключений уровней и фризов; ручной выбор качества эти ограничения обходит
- Вызов `initQuality(hls)` — сразу после `hls.attachMedia(video)`; для нативной ветки `initQualityNative(streamUrl)` — сразу после `video.src = streamUrl`

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
- Копия кода воркера: `russia-worker.js` (боевой код лежит в Cloudflare; копию синхронизируют вручную)

## Исторические заметки (до перехода на Cloudflare Workers)
- Прежние прокси на Vercel (`rossiya1-proxy`, `russia-tv-proxy`) в коде мини-аппа и воркеров больше не упоминаются; правила про `.ts` для iOS/Android относились к ним.

## Запуск бота
```bash
cd ~/russia-tv-hub && ALL_PROXY=socks5://[::1]:1080 node bot.js
```
