# Care 代码审查工具

[中文](README.md) | [English](README_EN.md)

这是一个基于AI的代码审查工具，可以自动检查代码质量、性能、安全性等问题，并提供改进建议。

## 功能

- 检查本地未提交的代码文件
- 检查指定的代码文件
- 提供详细的代码审查报告
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

2. 配置文件：
   在项目根目录或用户主目录创建 `.carerc.json` 文件：
   ```json
   {
     "openaiKey": "your_openai_api_key_here",
     "model": "gpt-4o-mini",
     "detailed": false,
     "focus": "all",
     "excludeExtensions": [".json", ".md"],
     "language": "zh"  // 设置为 "zh" (中文) 或 "en" (英文)
   }
   ```

3. 创建默认配置：
   ```
   care config --init
   ```

## 配置文件

配置文件支持以下位置（按优先级排序）：

1. 项目目录下的 `.carerc.json`
2. 项目目录下的 `.care/config.json`
3. 用户主目录下的 `.carerc.json`
4. 用户主目录下的 `.care/config.json`

配置文件示例：

```json
{
  "openaiKey": "your_api_key_here",
  "model": "gpt-4o-mini",
  "detailed": false,
  "focus": "all"
}
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
│   ├── core/        # 核心功能模块
│   ├── utils/       # 工具函数
│   ├── mastra/      # AI模型集成
│   └── cli/         # 命令行工具
├── rollup.config.js # 构建配置
└── package.json
```

### 构建

```bash
pnpm run build
```

### 测试

```bash
pnpm test
```

## 许可证

ISC 