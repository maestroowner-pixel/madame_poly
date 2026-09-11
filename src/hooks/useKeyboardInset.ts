import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Сколько снизу занимает клавиатура, в точках.
 *
 * Приложение рисуется во весь экран, вместе со строкой состояния и полосой
 * навигации, — а в этом режиме Android перестаёт сжимать окно под клавиатуру:
 * она просто ложится поверх, и ни adjustResize, ни KeyboardAvoidingView уже не
 * помогают. Поэтому отступ считаем сами, вычитая нижнюю безопасную зону: её
 * место клавиатура занимает собой.
 */
export function useKeyboardInset(): number {
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const shownEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hiddenEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const shown = Keyboard.addListener(shownEvent, (event) => {
      setHeight(event.endCoordinates.height);
    });
    const hidden = Keyboard.addListener(hiddenEvent, () => setHeight(0));

    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  return height === 0 ? 0 : Math.max(0, height - insets.bottom);
}
