// scripts/parse.cjs
// 把 ../HowToLiveBetter/book/*.md 解析成 src/data/items.json

const fs = require('fs');
const path = require('path');

const BOOK_DIR = path.join(__dirname, '..', '..', 'HowToLiveBetter', 'book');
const OUTPUT = path.join(__dirname, '..', 'src', 'data', 'items.json');

if (!fs.existsSync(BOOK_DIR)) {
  console.error(`❌ 找不到目录：${BOOK_DIR}`);
  process.exit(1);
}

const files = fs.readdirSync(BOOK_DIR)
  .filter(f => f.endsWith('.md'))
  .sort();

console.log(`📁 找到 ${files.length} 个 Markdown 文件\n`);

const allItems = [];

for (const file of files) {
  const raw = fs.readFileSync(path.join(BOOK_DIR, file), 'utf-8');

  // 从文件名提取章节号
  const sectionMatch = file.match(/^(\d+)/);
  const sectionNum = sectionMatch ? parseInt(sectionMatch[1]) : 0;

  // 从一级标题提取章节名
  const sectionTitleMatch = raw.match(/^#\s+(.+)$/m);
  const sectionTitle = sectionTitleMatch
    ? sectionTitleMatch[1].replace(/^\d+\.\s*/, '').trim()
    : '';

  // 按 "### " 拆分条目（三个 #）
  const blocks = raw.split(/^### /m).slice(1);

  let itemCount = 0;

  blocks.forEach((block) => {
    const lines = block.split('\n');
    let title = lines[0].trim();

    // 去掉标题前面的序号，比如 "1. 系安全带..." -> "系安全带..."
    title = title.replace(/^\d+\.\s*/, '');

    if (!title) return;

    // 提取 <!-- 成本标签: ... --> 里的元数据
    const tagMatch = block.match(/<!--\s*成本标签:\s*(.+?)\s*-->/);
    const tags = {};
    if (tagMatch) {
      tagMatch[1].split(/\s+/).forEach(pair => {
        const [k, v] = pair.split('=');
        if (k && v) tags[k] = v;
      });
    }

    // 提取字段：匹配 "- 标签：内容"
    const getField = (label) => {
      const regex = new RegExp(`^-\\s*${label}：([\\s\\S]*?)(?=\\n-\\s|\\n###|\\n##|\\n#|$)`, 'm');
      const m = block.match(regex);
      return m ? m[1].trim() : '';
    };

    // 提取交叉引用
    const refs = [];
    const refRegex = /见第\s*(\d+)\s*节第\s*(\d+)\s*条/g;
    let m;
    while ((m = refRegex.exec(block)) !== null) {
      refs.push(`${parseInt(m[1])}-${parseInt(m[2])}`);
    }

    itemCount++;

    allItems.push({
      id: `${sectionNum}-${itemCount}`,
      section: sectionNum,
      sectionTitle,
      title,
      cost: getField('成本'),
      plain: getField('说人话'),
      benefit: getField('收益'),
      evidence: getField('证据等级'),
      source: getField('来源'),
      note: getField('备注'),
      // 从注释里提取的元数据
      costMoney: tags['钱'] || '',
      costTime: tags['时间'] || '',
      costWill: tags['毅力'] || '',
      value: tags['收益'] || '',
      returns: tags['口径'] ? [tags['口径']] : [],
      refs,
    });
  });

  console.log(`  ✓ ${file}：${itemCount} 条`);
}

fs.writeFileSync(OUTPUT, JSON.stringify(allItems, null, 2), 'utf-8');

console.log(`\n✅ 共解析 ${allItems.length} 条，已写入：`);
console.log(`   ${OUTPUT}`);