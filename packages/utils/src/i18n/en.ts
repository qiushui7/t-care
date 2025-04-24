/**
 * English localization
 */
export const en = {
  // Git related
  git: {
    notRepo: 'Current directory is not a Git repository',
    errorGetChanges: 'Error getting uncommitted changes',
    noChanges: 'No uncommitted changes found',
    binaryFileCheck: 'Error checking if file is binary',
    readFileError: 'Error reading file',
  },

  // Code review related
  review: {
    file: 'File',
    issues: 'Issues',
    suggestions: 'Suggestions',
    summary: 'Summary',
    strengths: 'Strengths',
    noIssues: 'No obvious issues found',
    noSuggestions: 'No specific improvement suggestions',
    goodQuality: 'Code quality is good',
    errorReviewing: 'Error occurred during review',
    reviewSeparately: 'Please try to review this file separately',
    noContent: 'No content to review',
    noFile: 'No file',
    noProvidedFiles: 'No file paths provided',
    provideFiles: 'Please provide at least one file path to review',
    fileNotExist: 'File does not exist',
    verifyPath: 'Please verify the file path is correct',
    errorReadingFile: 'Error occurred while reading file',
    checkReadable: 'Please check if the file is readable and has the correct format',
    filesExcluded: 'files were excluded from review (JSON files)',
    excludedFiles: 'Excluded files',
    installGit: 'Please make sure Git is installed and you are in a Git repository',
    // Review logs
    reviewingCode: 'Reviewing code',
    focus: 'Focus',
  },

  // CLI related
  cli: {
    loadingConfig: 'Loading configuration...',
    checkingFiles: 'Checking uncommitted files...',
    checkingSpecificFiles: (count: number) => `Checking ${count} files...`,
    checkCompleted: 'Check completed',
    noUncommittedFiles: 'No uncommitted files found to check',
    totalChecked: (count: number) => `Checked ${count} files in total`,
    checkFailed: (error: string) => `Failed to check uncommitted files: ${error}`,
    inspectFailed: (error: string) => `Failed to check files: ${error}`,
    fileNotExist: (file: string) => `File does not exist: ${file}`,
    noValidFiles: 'No valid files found',
    allFilesNotExist: 'All specified files do not exist',
    configCreated: (path: string) => `Default configuration file created at ${path}`,
    cannotCreateConfig: (error: string) => `Cannot create configuration file: ${error}`,
    currentConfig: 'Current configuration',
    configFailed: (error: string) => `Configuration operation failed: ${error}`,
    noOperationSpecified: 'No operation specified, please use --init or --show option',
    error: 'Error:',
    warning: 'Warning:',
    // Command descriptions
    programDescription: 'Code Analysis & Review Engine',
    helpOption: 'Display help information',
    helpCommand: 'Display help for command',
    checkCommand: 'Check uncommitted code files',
    inspectCommand: 'Inspect specified code files',
    configCommand: 'Manage configuration',
    depsAnalysisCommand: 'Dependency analysis',
    filesList: 'List of file paths',
    // Option descriptions
    detailedOption: 'Show detailed review results',
    formatOption: 'Output format (text|json)',
    modelOption: 'Model to use',
    focusOption: 'Review focus (performance|security|readability|best practices)',
    excludeOption: 'Excluded file extensions (e.g.: .json,.md)',
    languageOption: 'Output language, supports Chinese(zh) or English(en), can also be set in config file',
    initOption: 'Initialize config file (local|global) - JavaScript format only',
    showOption: 'Show current configuration',
  },
};
