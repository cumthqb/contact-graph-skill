---
name: contact-graph
description: 人脉关系图数据库管理工具。基于 Neo4j 构建，用于记录和管理个人人脉网络，包括联系人信息、公司关系、人际网络分析。使用场景包括：(1) 记录新认识的人及其背景信息，(2) 查询已有联系人的详细资料和关系，(3) 分析人脉网络中的连接关系，(4) 跟踪与联系人的互动记录，(5) 发现久未联系的重要人脉，(6) 导出数据用于可视化展示。
metadata: {"openclaw":{"requires":{"env":["CONTACT_GRAPH_NEO4J_URI","CONTACT_GRAPH_NEO4J_USERNAME","CONTACT_GRAPH_NEO4J_PASSWORD"],"bins":["node","npx"]}}}
---

# Contact Graph Skill

人脉关系图数据库 - 基于 Neo4j 的联系人管理工具
当用户意图是创建人脉关系或对应资源以及查询人脉和资源的时候使用

## 环境变量配置

通过环境变量配置 Neo4j 连接信息（URI/用户名有默认值；密码需要显式配置）：

| 变量名                            | 默认值                     | 说明         |
| ------------------------------ | ----------------------- | ---------- |
| `CONTACT_GRAPH_NEO4J_URI`      | `bolt://localhost:7687` | Neo4j 连接地址 |
| `CONTACT_GRAPH_NEO4J_USERNAME` | `neo4j`                 | 用户名        |
| `CONTACT_GRAPH_NEO4J_PASSWORD` | 无（必须配置）                 | 密码         |

## 安全与隐私

- 建议为该工具创建专用 Neo4j 用户并最小化权限
- 在让代理执行 CLI 前，先确认目标数据库与操作意图，避免误写入生产库

## 安装

```bash
npm install
npm run build
```

## 使用方法

### 初始化数据库

```bash
npx contact-graph init
```

### 添加联系人

```bash
npx contact-graph add "张三" \
  --company "ABC科技" \
  --title "技术总监" \
  --phone "138xxxx" \
  --hometown "江苏南京"
```

### 添加公司

```bash
npx contact-graph add-company "ABC科技" \
  --industry "互联网" \
  --business "软件开发"
```

### 添加关系

```bash
npx contact-graph rel "张三" "李四" \
  --type "好友" \
  --strength 8 \
  --source "大学同学"
```

### 添加工作关系

```bash
npx contact-graph works-at "张三" "ABC科技" \
  --title "技术总监" \
  --since "2020-01"
```

### 搜索联系人

```bash
npx contact-graph search "张三"
```

### 查看关系网络

```bash
npx contact-graph net "张三"
```

### 查看久未联系的人

```bash
npx contact-graph need-contact 30
```

### 添加互动记录

```bash
npx contact-graph note "张三" "今天一起吃饭，聊了项目合作"
```

## API 使用

```typescript
import ContactGraphDB from '@cumthqb/contact-graph';

// 自动从环境变量读取配置（URI/用户名有默认值；密码需显式设置）
const db = new ContactGraphDB();

// 或手动指定配置
const db = new ContactGraphDB(
  process.env.CONTACT_GRAPH_NEO4J_URI || 'bolt://localhost:7687',
  process.env.CONTACT_GRAPH_NEO4J_USERNAME || 'neo4j',
  process.env.CONTACT_GRAPH_NEO4J_PASSWORD || 'CHANGE_ME'
);

// 添加联系人
await db.addPerson('张三', {
  company: 'ABC科技',
  title: '技术总监',
  hometown: '江苏南京',
  phone: '13800138000'
});

// 添加公司
await db.addCompany('ABC科技', {
  industry: '互联网',
  business: '软件开发'
});

// 添加关系
await db.addRelationship('张三', '李四', {
  relation_type: '好友',
  strength: 8,
  source: '大学同学'
});

// 查询关系
const relations = await db.getRelations('张三');
console.log(relations);

// 搜索
const results = await db.search('科技');
console.log(results);

await db.close();
```

## CLI 命令列表

