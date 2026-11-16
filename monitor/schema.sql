-- Мониторинг воспроизведения (rtv-monitor): только счётчики, без IP и без идентификаторов посетителя.
CREATE TABLE IF NOT EXISTS ev (
  day   TEXT    NOT NULL,            -- YYYY-MM-DD (UTC)
  ch    TEXT    NOT NULL,            -- id канала
  src   TEXT    NOT NULL,            -- site | app
  cc    TEXT    NOT NULL,            -- страна (cf.country)
  asn   INTEGER NOT NULL,            -- номер сети провайдера (cf.asn)
  dev   TEXT    NOT NULL,            -- ios | android | desktop | tv
  br    TEXT    NOT NULL,            -- safari | chrome | firefox | edge | tg | other
  kind  TEXT    NOT NULL,            -- s = попытка запуска, d = обрыв после запуска
  ok    INTEGER NOT NULL,            -- 1 пошёл, 0 не пошёл
  code  TEXT    NOT NULL,            -- код ошибки hls.js / native / timeout
  http  INTEGER NOT NULL,            -- HTTP-код при сетевой ошибке (0 — нет)
  host  TEXT    NOT NULL,            -- хост, на котором случилась ошибка
  wk    TEXT    NOT NULL,            -- воркер, через который шёл плейлист
  n     INTEGER NOT NULL DEFAULT 0,
  ttf   INTEGER NOT NULL DEFAULT 0,  -- сумма «времени до первого кадра», мс (для ok=1)
  PRIMARY KEY (day, ch, src, cc, asn, dev, br, kind, ok, code, http, host, wk)
);
CREATE INDEX IF NOT EXISTS ev_day ON ev(day);
CREATE TABLE IF NOT EXISTS asn_org (asn INTEGER PRIMARY KEY, org TEXT NOT NULL);
