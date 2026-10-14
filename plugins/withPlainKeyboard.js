const { withAppDelegate } = require('expo/config-plugins');

/**
 * Клавиатура без подсказок на iOS. React Native по autoCorrect={false} и
 * spellCheck={false} выключает только автоисправление и подчёркивание, а
 * iOS 17+ продолжает дописывать слово серым (inline prediction), менять
 * кавычки и тире на «умные» и предлагать Writing Tools. В ответах на
 * изучаемом языке это та же подсказка: ошибку должен найти человек.
 *
 * Ядро React Native приходит собранным, патч его исходников не подействует,
 * поэтому правило ставится сбоку: поле, получившее фокус с выключенным
 * автоисправлением (это поля с NO_SUGGESTIONS в src/components/noSuggestions.ts),
 * теряет и остальные подсказки, а клавиатура перечитывает настройки.
 * Почта и пароль на экране входа тоже без автоисправления — там это безвредно:
 * подстановка из связки ключей идёт по textContentType и остаётся.
 */

const PLAIN_KEYBOARD = `
/// Поля без автоисправления — без всех подсказок iOS (см. plugins/withPlainKeyboard.js).
enum PlainKeyboard {
  static func install() {
    let center = NotificationCenter.default
    center.addObserver(forName: UITextField.textDidBeginEditingNotification, object: nil, queue: .main) { note in
      if let field = note.object as? UITextField { plain(field) }
    }
    center.addObserver(forName: UITextView.textDidBeginEditingNotification, object: nil, queue: .main) { note in
      if let view = note.object as? UITextView { plain(view) }
    }
  }

  private static func plain(_ field: UITextField) {
    guard field.autocorrectionType == .no, field.smartQuotesType != .no else { return }
    field.smartQuotesType = .no
    field.smartDashesType = .no
    field.smartInsertDeleteType = .no
    if #available(iOS 17.0, *) { field.inlinePredictionType = .no }
    if #available(iOS 18.0, *) { field.writingToolsBehavior = .none }
    field.reloadInputViews()
  }

  private static func plain(_ view: UITextView) {
    guard view.autocorrectionType == .no, view.smartQuotesType != .no else { return }
    view.smartQuotesType = .no
    view.smartDashesType = .no
    view.smartInsertDeleteType = .no
    if #available(iOS 17.0, *) { view.inlinePredictionType = .no }
    if #available(iOS 18.0, *) { view.writingToolsBehavior = .none }
    view.reloadInputViews()
  }
}
`;

function patchAppDelegate(source) {
  if (source.includes('enum PlainKeyboard')) return source;

  const launch = /(\n(\s*)return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\))/;
  if (!launch.test(source)) {
    throw new Error('withPlainKeyboard: не нашёл в AppDelegate конец didFinishLaunching — шаблон изменился');
  }
  const result = source.replace(launch, '\n$2PlainKeyboard.install()$1');
  return `${result.trimEnd()}\n${PLAIN_KEYBOARD}`;
}

module.exports = function withPlainKeyboard(config) {
  return withAppDelegate(config, (next) => {
    if (next.modResults.language !== 'swift') {
      throw new Error('withPlainKeyboard: ожидался AppDelegate на Swift');
    }
    next.modResults.contents = patchAppDelegate(next.modResults.contents);
    return next;
  });
};
