export const CODEFILETYPE = {
  VUE: 'vue',
  TS: 'ts', //包含ts和tsx
};

export const ModuleType = {
  LOCAL_FILE: 'LOCAL_FILE', // 本地文件导入
  NODE_PACKAGE: 'NODE_PACKAGE', // Node包导入
  NODE_MODULE: 'NODE_MODULE', // Node模块导入
  UNKNOWN: 'UNKNOWN', // 未知类型, 可能为幽灵依赖
} as const;
