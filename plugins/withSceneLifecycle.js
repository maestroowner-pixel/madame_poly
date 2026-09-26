const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

/**
 * Жизненный цикл UIScene для iOS 27. Приложение, собранное с SDK iOS 27 без
 * манифеста сцен, падает на запуске в
 * `_UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`. Шаблон Expo
 * 57 ещё создаёт окно в AppDelegate; сцены штатно придут в SDK 58
 * (expo/expo#46664, #50179). До тех пор — этот плагин:
 *
 * 1. манифест сцен в Info.plist, одна сцена, делегат — SceneDelegate;
 * 2. AppDelegate больше не создаёт окно и не запускает React Native, а только
 *    запоминает launchOptions;
 * 3. SceneDelegate создаёт окно из сцены, запускает React Native и передаёт ему
 *    ссылки, с которыми открыли приложение, — иначе теряются deep links и
 *    адрес Metro у dev-client.
 *
 * Одного манифеста мало: без окна из сцены экран остаётся чёрным.
 * После перехода на SDK 58 плагин надо убрать.
 */

const SCENE_DELEGATE = `
/// Сцена владеет окном: так требует SDK iOS 27 (см. plugins/withSceneLifecycle.js).
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard
      let windowScene = scene as? UIWindowScene,
      let appDelegate = UIApplication.shared.delegate as? AppDelegate,
      let factory = appDelegate.reactNativeFactory
    else { return }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window

    var launchOptions = appDelegate.launchOptions ?? [:]
    if let url = connectionOptions.urlContexts.first?.url {
      launchOptions[.url] = url
    }

    factory.startReactNative(withModuleName: "main", in: window, launchOptions: launchOptions)
    window.makeKeyAndVisible()

    if let url = connectionOptions.urlContexts.first?.url {
      _ = appDelegate.application(UIApplication.shared, open: url, options: [:])
    }
    if let activity = connectionOptions.userActivities.first {
      _ = appDelegate.application(UIApplication.shared, continue: activity, restorationHandler: { _ in })
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let url = URLContexts.first?.url,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    _ = appDelegate.application(UIApplication.shared, open: url, options: [:])
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    _ = appDelegate.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
  }
}
`;

function patchAppDelegate(source) {
  if (source.includes('class SceneDelegate')) return source;

  let result = source;

  // Запомнить launchOptions — сцене они нужны для запуска React Native.
  result = result.replace(
    /(var reactNativeFactory: RCTReactNativeFactory\?\n)/,
    '$1  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?\n',
  );

  // Убрать создание окна и запуск React Native из didFinishLaunching.
  const legacy =
    /#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/;
  if (!legacy.test(result)) {
    throw new Error('withSceneLifecycle: не нашёл в AppDelegate запуск окна — шаблон изменился, плагин надо обновить');
  }
  result = result.replace(
    legacy,
    '    // Окно и запуск React Native — в SceneDelegate (plugins/withSceneLifecycle.js).\n    self.launchOptions = launchOptions\n',
  );

  return `${result.trimEnd()}\n${SCENE_DELEGATE}`;
}

module.exports = function withSceneLifecycle(config) {
  config = withInfoPlist(config, (next) => {
    next.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return next;
  });

  return withAppDelegate(config, (next) => {
    if (next.modResults.language !== 'swift') {
      throw new Error('withSceneLifecycle: ожидался AppDelegate на Swift');
    }
    next.modResults.contents = patchAppDelegate(next.modResults.contents);
    return next;
  });
};
