# Care - Code Review Tool

[中文](README.md) | [English](README_EN.md)

An AI-based code review tool that automatically checks code quality, performance, security issues, and provides improvement suggestions.

## Features

- Check uncommitted local code files
- Inspect specified code files
- Provide detailed code review reports
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

## Configuration

Configure the tool using one of these methods:

1. Command line parameters:
   ```
   care check --language en  # Use English output
   care inspect file.js --language zh  # Use Chinese output
   ```

2. Configuration file:
   Create a `.carerc.json` file in your project root or home directory:
   ```json
   {
     "openaiKey": "your_openai_api_key_here",
     "model": "gpt-4o-mini",
     "detailed": false,
     "focus": "all",
     "excludeExtensions": [".json", ".md"],
     "language": "en"  // Set to "zh" (Chinese) or "en" (English)
   }
   ```

3. Create default configuration:
   ```
   care config --init
   ```

## Configuration File

Configuration files are supported in the following locations (in order of priority):

1. `.carerc.json` in the project directory
2. `.care/config.json` in the project directory
3. `.carerc.json` in the user's home directory
4. `.care/config.json` in the user's home directory

Example configuration file:

```json
{
  "openaiKey": "your_api_key_here",
  "model": "gpt-4o-mini",
  "detailed": false,
  "focus": "all"
}
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
│   ├── core/        # Core functionality module
│   ├── utils/       # Utility functions
│   ├── mastra/      # AI model integration
│   └── cli/         # Command line tool
├── rollup.config.js # Build configuration
└── package.json
```

### Build

```bash
pnpm run build
```

### Test

```bash
pnpm test
```

## License

ISC
