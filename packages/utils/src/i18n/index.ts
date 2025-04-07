/**
 * 国际化模块
 */
import { en } from './en';
import { zh } from './zh';

export type Language = 'zh' | 'en';

/**
 * 所有语言的文本
 */
export const localizations = {
  zh,
  en,
};

/**
 * 获取指定语言的本地化文本
 * @param lang 语言代码
 * @returns 本地化文本
 */
export function getLocalization(lang: Language = 'zh'): typeof zh | typeof en {
  return localizations[lang] || localizations.zh;
}

/**
 * 导出所有语言
 */
export { zh, en };
