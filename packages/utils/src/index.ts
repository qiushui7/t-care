import { GitUtils } from './git';
import { FileChange, Language, SimpleGit } from './types';
import { getLocalization } from './i18n';

// 重新导出类型，避免命名冲突
export type { FileChange, SimpleGit, Language, CLIOptions } from './types';
export { getLocalization, en, zh, localizations } from './i18n';
export { GitUtils };

/**
 * 获取未提交的代码变更
 * @param dir 目录路径，默认为当前目录
 * @param language 语言设置，默认为中文
 * @returns 未提交的代码变更
 */
export async function getUncommittedChanges(dir?: string, language: Language = 'zh') {
  const git = new GitUtils(dir, language);
  const texts = getLocalization(language);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error(texts.git.notRepo);
  }
  return git.getUncommittedChanges();
}

/**
 * 获取已暂存的代码变更
 * @param dir 目录路径，默认为当前目录
 * @param language 语言设置，默认为中文
 * @returns 已暂存的代码变更
 */
export async function getStagedChanges(dir?: string, language: Language = 'zh') {
  const git = new GitUtils(dir, language);
  const texts = getLocalization(language);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error(texts.git.notRepo);
  }
  return git.getStagedChanges();
}

/**
 * 获取未暂存的代码变更
 * @param dir 目录路径，默认为当前目录
 * @param language 语言设置，默认为中文
 * @returns 未暂存的代码变更
 */
export async function getUnstagedChanges(dir?: string, language: Language = 'zh') {
  const git = new GitUtils(dir, language);
  const texts = getLocalization(language);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error(texts.git.notRepo);
  }
  return git.getUnstagedChanges();
}

/**
 * 获取文件的Git差异信息
 * @param filePath 文件路径
 * @param dir 目录路径，默认为当前目录
 * @param language 语言设置，默认为中文
 * @returns 差异信息
 */
export async function getFileDiff(filePath: string, dir?: string, language: Language = 'zh') {
  const git = new GitUtils(dir, language);
  const texts = getLocalization(language);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error(texts.git.notRepo);
  }
  return git.getDiff(filePath);
}
