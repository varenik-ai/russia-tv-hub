#!/bin/bash
# Тест кандидатов для мёртвых каналов через CF Worker debug endpoint
# Запуск: bash ~/russia-tv-hub/test-streams.sh

WORKER="https://russia-worker.dyaltd.workers.dev/debug?url="

test_url() {
  local name="$1"
  local url="$2"
  local result
  result=$(curl -s --max-time 10 "${WORKER}$(python3 -c "import urllib.parse; print(urllib.parse.quote('$url', safe=''))")&t=$(date +%s)")
  local status
  status=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','err'))" 2>/dev/null)
  local body
  body=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); b=d.get('body',''); print(b[:80].replace(chr(10),' '))" 2>/dev/null)
  if [[ "$status" == "200" ]]; then
    echo "✅  $name → $status | $body"
  else
    echo "❌  $name → $status | $body"
  fi
}

echo "=== Тест кандидатов для мёртвых каналов ==="
echo ""

echo "--- МИР ---"
test_url "МИР (mirtv HTTP)"       "http://hls.mirtv.cdnvideo.ru/mirtv-parampublish/mirtv_2500/playlist.m3u8"
test_url "МИР 24 (HTTP)"          "http://hls.mirtv.cdnvideo.ru/mirtv-parampublish/mir24_2500/playlist.m3u8"
test_url "МИР +7 (HTTP)"          "http://hls.mirtv.cdnvideo.ru/mirtv-parampublish/mirtv7_2500/playlist.m3u8"

echo ""
echo "--- Россия К ---"
test_url "kultura /0/ (текущий)"  "https://vgtrkregion-reg.cdnvideo.ru/vgtrk/0/kultura-hd/index.m3u8"
test_url "kultura /2/"            "https://vgtrkregion-reg.cdnvideo.ru/vgtrk/2/kultura-hd/index.m3u8"
test_url "kultura /4/"            "https://vgtrkregion-reg.cdnvideo.ru/vgtrk/4/kultura-hd/index.m3u8"
test_url "kultura /7/"            "https://vgtrkregion-reg.cdnvideo.ru/vgtrk/7/kultura-hd/index.m3u8"
test_url "kultura-sd /0/"         "https://vgtrkregion-reg.cdnvideo.ru/vgtrk/0/kultura-sd/index.m3u8"

echo ""
echo "--- RU.TV ---"
test_url "RU.TV Rutube"           "https://bl.rutube.ru/livestream/b1eb8e90d7e636677b3eb73b4fcbb717/index.m3u8?e=2069285076&s=d-E-bxKy2v3EEJ94RQX9CA&scheme=https"
test_url "RU.TV cinerama (dead?)" "https://stream8.cinerama.uz/1202/tracks-v1a1/mono.m3u8"

echo ""
echo "--- МУЗ-ТВ ---"
test_url "MuzTV cinerama"         "https://stream8.cinerama.uz/1200/tracks-v1a1/mono.m3u8"
test_url "MuzTV smotrim CDN"      "https://live-vgtrksmotrim.cdnvideo.ru/vgtrksmotrim/smotrim-live-03.smil/playlist.m3u8"
test_url "TNT Music mediacdn"     "https://tntm.mediacdn.ru/cdn/tntmusic/playlist.m3u8"

echo ""
echo "--- РЕН ТВ ---"
test_url "RenTV Rutube?"          "https://bl.rutube.ru/livestream/2e1e7ece5e20fa31cc36b1a53dba4c64/index.m3u8?e=2069285076&s=placeholder&scheme=https"
test_url "RenTV cdn4 HTTP"        "http://cdn4.skygo.mn/live/disk1/RenTV/HLSv3-FTA/RenTV.m3u8"
test_url "RenTV cdn4 HTTPS"       "https://cdn4.skygo.mn/live/disk1/RenTV/HLSv3-FTA/RenTV.m3u8"

echo ""
echo "--- СТС ---"
test_url "STS cdn4"               "https://cdn4.skygo.mn/live/disk1/STS/HLSv3-FTA/STS.m3u8"
test_url "Subbota Rutube"         "https://bl.rutube.ru/livestream/310744c10a5809da38aa445c952976da/index.m3u8?e=2066519758&s=dmUf6BUQzDBTwtQOseAfog&scheme=https"

echo ""
echo "--- ТНТ4 ---"
test_url "TNT4 cdn4"              "https://cdn4.skygo.mn/live/disk1/TNT4/HLSv3-FTA/TNT4.m3u8"

echo ""
echo "--- Мульт ---"
test_url "Mult cinerama"          "https://stream8.cinerama.uz/1246/tracks-v1a1/mono.m3u8"
test_url "Mult Multimania"        "https://sirius.greenhosting.ru/MultimaniaRu/tracks-v1a1/mono.m3u8"

echo ""
echo "=== Готово ==="
