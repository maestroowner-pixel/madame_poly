#!/usr/bin/env node
/**
 * Номер сборки из даты: iOS «1.3 (20261015.1)», Android 26101501.
 *
 *   npm run build:number                 — следующая сборка сегодня
 *   npm run build:number -- --version 1.4 — заодно новая версия
 *
 * Apple пускает в CFBundleVersion только числа через точку, поэтому дата —
 * числом ГГГГММДД, а после точки — какая это сборка за день. Android
 * versionCode — одно целое не больше 2 100 000 000: ГГММДД и две цифры
 * счётчика. Оба растут с каждой сборкой, как требуют магазины, и оба больше
 * прежних номеров (10323).
 *
 * ios/ и android/ не в git, и номер жил в пяти местах — app.json, Info.plist,
 * project.pbxproj (дважды), build.gradle. Скрипт правит все сразу.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = (file) => join(root, file);

const APP_JSON = path('app.json');
const PLIST = path('ios/MadamePoly/Info.plist');
const PBXPROJ = path('ios/MadamePoly.xcodeproj/project.pbxproj');
const GRADLE = path('android/app/build.gradle');

const args = process.argv.slice(2);
const versionAt = args.indexOf('--version');
const nextVersion = versionAt >= 0 ? args[versionAt + 1] : null;
if (versionAt >= 0 && !/^\d+(\.\d+){0,2}$/.test(nextVersion ?? '')) {
  console.error('--version ждёт число вида 1.4 или 1.4.1');
  process.exit(1);
}

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;

const app = JSON.parse(readFileSync(APP_JSON, 'utf8'));
const expo = app.expo;
const version = nextVersion ?? expo.version;

// Счётчик за день продолжаем с прежнего номера; новый день или новая версия — с 1.
const [prevDate, prevCount] = String(expo.ios?.buildNumber ?? '').split('.');
const count = prevDate === date && !nextVersion ? Number(prevCount || 0) + 1 : 1;
if (count > 99) {
  console.error('Больше 99 сборок за день — Android-номеру не хватит двух цифр');
  process.exit(1);
}

const iosBuild = `${date}.${count}`;
const androidCode = Number(date.slice(2)) * 100 + count;

expo.version = version;
expo.ios = { ...expo.ios, buildNumber: iosBuild };
expo.android = { ...expo.android, versionCode: androidCode };
writeFileSync(APP_JSON, `${JSON.stringify(app, null, 2)}\n`);

/** Заменяет по шаблону и проверяет, что место нашлось: молча пропущенное — та же ошибка загрузки. */
function patch(file, pairs) {
  if (!existsSync(file)) {
    console.warn(`нет ${file.replace(`${root}/`, '')} — пропускаю (prebuild возьмёт номер из app.json)`);
    return;
  }
  let text = readFileSync(file, 'utf8');
  for (const [pattern, value] of pairs) {
    if (!pattern.test(text)) throw new Error(`${file}: не нашёл ${pattern}`);
    text = text.replace(pattern, value);
  }
  writeFileSync(file, text);
}

patch(PLIST, [
  [/(<key>CFBundleVersion<\/key>\s*<string>)[^<]*(<\/string>)/, `$1${iosBuild}$2`],
  [/(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*(<\/string>)/, `$1${version}$2`],
]);
patch(PBXPROJ, [
  [/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${iosBuild};`],
  [/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`],
]);
patch(GRADLE, [
  [/versionCode \d+/, `versionCode ${androidCode}`],
  [/versionName "[^"]*"/, `versionName "${version}"`],
]);

console.log(`iOS     ${version} (${iosBuild})`);
console.log(`Android ${version} (${androidCode})`);