| 命令                            | 说明        | 示例                                             |
| ----------------------------- | --------- | ---------------------------------------------- |
| `init`                        | 初始化数据库    | `npx contact-graph init`                       |
| `add <name>`                  | 添加联系人     | `npx contact-graph add "张三" --company "ABC科技"` |
| `add-company <name>`          | 添加公司      | `npx contact-graph add-company "ABC科技"`        |
| `rel <name1> <name2>`         | 添加关系      | `npx contact-graph rel "张三" "李四" --type "好友"`  |
| `works-at <person> <company>` | 添加工作关系    | `npx contact-graph works-at "张三" "ABC科技"`      |
| `add-resource-person <person> <resource>` | 为联系人添加资源 | `npx contact-graph add-resource-person "张三" "渠道资源" --category "渠道" --tags "BD,合作"` |
| `add-resource-company <company> <resource>` | 为公司添加资源 | `npx contact-graph add-resource-company "ABC科技" "技术专家" --category "人才" --contact "张三"` |
| `resources <name>`            | 查看资源列表   | `npx contact-graph resources "张三" --type person` |
| `search-resources <keyword>`  | 搜索资源      | `npx contact-graph search-resources "渠道"`        |
| `resource <rid>`              | 查看资源详情   | `npx contact-graph resource "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"` |
| `note <name> <note>`          | 添加互动记录    | `npx contact-graph note "张三" "今天一起吃饭"`         |
| `find <name>`                 | 查找联系人     | `npx contact-graph find "张三"`                  |
| `search <keyword>`            | 搜索        | `npx contact-graph search "科技"`                |
| `list`                        | 列出所有联系人   | `npx contact-graph list`                       |
| `net <name>`                  | 查看关系网络    | `npx contact-graph net "张三"`                   |
| `stats`                       | 统计信息      | `npx contact-graph stats`                      |
| `export`                      | 导出 Cypher | `npx contact-graph export`                     |
| `need-contact [days]`         | 久未联系的人    | `npx contact-graph need-contact 30`            |

## 数据结构

### Person 节点属性

| 属性             | 类型        | 说明         |
| -------------- | --------- | ---------- |
| `name`         | string    | 姓名（唯一）     |
| `company`      | string    | 所在公司       |
| `title`        | string    | 职位         |
| `phone`        | string    | 电话         |
| `email`        | string    | 邮箱         |
| `wechat`       | string    | 微信         |
| `hometown`     | string    | 籍贯/老家      |
| `school`       | string    | 毕业院校       |
| `major`        | string    | 专业         |
| `industry`     | string    | 行业         |
| `city`         | string    | 所在城市       |
| `closeness`    | number    | 亲疏度 (1-10) |
| `tags`         | string\[] | 标签数组       |
| `note`         | string    | 备注         |
| `created_at`   | string    | 创建时间       |
| `updated_at`   | string    | 更新时间       |
| `last_contact` | string    | 最近联系时间     |

### Company 节点属性

| 属性         | 类型     | 说明       |
| ---------- | ------ | -------- |
| `name`     | string | 公司名称（唯一） |
| `industry` | string | 行业       |
| `business` | string | 业务范围     |
| `city`     | string | 所在城市     |
| `note`     | string | 备注       |

### Resource 节点属性

| 属性           | 类型       | 说明 |
|--------------|----------|------|
| `rid`        | string   | 资源唯一 ID |
| `name`       | string   | 资源名称 |
| `category`   | string   | 资源类别（如：渠道/人才/资金/媒体/供应链/客户等） |
| `description`| string   | 资源描述 |
| `contact`    | string   | 对接人/联系方式 |
| `link`       | string   | 链接（可选） |
| `tags`       | string[] | 标签 |
| `note`       | string   | 备注 |
| `created_at` | string   | 创建时间 |
| `updated_at` | string   | 更新时间 |

### 关系类型

- `好友` - 朋友关系
- `配偶` - 夫妻关系
- `父子/母子` - 亲子关系
- `兄弟姐妹` - 兄弟姐妹
- `创始人` - 创办公司
- `WORKS_AT` - 工作关系
- `HAS_RESOURCE` - 资源归属（Person/Company -> Resource）
- `同学` - 同学关系
- `同事` - 同事关系
- 自定义关系类型

## 完整示例

```bash
# 1. 初始化
npx contact-graph init

# 2. 添加张三
npx contact-graph add "张三" \
  --company "ABC科技" \
  --title "CEO" \
  --phone "13800138001" \
  --hometown "北京" \
  --school "清华大学" \
  --tags "核心,创始人"

# 3. 添加李四
npx contact-graph add "李四" \
  --company "XYZ集团" \
  --title "总监" \
  --phone "13800138002" \
  --hometown "上海" \
  --school "北京大学"

# 4. 建立好友关系
npx contact-graph rel "张三" "李四" \
  --type "好友" \
  --strength 9 \
  --source "大学同学" \
  --since "2010-09-01"

# 5. 添加互动记录
npx contact-graph note "张三" "2024-01-15 一起吃饭，聊到合作项目"
npx contact-graph note "李四" "2024-02-20 电话沟通，确认合作细节"

# 6. 为张三补充资源
npx contact-graph add-resource-person "张三" "渠道资源" \
  --category "渠道" \
  --desc "可引荐若干 ToB 客户" \
  --tags "BD,合作"

# 7. 查看张三的资源列表
npx contact-graph resources "张三" --type person

# 8. 查看张三的关系网络
npx contact-graph net "张三"

# 9. 查看久未联系的人
npx contact-graph need-contact 30
```

## License

MIT
