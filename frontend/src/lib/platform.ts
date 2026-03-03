export type Platform = 'ios' | 'android' | 'windows' | 'macos' | 'other';

export function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other';

  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Win/.test(navigator.platform)) return 'windows';
  if (/Mac/.test(navigator.platform) && !/iPhone|iPad/.test(ua)) return 'macos';
  return 'other';
}

export function getTheme(platform: Platform): 'glass' | 'material' {
  return platform === 'ios' || platform === 'macos' ? 'glass' : 'material';
}
