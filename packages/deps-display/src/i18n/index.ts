import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from '../locales/en.json';
import zhTranslation from '../locales/zh.json';

// 确保资源文件被正确加载
// 如果无法直接导入JSON文件，可以手动定义资源对象
const resources = {
  en: {
    translation: enTranslation,
  },
  zh: {
    translation: zhTranslation,
  },
};

i18n
  // 检测用户语言
  .use(LanguageDetector)
  // 将 i18n 实例传递给 react-i18next
  .use(initReactI18next)
  // 初始化 i18next
  .init({
    resources,
    fallbackLng: 'zh', // 如果没有匹配到语言则使用中文
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // React 已经安全地处理转义
    },
    detection: {
      // 检测顺序
      order: ['path', 'localStorage', 'navigator'],
      // 路径格式配置
      lookupFromPathIndex: 0,
    },
  });

// 添加语言更改日志，方便调试
i18n.on('languageChanged', (lng) => {
  console.log(`语言已切换到: ${lng}`);
});

export default i18n;
