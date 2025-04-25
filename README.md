# Care  Code Analysis & Review Engine

![Care 代码审查工具](image/logo-svg.svg)

[中文](README.md) | [English](README_EN.md)

## 功能

- 检查本地未提交的代码文件
- 检查指定的代码文件
- 分析前端依赖真实调用情况
- 支持多种输出格式
- 支持配置文件管理设置

## 安装

```bash
npm i @t-care/cli -g //全局安装
//或
npm i @t-care/cli //局部安装通过npm调用
```

## 使用方法

### 检查未提交的代码

```bash
care check
```

选项：
- `-d, --detailed` - 显示详细审查结果
- `-f, --format <format>` - 输出格式 (text|json)
- `-m, --model <model>` - 使用的模型
- `--focus <focus>` - 审查重点 (性能|安全|可读性|最佳实践)

### 检查指定文件

```bash
care inspect path/to/file1.js path/to/file2.js
```

选项：
- `-d, --detailed` - 显示详细审查结果
- `-f, --format <format>` - 输出格式 (text|json)
- `-m, --model <model>` - 使用的模型
- `--focus <focus>` - 审查重点 (性能|安全|可读性|最佳实践)

### 分析依赖调用情况

```bash
care deps-analysis
```

### 管理配置

创建配置文件：

```bash
# 创建本地配置文件（当前目录）
care config --init

# 创建全局配置文件（用户主目录）
care config --init global
```

查看当前配置：

```bash
care config --show
```

## 配置

可以通过以下方式配置工具：

1. 命令行参数：
   ```
   care check --language en  # 使用英文输出
   care inspect file.js --language zh  # 使用中文输出
   ```

2. 创建默认配置：
   ```
   care config --init
   ```

## 配置文件

配置文件采用JavaScript格式，支持以下位置（按优先级排序）：

1. 项目目录下的 `.carerc.js` (JavaScript格式)
2. 项目目录下的 `.care/config.js` (JavaScript格式)
3. 用户主目录下的 `.carerc.js` (JavaScript格式)
4. 用户主目录下的 `.care/config.js` (JavaScript格式)

### JavaScript配置文件示例 (.carerc.js)

```javascript
module.exports = {
  openaiKey: 'your_api_key_here',
  model: 'gpt-4o-mini',
  detailed: false,
  focus: 'all',
  excludeExtensions: ['.json', '.md'],
  language: 'zh', //命令行中使用的语言，支持中文和英文
  depsAnalysis: {
    scanSource: [
      {
        name: 'your-project',
        include: ['your-project/src'], //扫描路径，默认扫描ts，tsx文件
        exclude: ['**/node_modules/**'], //排除目录，可选
        httpRepo: 'https://github.com/yourusername/yourrepo', //项目托管仓库地址，可选，传入后在扫描结果中可跳转
        format: (str) => {
          return str.replace('your-project', '');
        }, //format函数，用于纠正跳转路径
        packageJsonPath: './package.json',
        tsConfigPath: './tsconfig.json',
      }
    ],
    analysisTarget: ['lodash', 'react', 'axios'], //目标依赖，若不输入，默认扫描全部依赖
    blackList: ['@types/*'], //黑名单api，扫描结果会给出警告
    browserApis: ['localStorage', 'sessionStorage', 'navigator', 'document'], //检查浏览器api，请输入最顶层api，例如输入window，会自动扫描window.addEventListener
    isScanVue: false, //默认分析ts、tsx文件，开启后可以支持vue文件
  }
};
```
环境变量设置（可选，优先于配置文件）：

```bash
export OPENAI_API_KEY=your_api_key
```

## 开发

### 项目结构

```
care/
├── packages/
│   ├── core/           # 核心功能模块
│   ├── utils/          # 工具函数
│   ├── mastra/         # AI模型集成
│   ├── deps-analysis/  # 依赖分析模块
│   ├── deps-display/   # 依赖分析结果展示
│   └── cli/            # 命令行工具
├── rollup.config.js    # 构建配置
└── package.json
```

### 构建

```bash
pnpm build
```

### 开发

```bash
pnpm dev
```

## 许可证

ISC