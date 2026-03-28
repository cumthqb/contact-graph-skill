#!/usr/bin/env node

import { Command } from 'commander';
import ContactGraphDB from './ContactGraphDB';

const program = new Command();

program
  .name('contact-graph')
  .description('人脉关系图数据库 CLI（Neo4j）')
  .version('1.0.0');

// Global options
program
  .option('-u, --uri <uri>', 'Neo4j URI (or CONTACT_GRAPH_NEO4J_URI env)')
  .option('-n, --username <username>', 'Neo4j username (or CONTACT_GRAPH_NEO4J_USERNAME env)')
  .option('-p, --password <password>', 'Neo4j password (or CONTACT_GRAPH_NEO4J_PASSWORD env)');

// Helper to get DB instance with env fallbacks
async function getDB(options: { uri?: string; username?: string; password?: string }) {
  const uri = options.uri || process.env.CONTACT_GRAPH_NEO4J_URI || 'bolt://localhost:7687';
  const username = options.username || process.env.CONTACT_GRAPH_NEO4J_USERNAME || 'neo4j';
  const password = options.password || process.env.CONTACT_GRAPH_NEO4J_PASSWORD;
  if (!password) {
    console.error('❌ 缺少 Neo4j 密码：请设置 CONTACT_GRAPH_NEO4J_PASSWORD 或使用 --password');
    process.exit(1);
  }

  const db = new ContactGraphDB(uri, username, password);
  const connected = await db.verifyConnectivity();
  if (!connected) {
    console.error('❌ 无法连接到 Neo4j，请检查配置或环境变量');
    process.exit(1);
  }
  return db;
}

// Add person command
program
  .command('add <name>')
  .description('添加联系人')
  .option('-c, --company <company>', '公司')
  .option('-t, --title <title>', '职位')
  .option('--phone <phone>', '电话')
  .option('--email <email>', '邮箱')
  .option('--wechat <wechat>', '微信')
  .option('--hometown <hometown>', '籍贯')
  .option('--industry <industry>', '行业')
  .option('--city <city>', '城市')
  .option('--note <note>', '备注')
  .option('--closeness <closeness>', '亲疏度 (1-10)', '5')
  .option('--tags <tags>', '标签，用逗号分隔')
  .action(async (name, options) => {
    const db = await getDB(program.opts());
    await db.addPerson(name, {
      company: options.company,
      title: options.title,
      phone: options.phone,
      email: options.email,
      wechat: options.wechat,
      hometown: options.hometown,
      industry: options.industry,
      city: options.city,
      note: options.note,
      closeness: parseInt(options.closeness),
      tags: options.tags ? options.tags.split(',') : []
    });
    await db.close();
  });

// Add company command
program
  .command('add-company <name>')
  .description('添加公司')
  .option('-i, --industry <industry>', '行业')
  .option('--business <business>', '业务范围')
  .option('--city <city>', '城市')
  .option('--note <note>', '备注')
  .action(async (name, options) => {
    const db = await getDB(program.opts());
    await db.addCompany(name, {
      industry: options.industry,
      business: options.business,
      city: options.city,
      note: options.note
    });
    await db.close();
  });

// Add relationship command
program
  .command('rel <name1> <name2>')
  .description('添加关系')
  .option('-t, --type <type>', '关系类型', '朋友')
  .option('-s, --strength <strength>', '关系强度 (1-10)', '5')
  .option('--since <since>', '认识时间 (YYYY-MM-DD)')
  .option('--source <source>', '认识来源')
  .option('--note <note>', '备注')
  .action(async (name1, name2, options) => {
    const db = await getDB(program.opts());
    await db.addRelationship(name1, name2, {
      relation_type: options.type,
      strength: parseInt(options.strength),
      since: options.since,
      source: options.source,
      note: options.note
    });
    await db.close();
  });

// Works at command
program
  .command('works-at <person> <company>')
  .description('添加工作关系')
  .option('-t, --title <title>', '职位')
  .option('--since <since>', '入职时间')
  .action(async (person, company, options) => {
    const db = await getDB(program.opts());
    await db.worksAt(person, company, options.title, options.since);
    await db.close();
  });

program
  .command('add-resource-person <person> <resource>')
  .description('为联系人添加资源')
  .option('--category <category>', '资源类别')
  .option('--desc <desc>', '资源描述')
  .option('--contact <contact>', '联系方式/对接人')
  .option('--link <link>', '链接')
  .option('--note <note>', '备注')
  .option('--tags <tags>', '标签，用逗号分隔')
  .action(async (person, resource, options) => {
    const db = await getDB(program.opts());
    const result = await db.addResourceToPerson(person, {
      name: resource,
      category: options.category,
      description: options.desc,
      contact: options.contact,
      link: options.link,
      note: options.note,
      tags: options.tags ? options.tags.split(',') : []
    });
    if (!result) {
      console.log(`❌ 未找到联系人: ${person}`);
    } else {
      console.log(`✅ 资源 RID: ${result.rid}`);
    }
    await db.close();
  });

