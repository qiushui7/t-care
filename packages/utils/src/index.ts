import GitUtils from './git';
export * from './types';

export { GitUtils };

/**
 * 获取未提交的代码变更
 * @param dir 目录路径，默认为当前目录
 * @returns 未提交的代码变更
 */
export async function getUncommittedChanges(dir?: string) {
  const git = new GitUtils(dir);
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error('当前目录不是Git仓库');
  }
  return git.getUncommittedChanges();
}

/**
 * 获取已暂存的代码变更
 * @param dir 目录路径，默认为当前目录
 * @returns 已暂存的代码变更
 */
export async function getStagedChanges(dir?: string) {
  const git = new GitUtils(dir);
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error('当前目录不是Git仓库');
  }
  return git.getStagedChanges();
}

/**
 * 获取未暂存的代码变更
 * @param dir 目录路径，默认为当前目录
 * @returns 未暂存的代码变更
 */
export async function getUnstagedChanges(dir?: string) {
  const git = new GitUtils(dir);
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error('当前目录不是Git仓库');
  }
  return git.getUnstagedChanges();
}

/**
 * 获取文件的Git差异信息
 * @param filePath 文件路径
 * @param dir 目录路径，默认为当前目录
 * @returns 差异信息
 */
export async function getFileDiff(filePath: string, dir?: string) {
  const git = new GitUtils(dir);
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error('当前目录不是Git仓库');
  }
  return git.getDiff(filePath);
}
