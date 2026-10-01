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
  { id: 'm1', group: 'male', photo: require('../assets/avatars/m1.jpg') },
  { id: 'm2', group: 'male', photo: require('../assets/avatars/m2.jpg') },
  { id: 'm3', group: 'male', photo: require('../assets/avatars/m3.jpg') },
  { id: 'm4', group: 'male', photo: require('../assets/avatars/m4.jpg') },

  { id: 'f1', group: 'female', photo: require('../assets/avatars/f1.jpg') },
  { id: 'f2', group: 'female', photo: require('../assets/avatars/f2.jpg') },
  { id: 'f3', group: 'female', photo: require('../assets/avatars/f3.jpg') },
  { id: 'f4', group: 'female', photo: require('../assets/avatars/f4.jpg') },

  { id: 'c1', group: 'child', photo: require('../assets/avatars/c1.jpg') },
  { id: 'c2', group: 'child', photo: require('../assets/avatars/c2.jpg') },
  { id: 'c3', group: 'child', photo: require('../assets/avatars/c3.jpg') },
  { id: 'c4', group: 'child', photo: require('../assets/avatars/c4.jpg') },
];

export function findAvatar(id: string | null): Avatar | null {
  if (!id) return null;
  return AVATARS.find((avatar) => avatar.id === id) ?? null;
}
