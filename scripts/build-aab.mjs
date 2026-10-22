#!/usr/bin/env node
/**
 * Релизный AAB для Google Play с понятным именем: «MadamePoly 1.3 (2026-10-16 #1).aab»
 * и рядом файл деобфускации R8 с тем же именем.
 *
 *   npm run build:number   — сначала новый номер (дата и счётчик за день)
 *   npm run build:aab      — собрать и положить на рабочий стол
 *
 * Play Console сам называет выпуск «26101601 (1.3)», и дата в нём не читается.
 * Скрипт печатает название выпуска для поля «Название выпуска» — его вставляют
 * руками при создании выпуска.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const android = join(root, 'android');
const { expo } = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'));

// versionCode ГГММДДNN → дата и номер сборки за день.
const code = String(expo.android.versionCode);
if (!/^\d{8}$/.test(code)) {
  console.error(`versionCode ${code} не в формате ГГММДДNN — сначала npm run build:number`);
  process.exit(1);
}
const date = `20${code.slice(0, 2)}-${code.slice(2, 4)}-${code.slice(4, 6)}`;
const count = Number(code.slice(6));
const label = `${expo.version} (${date} #${count})`;

// Без ANDROID_HOME (новая оболочка, не из профиля) gradle не находит SDK.
const env = { ...process.env, ANDROID_HOME: process.env.ANDROID_HOME ?? join(homedir(), 'Library/Android/sdk') };
execFileSync('./gradlew', ['bundleRelease', '-q'], { cwd: android, stdio: 'inherit', env });

const desktop = join(homedir(), 'Desktop');
const aab = join(desktop, `MadamePoly ${label}.aab`);
copyFileSync(join(android, 'app/build/outputs/bundle/release/app-release.aab'), aab);

const mapping = join(android, 'app/build/outputs/mapping/release/mapping.txt');
if (existsSync(mapping)) copyFileSync(mapping, join(desktop, `MadamePoly ${label} mapping.txt`));

console.log(`\nAAB:      ${aab}`);
console.log(`versionCode ${code}, версия ${expo.version}`);
console.log(`Название выпуска в Play Console: ${label}`);
