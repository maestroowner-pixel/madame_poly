/**
 * Готовые аватарки пользователя: по четыре мужских, женских и детских.
 * Metro требует статических путей в require, поэтому список явный —
 * заменить портрет значит заменить файл в assets/avatars.
 */
import { t } from './i18n';

export type AvatarGroup = 'male' | 'female' | 'child';

export interface Avatar {
  id: string;
  group: AvatarGroup;
  photo: number;
}

export const AVATAR_GROUPS: { group: AvatarGroup; title: string }[] = [
  { group: 'male', title: t.groupMale },
  { group: 'female', title: t.groupFemale },
  { group: 'child', title: t.groupChild },
];

export const AVATARS: Avatar[] = [
  { id: 'm1', group: 'male', photo: require('../assets/avatars/m1.png') },
  { id: 'm2', group: 'male', photo: require('../assets/avatars/m2.png') },
  { id: 'm3', group: 'male', photo: require('../assets/avatars/m3.png') },
  { id: 'm4', group: 'male', photo: require('../assets/avatars/m4.png') },

  { id: 'f1', group: 'female', photo: require('../assets/avatars/f1.png') },
  { id: 'f2', group: 'female', photo: require('../assets/avatars/f2.png') },
  { id: 'f3', group: 'female', photo: require('../assets/avatars/f3.png') },
  { id: 'f4', group: 'female', photo: require('../assets/avatars/f4.png') },

  { id: 'c1', group: 'child', photo: require('../assets/avatars/c1.png') },
  { id: 'c2', group: 'child', photo: require('../assets/avatars/c2.png') },
  { id: 'c3', group: 'child', photo: require('../assets/avatars/c3.png') },
  { id: 'c4', group: 'child', photo: require('../assets/avatars/c4.png') },
];

export function findAvatar(id: string | null): Avatar | null {
  if (!id) return null;
  return AVATARS.find((avatar) => avatar.id === id) ?? null;
}
