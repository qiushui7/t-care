import { sharedPlugins, typescriptPluginEsm, typescriptPluginCjs } from '@t-care/rollup/base.js';

export default [
  // ESM格式输出
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist/esm',
      format: 'esm',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
    external: (id) => {
      // 排除所有node_modules中的依赖和workspace依赖
      if (id.includes('node_modules')) return true;
      if (id.includes('@t-care/')) return true;

      return false;
    },
    plugins: [...sharedPlugins, typescriptPluginEsm],
  },
  // CJS格式输出
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist/cjs',
      format: 'cjs',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
    external: (id) => {
      // 排除所有node_modules中的依赖和workspace依赖
      if (id.includes('node_modules')) return true;
      if (id.includes('@t-care/')) return true;

      return false;
    },
    plugins: [...sharedPlugins, typescriptPluginCjs],
  },
];
