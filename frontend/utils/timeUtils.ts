

import type { TranslationKey } from '../hooks/useTranslations';

const periods = {
  year: 365 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
};

export function formatTimeAgo(isoDate: string, t: (key: TranslationKey) => string): string {
  const time = new Date(isoDate).getTime();
  const diff = new Date().getTime() - time;

  if (diff < periods.minute) {
    return t('justNow');
  } else if (diff < periods.hour) {
    const minutes = Math.floor(diff / periods.minute);
    return `${minutes} ${minutes > 1 ? t('minutes') : t('minute')} ${t('ago')}`;
  } else if (diff < periods.day) {
    const hours = Math.floor(diff / periods.hour);
    return `${hours} ${hours > 1 ? t('hours') : t('hour')} ${t('ago')}`;
  } else if (diff < periods.week) {
    const days = Math.floor(diff / periods.day);
    return `${days} ${days > 1 ? t('days') : t('day')} ${t('ago')}`;
  } else if (diff < periods.month) {
    const weeks = Math.floor(diff / periods.week);
    return `${weeks} ${weeks > 1 ? t('weeks') : t('week')} ${t('ago')}`;
  } else if (diff < periods.month * 12) {
    const months = Math.floor(diff / periods.month);
    return `${months} ${months > 1 ? t('months') : t('month')} ${t('ago')}`;
  } else {
    const years = Math.floor(diff / periods.year);
    return `${years} ${years > 1 ? t('years') : t('year')} ${t('ago')}`;
  }
}
