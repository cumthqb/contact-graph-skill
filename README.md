# contact-graph-skill

OpenClaw Skill：基于 Neo4j 的人脉关系图数据库管理工具（CLI + TypeScript SDK）。

## 功能

- 管理联系人与公司信息
- 建立人与人/人与公司的关系（含 WORKS_AT）
- 记录互动记录、查询关系网络、导出 Cypher

## 快速开始

```bash
npm install
npm run build
```

配置环境变量（密码必须配置）：

- CONTACT_GRAPH_NEO4J_URI（默认：bolt://localhost:7687）
- CONTACT_GRAPH_NEO4J_USERNAME（默认：neo4j）
- CONTACT_GRAPH_NEO4J_PASSWORD（必须配置）

示例：

```bash
export CONTACT_GRAPH_NEO4J_URI="bolt://localhost:7687"
export CONTACT_GRAPH_NEO4J_USERNAME="neo4j"
export CONTACT_GRAPH_NEO4J_PASSWORD="CHANGE_ME"
```

## CLI

初始化数据库：

```bash
npx contact-graph init
```

添加联系人：

```bash
npx contact-graph add "张三" --company "ABC科技" --title "技术总监"
```

更多命令与示例见 [SKILL.md](file:///Users/hanqingbin/Documents/Workspace/skills/contact-graph-skill/SKILL.md)。

## 安全与隐私

- 不要将真实人脉数据、Neo4j 密码或连接信息提交到仓库/Issue/日志
- 建议为该工具创建专用 Neo4j 用户并最小化权限