program
  .command('add-resource-company <company> <resource>')
  .description('为公司添加资源')
  .option('--category <category>', '资源类别')
  .option('--desc <desc>', '资源描述')
  .option('--contact <contact>', '联系方式/对接人')
  .option('--link <link>', '链接')
  .option('--note <note>', '备注')
  .option('--tags <tags>', '标签，用逗号分隔')
  .action(async (company, resource, options) => {
    const db = await getDB(program.opts());
    const result = await db.addResourceToCompany(company, {
      name: resource,
      category: options.category,
      description: options.desc,
      contact: options.contact,
      link: options.link,
      note: options.note,
      tags: options.tags ? options.tags.split(',') : []
    });
    if (!result) {
      console.log(`❌ 未找到公司: ${company}`);
    } else {
      console.log(`✅ 资源 RID: ${result.rid}`);
    }
    await db.close();
  });

program
  .command('resources <name>')
  .description('查看某个联系人/公司的资源列表')
  .option('-t, --type <type>', 'owner 类型: person|company', 'person')
  .action(async (name, options) => {
    const db = await getDB(program.opts());
    const type = (options.type || 'person').toLowerCase();
    const resources =
      type === 'company'
        ? await db.listResourcesForCompany(name)
        : await db.listResourcesForPerson(name);

    if (resources.length === 0) {
      console.log('❌ 暂无资源记录');
    } else {
      console.log(`\n🧩 资源 (${resources.length}):`);
      console.log('-'.repeat(60));
      resources.forEach(r => {
        const tags = r.tags ? r.tags.join(',') : '';
        console.log(`  - ${r.name} | ${r.category || ''} | [${tags}] | RID: ${r.rid}`);
      });
    }
    await db.close();
  });

program
  .command('search-resources <keyword>')
  .description('搜索资源（按名称/类别/描述/标签/备注）')
  .action(async (keyword) => {
    const db = await getDB(program.opts());
    const results = await db.searchResources(keyword);
    if (results.length === 0) {
      console.log('❌ 未找到匹配资源');
    } else {
      console.log(`\n🔍 找到 ${results.length} 个资源:`);
      console.log('-'.repeat(60));
      results.forEach(item => {
        const r = item.resource;
        const owners = item.owners.map(o => `${o.name}`).join('、');
        const tags = r.tags ? r.tags.join(',') : '';
        console.log(`  - ${r.name} | ${r.category || ''} | [${tags}] | RID: ${r.rid}${owners ? ` | 归属: ${owners}` : ''}`);
      });
    }
    await db.close();
  });

program
  .command('resource <rid>')
  .description('查看资源详情')
  .action(async (rid) => {
    const db = await getDB(program.opts());
    const result = await db.getResourceById(rid);
    if (!result) {
      console.log(`❌ 未找到资源: ${rid}`);
      await db.close();
      return;
    }
    const r = result.resource;
    console.log(`\n🧩 ${r.name}`);
    console.log('-'.repeat(60));
    console.log(`  rid: ${r.rid}`);
    if (r.category) console.log(`  category: ${r.category}`);
    if (r.description) console.log(`  description: ${r.description}`);
    if (r.contact) console.log(`  contact: ${r.contact}`);
    if (r.link) console.log(`  link: ${r.link}`);
    if (r.note) console.log(`  note: ${r.note}`);
    if (r.tags && r.tags.length > 0) console.log(`  tags: ${r.tags.join(',')}`);
    if (result.owners.length > 0) {
      console.log(`  owners: ${result.owners.map(o => o.name).join('、')}`);
    }
    await db.close();
  });

// Add interaction command
program
  .command('note <name> <note>')
  .description('添加互动记录')
  .option('-d, --date <date>', '日期 (YYYY-MM-DD)')
  .action(async (name, note, options) => {
    const db = await getDB(program.opts());
    await db.addInteraction(name, note, options.date);
    await db.close();
  });

// Find command
program
  .command('find <name>')
  .description('查找联系人')
  .action(async (name) => {
    const db = await getDB(program.opts());
    const person = await db.find(name);
    if (person) {
      console.log('\n👤 ' + person.name);
      console.log('-'.repeat(40));
      Object.entries(person).forEach(([k, v]) => {
        if (v && k !== 'name') {
          console.log(`  ${k}: ${v}`);
        }
      });
      
      // Show relations
      const relations = await db.getRelations(name);
      if (relations.length > 0) {
        console.log(`\n  关系 (${relations.length}):`);
        relations.forEach(r => {
          const relType = (r.relation as Record<string, unknown>)?.relation_type || '未知';
          console.log(`    - ${r.name} (${relType})`);
        });
      }
    } else {
      console.log(`❌ 未找到: ${name}`);
    }
    await db.close();
  });

