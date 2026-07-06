# Шаблон добавления нового канала

Пример — **Россия 1**. Всё описано в привязке к реальному коду `index.html`.

---

## 1. Запись в массиве CHANNELS

```js
// index.html → const CHANNELS = [ ... ]
{
  id:      "rossiya1",          // уникальный идентификатор (латиница, без пробелов)
  name:    "Россия 1",          // отображается в карточке хаба и заголовке плеера
  desc:    "Прямой эфир",       // подпись под названием в карточке
  icon:    "Р",                 // буква-фолбэк, если нет logo-файла
  iconBg:  "#003893",           // цвет фона иконки (hex)
  logo:    "rossiya1.jpg",      // (опционально) файл в корне репо; если не нужен — удали поле
  stream:  "https://WORKER_URL/stream",   // GET → JSON { url: "https://..." }
  proxy:   "https://WORKER_URL/proxy?url=",  // GET → проксирует HLS-сегменты
}
```

### Поле `logo` vs `icon`
- Если `logo` указан → `<img src="rossiya1.jpg">` 52×52px, `object-fit:cover`
- Если `logo` не указан → рендерится текст `icon` на фоне `iconBg`
- Файл лого кладётся в корень репо рядом с `index.html`

---

## 2. Как канал появляется в хабе

Функция `buildHub()` автоматически обходит массив `CHANNELS` и создаёт карточки:

```
┌─────────────────────────────────────┐
│  [LOGO/ICON]  Название канала   🔴  │
│               desc-подпись          │
└─────────────────────────────────────┘
```

- Красная мигающая точка (`.live-dot`) — декоративная, всегда видна
- По клику на карточку вызывается `openChannel(ch)`:
  - скрывает `#hub-screen`
  - показывает `#player-screen`
  - вставляет `ch.name` в заголовок `#ch-title`
  - сбрасывает аудио-режим, запускает `init()`

> **Ничего дополнительно регистрировать не нужно** — достаточно добавить объект в `CHANNELS`.

---

## 3. Worker: что должен возвращать `/stream`

`init()` делает `fetch(ch.stream + "?t=" + Date.now())` и ожидает:

```json
{ "url": "https://cdn.example.com/live/index.m3u8" }
```

- Ответ должен быть `Content-Type: application/json`
- `?t=` — cache-buster, Worker должен его игнорировать или пробрасывать
- Если `url` отсутствует → статус «Не удалось получить URL» + кнопка «Переподключиться»
- Если fetch упал с ошибкой → «Ошибка сервера»

### `/proxy?url=...`

`loadStream()` оборачивает каждый HLS URL через прокси:

```
ch.proxy + encodeURIComponent(url)
// → https://WORKER_URL/proxy?url=https%3A%2F%2Fcdn.example.com%2F...
```

Worker должен:
1. Декодировать `url` из query-параметра
2. Проксировать запрос с нужными заголовками (Origin, Referer, если нужны)
3. Вернуть ответ с `Access-Control-Allow-Origin: *`

Пример Worker (`src/index.js`) — смотри `~/rossiya1-worker/src/index.js`.

---

## 4. Кнопки плеера

Все кнопки находятся в `.controls` внутри `.overlay`. Overlay автоскрывается через 4 сек в fullscreen-режиме. Тап по видео показывает overlay снова.

| Кнопка | ID | Когда видна | Поведение |
|--------|----|-------------|-----------|
| 🔄 Переподключиться | `#reload-btn` | Только при ошибке | Сбрасывает паузу, вызывает `init()` |
| 🔊 Включить звук | `#unmute-btn` | После старта потока (не в аудио-режиме) | Переключает `video.muted`; при unmute отключает `audio-bg` |
| 🎧 Только звук | `#mode-btn` | Всегда | Скрывает видео, оставляет звук; overlay не скрывается |
| 🔳 Полный экран | `#fullscreen-btn` | Всегда | Разная логика для iOS и Android (см. раздел 5) |
| 🎥 PiP | `#pip-btn` | Только PC (скрыт на iOS/Android) | `requestPictureInPicture` |

**Тексты кнопок** берутся из объекта `T[lang]`. При добавлении новых строк — добавить ключ во все 8 языков (`ru, bg, en, de, fr, es, uk, tr`).

---

## 5. Fullscreen — нюансы

### Android

```
container.requestFullscreen()
  → успех: нативный fullscreen браузера, шапка Telegram исчезает
  → ошибка: fallback на CSS-класс .css-fs (position:fixed, inset:0, z-index:9999)
```

- `isExpanded = true`, кнопка меняется на «✕ Выйти»
- Overlay автоскрывается через 3 сек (`fullscreenchange` → `hideTimeout`)
- При выходе: `isExpanded = false`, overlay показывается, мут восстанавливается если `!userUnmuted`

**Важно**: `video` элемент должен быть **вне** `.overlay` (сейчас он — прямой потомок `#video-container`). Если поместить `video` внутрь `.overlay`, при auto-hide UI видео гаснет.

### iOS (Telegram WebView)

```
video.webkitEnterFullscreen()   // нативный iOS плеер
```

- Срабатывает только если `isIOS()` вернул `true`
- `isIOS()` проверяет три условия: `userAgent`, `navigator.platform` + `maxTouchPoints`, **и** `window.Telegram?.WebApp?.platform === "ios"` — последнее критично, т.к. Telegram WebView возвращает нестандартный UA
- Выход из fullscreen — через нативный контрол iOS плеера; ловится событием `video.webkitEndfullscreen`
- После `webkitEndfullscreen`: поток перезапускается через `stopStream() + init()` (задержка 300мс) — иначе iOS зависает

### CSS-fallback (`css-fs`)

Если нет нативного fullscreen API:

```css
#video-container.css-fs {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999 !important;
}
#video-container.css-fs .overlay { display: none !important; }
```

---

## 6. Аудио-сессия (фоновое воспроизведение)

### Android — `audio-bg`

```html
<audio id="audio-bg" muted></audio>
```

- В `loadStream()` к нему тоже подключается HLS через отдельный `hlsAudio`
- Пока приложение на переднем плане: `audio-bg` заглушён, звук идёт через `video`
- Когда вкладка уходит в фон (`visibilitychange → hidden`): `audio-bg.muted = false`, `video.muted = true` — держит аудиосессию
- Возврат на передний план: `audio-bg.muted = true` обратно

### iOS — Media Session API

- `setupMediaSession()` выставляет метаданные (`title = ch.name`) и `playbackState = "playing"`
- Позволяет управлять воспроизведением с экрана блокировки

---

## 7. Добавление канала — чеклист

- [ ] Создать Cloudflare Worker (скопировать `~/rossiya1-worker`, заменить источник)
- [ ] Развернуть Worker, получить URL вида `https://CHANNEL-worker.ACCOUNT.workers.dev`
- [ ] Подготовить лого-файл 52×52px (JPG/PNG), положить в `~/russia-tv-hub/`
- [ ] Добавить объект в `CHANNELS` в `index.html` (поля: id, name, desc, icon, iconBg, logo, stream, proxy)
- [ ] Проверить, что Worker возвращает `{ url: "..." }` при `GET /stream`
- [ ] Проверить, что `GET /proxy?url=...` корректно проксирует m3u8 и ts-сегменты
- [ ] Коммит + push → GitHub Pages обновится автоматически
- [ ] Проверить на Android (fullscreen через `requestFullscreen`)
- [ ] Проверить на iOS (fullscreen через `webkitEnterFullscreen`)
