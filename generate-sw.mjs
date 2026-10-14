// generate-sw.mjs
import { generateSW } from 'workbox-build';
import { join } from 'path';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';

const distDir = join(process.cwd(), 'dist');

// 为首页生成一个基于内容哈希的版本号，确保内容更新后能刷新缓存
const appShellPath = join(distDir, 'index.html');
const appShellRevision = createHash('sha1').update(readFileSync(appShellPath)).digest('hex');

// 核心配置：告诉 Workbox 要缓存 dist 目录下的哪些文件
const { count, size, warnings } = await generateSW({
  globDirectory: distDir,
  // 匹配所有需要缓存的静态资源
  globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,xml,json,txt,woff2,woff,ttf}'],
  // 排除一些不需要缓存的大文件或特定目录
  globIgnores: ['**/node_modules/**/*', 'sw.js', 'workbox-*.js'],
  // 当用户离线且访问一个未缓存的页面时，回退到首页
  navigateFallback: '/',
  // 指定生成的 Service Worker 文件存放位置
  swDest: join(distDir, 'sw.js'),
  // 设置缓存文件大小上限，防止缓存过大的文件
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  // 清理旧版本的缓存
  cleanupOutdatedCaches: true,
  // 关键：将首页的 revision 加入清单，确保离线时能访问首页
  additionalManifestEntries: [{ url: 'index.html', revision: appShellRevision }],
});

console.log(`Generated sw.js: precached ${count} files (${(size / 1024 / 1024).toFixed(2)} MB)`);
if (warnings && warnings.length) {
  console.warn('workbox warnings:', warnings);
}