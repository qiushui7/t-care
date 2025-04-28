import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface FileHash {
  path: string;
  hash: string;
  lastModified: number;
}

interface FileCache {
  importItemMap: Record<string, any>;
  apiMap: Record<string, any>;
  methodMap: Record<string, any>;
  typeMap: Record<string, any>;
  globalMap?: Record<string, any>;
  ghostDependenciesWarn: Record<string, any>;
}

export interface AnalysisCache {
  version: string; // 缓存版本
  timestamp: number; // 缓存创建时间
  fileHashes: FileHash[]; // 文件哈希列表
  fileCache: Record<FileHash['path'], FileCache>; // 文件缓存
}

export class CacheManager {
  private cachePath: string;
  public hasCache: boolean = false;
  public cache: AnalysisCache | null = null;
  public changedFiles: Set<string> = new Set(); // 变更的文件

  constructor(cacheDir: string) {
    this.cachePath = path.join(cacheDir, 'deps-analysis-cache.json');
  }

  // 计算文件哈希值
  public calculateFileHash(filePath: string): FileHash {
    const content = fs.readFileSync(filePath, 'utf-8');
    const hash = crypto.createHash('md5').update(content).digest('hex');
    const stats = fs.statSync(filePath);

    return {
      path: filePath,
      hash,
      lastModified: stats.mtimeMs,
    };
  }

  // 判断文件是否已更改
  public hasFileChanged(filePath: string): boolean {
    if (!this.cache) return true;
    let cachedFile = this.cache.fileHashes.find((f) => f.path === filePath);
    if (!cachedFile) return true;

    const currentHash = this.calculateFileHash(filePath);
    if (currentHash.hash !== cachedFile.hash) {
      this.cache.fileHashes = this.cache.fileHashes.filter((f) => f.path !== filePath);
      this.cache.fileHashes.push(currentHash);
      return true;
    }
    return false;
  }

  // 加载缓存
  public loadCache(): AnalysisCache | null {
    try {
      if (!fs.existsSync(this.cachePath)) {
        this.hasCache = false;
        return null;
      }

      this.hasCache = true;

      const cacheContent = fs.readFileSync(this.cachePath, 'utf-8');
      this.cache = JSON.parse(cacheContent);

      return this.cache;
    } catch (error) {
      console.error('Failed to load analysis cache:', error);
      return null;
    }
  }

  // 保存缓存
  public saveCache(cache: AnalysisCache): void {
    try {
      const dir = path.dirname(this.cachePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.cachePath, JSON.stringify(cache, null, 2));
    } catch (error) {
      console.error('Failed to save analysis cache:', error);
    }
  }
}
