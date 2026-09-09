import { useCallback, useState } from 'react';

import type { Anchor } from '../anchor';

export interface ZoomScreen {
  open: boolean;
  /** Значок, из которого экран вырос: в него же он и схлопнется. */
  anchor: Anchor | null;
  show: (anchor: Anchor | null) => void;
  hide: () => void;
}

/** Состояние модального экрана вместе с точкой, откуда его открыли. */
export function useZoomScreen(): ZoomScreen {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [open, setOpen] = useState(false);

  const show = useCallback((next: Anchor | null) => {
    setAnchor(next);
    setOpen(true);
  }, []);
  const hide = useCallback(() => setOpen(false), []);

  return { open, anchor, show, hide };
}
