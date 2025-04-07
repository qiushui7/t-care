import simpleGit, { SimpleGit as GitType } from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import { FileChange, SimpleGit, Language } from './types';
import { getLocalization } from './i18n';

/**
 * Git工具类，用于获取本地未提交的代码
 */
export class GitUtils implements SimpleGit {
  private git: GitType;
  private rootDir: string;
  private language: Language;

  /**
   * 构造函数
   * @param rootDir Git仓库根目录，默认为当前目录
   * @param language 语言设置，默认为中文
   */
  constructor(rootDir: string = process.cwd(), language: Language = 'zh') {
    this.rootDir = rootDir;
    this.git = simpleGit(rootDir);
    this.language = language;
  }

  /**
   * 检查当前目录是否为Git仓库
   * @returns 是否为Git仓库
   */
  async checkIsRepo(): Promise<boolean> {
    try {
      return await this.git.checkIsRepo();
    } catch (error) {
      console.error('检查Git仓库时出错:', error);
      return false;
    }
  }

  /**
   * 获取仓库状态
   * @returns 仓库状态
   */
  async status() {
    try {
      const status = await this.git.status();
      return {
        not_added: status.not_added,
        modified: status.modified,
        created: status.created,
        renamed: status.renamed.map((file) => ({ from: file.from, to: file.to })),
        staged: status.staged,
      };
    } catch (error) {
      console.error('获取Git状态时出错:', error);
      return {
        not_added: [],
        modified: [],
        created: [],
        renamed: [],
        staged: [],
      };
    }
  }

  /**
   * 显示文件内容
   * @param args Git show命令参数
   * @returns 文件内容
   */
  async show(args: string[]): Promise<string> {
    try {
      return await this.git.show(args);
    } catch (error) {
      console.error('获取文件内容时出错:', error);
      return '';
    }
  }

  /**
   * 获取未提交的文件列表
   * @returns 未提交的文件列表
   */
  async getUncommittedFiles(): Promise<string[]> {
    const status = await this.status();
    const files = [
      ...status.not_added,
      ...status.modified,
      ...status.created,
      ...status.staged,
      ...status.renamed.map((file) => file.to),
    ];

    // 去重
    return [...new Set(files)];
  }

  /**
   * 获取未提交的文件内容
   * @returns 未提交的文件内容列表
   */
  async getUncommittedChanges(): Promise<FileChange[]> {
    const files = await this.getUncommittedFiles();
    const changes: FileChange[] = [];
    const texts = getLocalization(this.language);

    for (const file of files) {
      try {
        let content = '';
        const filePath = path.join(this.rootDir, file);

        // 如果文件存在，则直接读取文件内容
        if (await fs.pathExists(filePath)) {
          // 检查是否是二进制文件
          const isBinary = await this.isBinaryFile(filePath);
          if (isBinary) {
            content = '[Binary File]';
          } else {
            content = await fs.readFile(filePath, 'utf-8');
          }
        } else {
          // 文件不存在（可能已被删除）或是新文件
          try {
            content = await this.git.show([`HEAD:${file}`]);
          } catch (err) {
            content = '[File deleted or content not available]';
          }
        }

        changes.push({
          file,
          content,
        });
      } catch (error) {
        console.error(`${texts.git.readFileError} ${file}:`, error);
      }
    }

    return changes;
  }

  /**
   * 获取已暂存(staged)的更改
   * @returns 已暂存的更改列表
   */
  async getStagedChanges(): Promise<FileChange[]> {
    const status = await this.status();
    const stagedFiles = status.staged;
    const changes: FileChange[] = [];

    for (const file of stagedFiles) {
      try {
        // 使用git show获取暂存区的文件内容
        const content = await this.git.show([`:${file}`]);
        changes.push({
          file,
          content,
        });
      } catch (error) {
        console.error(`获取暂存文件 ${file} 内容时出错:`, error);
      }
    }

    return changes;
  }

  /**
   * 获取未暂存(unstaged)的更改
   * @returns 未暂存的更改列表
   */
  async getUnstagedChanges(): Promise<FileChange[]> {
    const status = await this.status();
    const unstagedFiles = [...status.not_added, ...status.modified, ...status.created];
    const changes: FileChange[] = [];

    for (const file of unstagedFiles) {
      try {
        const filePath = path.join(this.rootDir, file);
        if (await fs.pathExists(filePath)) {
          // 检查是否是二进制文件
          const isBinary = await this.isBinaryFile(filePath);
          if (isBinary) {
            changes.push({
              file,
              content: '[二进制文件]',
            });
          } else {
            const content = await fs.readFile(filePath, 'utf-8');
            changes.push({
              file,
              content,
            });
          }
        }
      } catch (error) {
        console.error(`获取未暂存文件 ${file} 内容时出错:`, error);
      }
    }

    return changes;
  }

  /**
   * 简单检查文件是否为二进制文件
   * @param filePath 文件路径
   * @returns 是否为二进制文件
   */
  private async isBinaryFile(filePath: string): Promise<boolean> {
    try {
      // 读取文件的前几个字节来判断是否是二进制文件
      const buffer = await fs.readFile(filePath, { encoding: null });

      // 检查是否包含空字节（null bytes），这通常表示是二进制文件
      for (let i = 0; i < Math.min(buffer.length, 8192); i++) {
        if (buffer[i] === 0) {
          return true;
        }
      }

      // 文件扩展名黑名单，这些通常是二进制文件
      const binaryExtensions = [
        '.png',
        '.jpg',
        '.jpeg',
        '.gif',
        '.bmp',
        '.ico',
        '.svg',
        '.pdf',
        '.doc',
        '.docx',
        '.xls',
        '.xlsx',
        '.ppt',
        '.pptx',
        '.zip',
        '.rar',
        '.7z',
        '.tar',
        '.gz',
        '.jar',
        '.war',
        '.mp3',
        '.mp4',
        '.avi',
        '.mkv',
        '.mov',
        '.wav',
        '.ogg',
        '.exe',
        '.dll',
        '.so',
        '.dylib',
        '.class',
        '.o',
        '.obj',
        '.bin',
        '.dat',
        '.db',
        '.sqlite',
        '.sqlite3',
      ];

      const ext = path.extname(filePath).toLowerCase();
      if (binaryExtensions.includes(ext)) {
        return true;
      }

      return false;
    } catch (error) {
      console.error(`检查文件 ${filePath} 是否为二进制文件时出错:`, error);
      return false;
    }
  }

  /**
   * 获取Git差异信息
   * @param filePath 文件路径
   * @returns 差异信息
   */
  async getDiff(filePath: string): Promise<string> {
    try {
      return await this.git.diff([filePath]);
    } catch (error) {
      console.error(`获取文件 ${filePath} 差异信息时出错:`, error);
      return '';
    }
  }

  /**
   * 获取文件的Git提交历史
   * @param filePath 文件路径
   * @param limit 限制提交数量
   * @returns 提交历史
   */
  async getFileHistory(filePath: string, limit: number = 10): Promise<any[]> {
    try {
      const log = await this.git.log({
        file: filePath,
        maxCount: limit,
      });
      return [...log.all];
    } catch (error) {
      console.error(`获取文件 ${filePath} 的提交历史时出错:`, error);
      return [];
    }
  }
}
