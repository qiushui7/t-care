import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dts from 'rollup-plugin-dts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 获取包列表
 * @returns {string[]} 包名列表
 */
const getPackages = () => {
  return ['utils', 'core', 'mastra', 'cli'];
};

/**
 * 读取包的依赖
 * @param {string} pkg 包名
 * @returns {{dependencies: string[], peerDependencies: string[]}} 依赖列表
 */
const getDependencies = (pkg) => {
  const pkgJsonPath = path.resolve(__dirname, `packages/${pkg}/package.json`);
  let pkgJson;

  try {
    pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
  } catch (e) {
    console.error(`无法读取包 ${pkg} 的package.json:`, e);
    return { dependencies: [], peerDependencies: [] };
  }

  return {
    dependencies: Object.keys(pkgJson.dependencies || {}),
    peerDependencies: Object.keys(pkgJson.peerDependencies || {}),
  };
};

/**
 * 创建包的配置
 * @param {string} pkg 包名
 * @returns {import('rollup').RollupOptions[]} Rollup配置
 */
const createPackageConfig = (pkg) => {
  // CLI包特殊处理
  if (pkg === 'cli') {
    // 检查主入口文件是否存在
    const careInputFile = path.resolve(__dirname, `packages/${pkg}/src/care.ts`);

    if (!fs.existsSync(careInputFile)) {
      console.log(`跳过 ${pkg}，入口文件不存在: ${careInputFile}`);
      return [];
    }

    // 命令行入口文件 - ESM版本
    const careEsmConfig = {
      input: careInputFile,
      output: {
        file: path.resolve(__dirname, `packages/${pkg}/dist/care.js`),
        format: 'esm',
        sourcemap: true,
        exports: 'named',
        banner: '',
      },
      external: (id) => {
        // 排除所有node_modules中的依赖和workspace依赖
        if (id.includes('node_modules')) return true;
        if (id.includes('@care/') && !id.includes(`@care/${pkg}`)) return true;

        // 对于直接导入的模块，如果不是相对路径或绝对路径，则视为外部依赖
        if (!id.startsWith('.') && !id.startsWith('/') && !path.isAbsolute(id)) {
          return true;
        }

        return false;
      },
      plugins: [
        resolve({
          preferBuiltins: true,
        }),
        commonjs(),
        json(),
        typescript({
          tsconfig: path.resolve(__dirname, `packages/${pkg}/tsconfig.json`),
          declaration: false, // 不在这里生成声明文件
        }),
      ],
    };

    // 命令行入口文件的类型定义文件
    const careDtsConfig = {
      input: careInputFile,
      output: {
        file: path.resolve(__dirname, `packages/${pkg}/dist/care.d.ts`),
        format: 'es',
      },
      external: (id) => {
        // 排除所有node_modules中的依赖和workspace依赖
        if (id.includes('node_modules')) return true;
        if (id.includes('@care/') && !id.includes(`@care/${pkg}`)) return true;

        // 对于直接导入的模块，如果不是相对路径或绝对路径，则视为外部依赖
        if (!id.startsWith('.') && !id.startsWith('/') && !path.isAbsolute(id)) {
          return true;
        }

        return false;
      },
      plugins: [dts()],
    };

    return [careEsmConfig, careDtsConfig];
  }

  // 检查入口文件是否存在
  const inputFile = path.resolve(__dirname, `packages/${pkg}/src/index.ts`);
  if (!fs.existsSync(inputFile)) {
    console.log(`跳过 ${pkg}，入口文件不存在: ${inputFile}`);
    return [];
  }

  // ESM版本
  const esmConfig = {
    input: inputFile,
    output: {
      file: path.resolve(__dirname, `packages/${pkg}/dist/index.js`),
      format: 'esm',
      sourcemap: true,
      exports: 'named',
    },
    external: (id) => {
      // 排除所有node_modules中的依赖和workspace依赖
      if (id.includes('node_modules')) return true;
      if (id.includes('@care/') && !id.includes(`@care/${pkg}`)) return true;

      // 对于直接导入的模块，如果不是相对路径或绝对路径，则视为外部依赖
      if (!id.startsWith('.') && !id.startsWith('/') && !path.isAbsolute(id)) {
        return true;
      }

      return false;
    },
    plugins: [
      resolve({
        preferBuiltins: true,
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: path.resolve(__dirname, `packages/${pkg}/tsconfig.json`),
        declaration: false, // 不在这里生成声明文件，由下面的dts插件处理
      }),
    ],
  };

  // 类型定义文件配置
  const dtsConfig = {
    input: inputFile,
    output: {
      file: path.resolve(__dirname, `packages/${pkg}/dist/index.d.ts`),
      format: 'es',
    },
    external: (id) => {
      // 排除所有node_modules中的依赖和workspace依赖
      if (id.includes('node_modules')) return true;
      if (id.includes('@care/') && !id.includes(`@care/${pkg}`)) return true;

      // 对于直接导入的模块，如果不是相对路径或绝对路径，则视为外部依赖
      if (!id.startsWith('.') && !id.startsWith('/') && !path.isAbsolute(id)) {
        return true;
      }

      return false;
    },
    plugins: [dts()],
  };

  return [esmConfig, dtsConfig];
};

/**
 * 合并所有包的配置
 * @returns {import('rollup').RollupOptions[]} 所有Rollup配置
 */
const createConfigs = () => {
  const packages = getPackages();
  const configs = packages.flatMap(createPackageConfig);
  return configs;
};

export default defineConfig(createConfigs());
