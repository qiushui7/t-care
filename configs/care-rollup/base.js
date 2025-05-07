import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

// 共享的TypeScript插件配置
export const typescriptPlugin = typescript({
  tsconfig: './tsconfig.json',
  outputToFilesystem: true,
});
export const typescriptPluginEsm = typescript({
  tsconfig: './tsconfig.json',
  declaration: true,
  declarationDir: 'dist/esm',
  rootDir: 'src',
  outDir: 'dist/esm',
  outputToFilesystem: true,
});

export const typescriptPluginCjs = typescript({
  tsconfig: './tsconfig.json',
  declaration: true,
  declarationDir: 'dist/cjs',
  rootDir: 'src',
  outDir: 'dist/cjs',
  outputToFilesystem: true,
});

// 共享的其他插件
export const sharedPlugins = [
  resolve({
    preferBuiltins: true,
  }),
  commonjs(),
  json(),
  terser(),
];