// Search command
program
  .command('search <keyword>')
  .description('搜索联系人')
  .action(async (keyword) => {
    const db = await getDB(program.opts());
    const results = await db.search(keyword);
    if (results.length > 0) {
      console.log(`\n🔍 找到 ${results.length} 个结果:`);
      results.forEach(p => {
        const tags = p.tags ? p.tags.join(',') : '';
        console.log(`  - ${p.name} | ${p.company || ''} ${p.title || ''} | [${tags}]`);
      });
    } else {
      console.log('❌ 未找到匹配结果');
    }
    await db.close();
  });

// List command
program
  .command('list')
  .description('列出所有联系人')
  .option('-t, --tag <tag>', '按标签筛选')
  .action(async (options) => {
    const db = await getDB(program.opts());
    const results = await db.listAll(options.tag);
    if (results.length > 0) {
      console.log(`\n📋 共 ${results.length} 人${options.tag ? ` [标签: ${options.tag}]` : ''}`);
      console.log('-'.repeat(60));
      results.forEach(p => {
        const closeness = p.closeness || 5;
        const stars = '★'.repeat(closeness) + '☆'.repeat(10 - closeness);
        const tags = p.tags ? p.tags.join(',') : '';
        const last = p.last_contact || '从未';
        console.log(`${stars} ${p.name.padEnd(8)} | ${(p.company || '').padEnd(12)} | ${(p.title || '').padEnd(8)} | [${tags}] | 最近联系: ${last}`);
      });
    } else {
      console.log('❌ 暂无联系人');
    }
    await db.close();
  });

// Need contact command
program
  .command('need-contact [days]')
  .description('查看久未联系的人')
  .action(async (days = '30') => {
    const db = await getDB(program.opts());
    const results = await db.needContact(parseInt(days));
    if (results.length > 0) {
      console.log(`\n⏰ ${days}天未联系的人 (${results.length}人):`);
      console.log('-'.repeat(60));
      results.forEach(p => {
        const closeness = p.closeness || 5;
        const stars = '★'.repeat(closeness) + '☆'.repeat(10 - closeness);
        const last = p.last_contact || '从未';
        console.log(`${stars} ${p.name.padEnd(8)} | 最近联系: ${last} | ${p.phone || ''}`);
      });
    } else {
      console.log(`✅ 所有人都 ${days} 天内有联系`);
    }
    await db.close();
  });

// Network command
program
  .command('net <name>')
  .description('查看关系网络')
  .action(async (name) => {
    const db = await getDB(program.opts());
    const person = await db.find(name);
    if (!person) {
      console.log(`❌ 未找到: ${name}`);
      await db.close();
      return;
    }
    
    const relations = await db.getRelations(name);
    console.log(`\n🕸️  ${name} 的关系网络:`);
    console.log('-'.repeat(40));
    console.log(`中心: ${name} (${person.company || ''} ${person.title || ''})`);
    console.log(`\n直接连接 (${relations.length}):`);
    relations.forEach(r => {
      const rel = r.relation as Record<string, unknown>;
      let strength = rel?.strength || 5;
      // Handle BigInt from Neo4j
      if (typeof strength === 'bigint') {
        strength = Number(strength);
      }
      const strengthNum = strength as number;
      const stars = '★'.repeat(strengthNum) + '☆'.repeat(10 - strengthNum);
      const relType = rel?.relation_type || '未知';
      const since = rel?.since || '未知';
      console.log(`  ${stars} ${r.name} (${relType}) - 认识于 ${since}`);
    });
    await db.close();
  });

// Stats command
program
  .command('stats')
  .description('统计信息')
  .action(async () => {
    const db = await getDB(program.opts());
    const stats = await db.stats();
    console.log('\n📊 数据库统计:');
    console.log('-'.repeat(40));
    Object.entries(stats).forEach(([k, v]) => {
      console.log(`  ${k}: ${v}`);
    });
    await db.close();
  });

// Export command
program
  .command('export')
  .description('导出 Neo4j Cypher 语句')
  .action(async () => {
    const db = await getDB(program.opts());
    const cypher = await db.exportCypher();
    console.log(cypher);
    await db.close();
  });

// Init command
program
  .command('init')
  .description('初始化数据库（创建约束和索引）')
  .action(async () => {
    const db = await getDB(program.opts());
    await db.initConstraints();
    console.log('✅ 数据库初始化完成');
    await db.close();
  });

program.parse();
