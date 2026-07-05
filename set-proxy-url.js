const fs   = require('fs');
const path = require('path');

const newUrl = process.argv[2];
if (!newUrl) {
  console.error('Usage: node set-proxy-url.js <vercel-url-without-https>');
  console.error('Example: node set-proxy-url.js russia-tv-proxy-abc123.vercel.app');
  process.exit(1);
}

const PLACEHOLDER = 'RUSSIA_TV_PROXY_URL';
const files = [
  path.join(__dirname, 'index.html'),
  path.join(__dirname, '..', 'russia-tv-proxy', 'api', 'proxy.js'),
];

let changed = 0;
files.forEach(f => {
  if (!fs.existsSync(f)) { console.log(`⚠️  Not found: ${f}`); return; }
  const before = fs.readFileSync(f, 'utf8');
  const after  = before.split(PLACEHOLDER).join(newUrl);
  if (before !== after) {
    fs.writeFileSync(f, after);
    const count = (before.match(new RegExp(PLACEHOLDER, 'g')) || []).length;
    console.log(`✅ ${path.basename(f)} — заменено ${count} вхождений → ${newUrl}`);
    changed++;
  } else {
    console.log(`ℹ️  ${path.basename(f)} — плейсхолдер не найден (уже заменён?)`);
  }
});

console.log(changed > 0 ? `\n✅ Готово! Перезадеплой прокси:\n   cd ~/russia-tv-proxy && ALL_PROXY=socks5://127.0.0.1:1080 vercel --prod` : '\n⚠️  Ничего не изменено.');
