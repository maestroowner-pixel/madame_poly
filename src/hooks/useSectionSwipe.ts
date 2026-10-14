import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, PanResponder, useWindowDimensions } from 'react-native';

/** Сколько пальцем нужно провести, чтобы экран сменился, — доля ширины экрана. */
const DISTANCE = 0.25;
/** Короткий быстрый взмах тоже листает, даже если палец прошёл меньше. */
const FLICK = 0.5;
/** Дальше листать некуда — экран тянется туго и возвращается. */
const EDGE_DRAG = 0.3;
const OUT_MS = 160;
const IN_MS = 220;

/**
 * Что раздел говорит свайпу о себе: функция — он открыт вглубь (урок, разбор,
 * тест), и свайп вправо выходит из него; 'lock' — идёт сессия с микрофоном,
 * листать нельзя; null — раздел на верхнем уровне.
 */
export type SwipeBack = (() => void) | 'lock' | null;

const SwipeBackContext = createContext<(back: SwipeBack) => void>(() => {});
export const SwipeBackProvider = SwipeBackContext.Provider;

/** Раздел объявляет, как из него выйти свайпом вправо (или что листать нельзя). */
export function useSwipeBack(back: SwipeBack) {
  const register = useContext(SwipeBackContext);
  useEffect(() => {
    register(back);
    return () => register(null);
  }, [register, back]);
}

interface Options<S extends string> {
  /** Разделы в порядке меню — свайп листает по нему, без перехода по кругу. */
  order: S[];
  current: S;
  onChange: (next: S) => void;
  /** false — жест не перехватываем: идёт беседа, открыто меню или покупка. */
  enabled: boolean;
}

/**
 * Свайп по экранам в два уровня. Если раздел открыт вглубь, свайп вправо
 * возвращает на его верхний уровень. На верхнем уровне свайп листает разделы:
 * влево — к следующему по меню, вправо — к предыдущему. Экран идёт за пальцем;
 * отпустили дальше порога — он уезжает за край, а новый въезжает с другой
 * стороны.
 *
 * Жест берём только явно горизонтальный и на всплытии, а не на захвате:
 * вертикальные ленты и горизонтальные карусели внутри разделов (языки в
 * настройках, таблица в уроке) получают касание первыми и листаются сами.
 */
export function useSectionSwipe<S extends string>({ order, current, onChange, enabled }: Options<S>) {
  const { width } = useWindowDimensions();
  const offset = useRef(new Animated.Value(0)).current;
  /** Направление, с которого должен въехать новый раздел: 1 — справа, -1 — слева. */
  const entering = useRef(0);
  const back = useRef<SwipeBack>(null);

  // Обработчики жеста создаются один раз — свежие значения читаем через ref.
  const state = useRef({ order, current, onChange, enabled, width });
  state.current = { order, current, onChange, enabled, width };

  const slideIn = (from: number) => {
    offset.setValue(from * state.current.width);
    Animated.timing(offset, {
      toValue: 0,
      duration: IN_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  // Раздел сменился после свайпа — новый въезжает со стороны, куда листали.
  useEffect(() => {
    const from = entering.current;
    if (!from) return;
    entering.current = 0;
    slideIn(from);
    // slideIn читает только ref и Animated.Value — от рендера не зависит.
  }, [current]);

  const responder = useMemo(() => {
    const settle = () =>
      Animated.spring(offset, { toValue: 0, bounciness: 4, useNativeDriver: true }).start();

    /** Куда ведёт свайп: выход из глубины, соседний раздел или никуда. */
    const target = (dx: number): { back: () => void } | { section: S } | null => {
      const inner = back.current;
      if (typeof inner === 'function') return dx > 0 ? { back: inner } : null;
      const { order, current } = state.current;
      const next = order[order.indexOf(current) + (dx < 0 ? 1 : -1)];
      return next ? { section: next } : null;
    };

    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        state.current.enabled &&
        back.current !== 'lock' &&
        Math.abs(gesture.dx) > 14 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy) * 2,
      // Начатое листание не отдаём ленте, которая заметила бы вертикальную дрожь.
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gesture) => {
        offset.setValue(target(gesture.dx) ? gesture.dx : gesture.dx * EDGE_DRAG);
      },
      onPanResponderRelease: (_, gesture) => {
        const { width, onChange } = state.current;
        const next = target(gesture.dx);
        const far = Math.abs(gesture.dx) > width * DISTANCE;
        const flick = Math.abs(gesture.vx) > FLICK && Math.sign(gesture.vx) === Math.sign(gesture.dx);
        if (!next || !(far || flick)) {
          settle();
          return;
        }
        const direction = gesture.dx < 0 ? -1 : 1;
        Animated.timing(offset, {
          toValue: direction * width,
          duration: OUT_MS,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }).start(() => {
          if ('back' in next) {
            // Раздел тот же — верхний уровень въезжает сразу, без смены раздела.
            next.back();
            slideIn(-direction);
            return;
          }
          entering.current = -direction;
          onChange(next.section);
        });
      },
      // Касание забрала карусель или система — экран возвращается на место.
      onPanResponderTerminate: settle,
    });
  }, [offset]);

  /** Отдаётся разделам через SwipeBackProvider. */
  const register = useMemo(() => (next: SwipeBack) => {
    back.current = next;
  }, []);

  return {
    panHandlers: responder.panHandlers,
    style: { transform: [{ translateX: offset }] },
    register,
  };
}
