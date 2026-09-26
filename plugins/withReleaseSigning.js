const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Релизная сборка Android подписывается ключом загрузки Google Play
 * (MadamePoly.jks). Пути и пароли — в ~/.gradle/gradle.properties
 * (POLY_UPLOAD_*), в репозиторий не попадают. Без плагина prebuild
 * возвращает шаблонную подпись debug-ключом, и Play отклоняет набор.
 * Если свойств на машине нет, release, как и раньше, подписывается debug.
 */
const SIGNING = `
        release {
            if (project.hasProperty('POLY_UPLOAD_STORE_FILE')) {
                storeFile file(POLY_UPLOAD_STORE_FILE)
                storePassword POLY_UPLOAD_STORE_PASSWORD
                keyAlias POLY_UPLOAD_KEY_ALIAS
                keyPassword POLY_UPLOAD_KEY_PASSWORD
            }
        }`;

const RELEASE_CONFIG =
  "signingConfig project.hasProperty('POLY_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug";

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    let gradle = mod.modResults.contents;
    if (gradle.includes('POLY_UPLOAD_STORE_FILE')) return mod;

    gradle = gradle.replace(/(signingConfigs\s*\{\s*\n\s*debug\s*\{[^}]*\})/, `$1${SIGNING}`);
    gradle = gradle.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
      `$1${RELEASE_CONFIG}`,
    );
    mod.modResults.contents = gradle;
    return mod;
  });
};
