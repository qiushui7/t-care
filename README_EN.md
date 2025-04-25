# Care  Code Analysis & Review Engine

![Care Code Review Tool](image/logo-svg.svg)

[中文](README.md) | [English](README_EN.md)

## Features

- Check uncommitted local code files
- Inspect specified code files
- Analyze frontend dependency and browser API usage patterns
- Support multiple output formats
- Support configuration file management

## Installation

```bash
npm i @t-care/cli -g # global installation
# or
npm i @t-care/cli # local installation for npm usage
```

## Usage

### Check Uncommitted Code

```bash
care check
```

Options:
- `-d, --detailed` - Show detailed review results
- `-f, --format <format>` - Output format (text|json)
- `-m, --model <model>` - Model to use
- `--focus <focus>` - Review focus (performance|security|readability|best practices)

### Inspect Specific Files

```bash
care inspect path/to/file1.js path/to/file2.js
```

Options:
- `-d, --detailed` - Show detailed review results
- `-f, --format <format>` - Output format (text|json)
- `-m, --model <model>` - Model to use
- `--focus <focus>` - Review focus (performance|security|readability|best practices)

### Analyze Dependency Usage

```bash
care deps-analysis
```

### Manage Configuration

Create config file:

```bash
# Create local config file (current directory)
care config --init

# Create global config file (user home directory)
care config --init global
```

View current configuration:

```bash
care config --show
```

## Examples

![Code Inspection](image/example/codeInspect.png)

![Dependency Analysis](image/example/dependencyView.png)

![Browser API Analysis](image/example/browserApiView.png)

## Configuration

Configure the tool using one of these methods:

1. Command line parameters:
   ```
   care check --language en  # Use English output
   care inspect file.js --language zh  # Use Chinese output
   ```

2. Create default configuration:
   ```
   care config --init
   ```

## Configuration File

Configuration files use JavaScript format and are supported in the following locations (in order of priority):

1. `.carerc.js` in the project directory (JavaScript format)
2. `.care/config.js` in the project directory (JavaScript format)
3. `.carerc.js` in the user's home directory (JavaScript format)
4. `.care/config.js` in the user's home directory (JavaScript format)

### JavaScript Configuration File Example (.carerc.js)

```javascript
export default {
  openaiKey: 'your_api_key_here',
  model: 'gpt-4o-mini',
  detailed: false,
  focus: 'all',
  excludeExtensions: ['.json', '.md'],
  language: 'en', // Language used in CLI, supports English and Chinese
  depsAnalysis: {
    scanSource: [
      {
        name: 'your-project',
        include: ['your-project/src'], // Scan paths, defaults to ts, tsx files
        exclude: ['**/node_modules/**'], // Exclude directories, optional
        httpRepo: 'https://github.com/yourusername/yourrepo', // Repository URL, optional, enables link jumping in results
        format: (str) => {
          return str.replace('your-project', '');
        }, // Format function to correct path links
        packageJsonPath: './package.json',
        tsConfigPath: './tsconfig.json',
      }
    ],
    analysisTarget: ['lodash', 'react', 'axios'], // Target dependencies, if not provided, scans all dependencies
    blackList: ['@types/*'], // Blacklisted APIs, will show warnings in scan results
    browserApis: ['localStorage', 'sessionStorage', 'navigator', 'document'], // Browser APIs to check, enter top-level APIs, e.g., window will scan window.addEventListener
    isScanVue: false, // Defaults to analyzing ts, tsx files, enable to support Vue files
  }
};
```

Environment variable setting (optional, takes precedence over config file):

```bash
export OPENAI_API_KEY=your_api_key
```

## Development

### Project Structure

```
care/
├── packages/
│   ├── core/           # Core functionality module
│   ├── utils/          # Utility functions
│   ├── mastra/         # AI model integration
│   ├── deps-analysis/  # Dependency analysis module
│   ├── deps-display/   # Dependency analysis visualization
│   └── cli/            # Command line tool
├── rollup.config.js    # Build configuration
└── package.json
```

### Build

```bash
pnpm build
```

### Development

```bash
pnpm dev
```

## License

ISC
