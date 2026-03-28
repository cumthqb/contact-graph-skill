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

## 在 OpenClaw 中安装

OpenClaw 的 “Skill” 是一个包含 `SKILL.md` 的文件夹；而 `contact-graph` 是被 Skill 指引去调用的 CLI。也就是说：安装成 “CLI 命令” 不会自动出现在 Skill 列表里。

把本仓库克隆/放到以下任意目录即可被识别为 Skill（重启会话或刷新后生效）：

- `<workspace>/skills/contact-graph`（推荐：仅对该 workspace 生效）
- `~/.openclaw/skills/contact-graph`（全局生效）

示例：

```bash
git clone https://github.com/cumthqb/contact-graph-skill.git <workspace>/skills/contact-graph
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

更多命令与示例见 [SKILL.md](./SKILL.md)。

## 安全与隐私

- 不要将真实人脉数据、Neo4j 密码或连接信息提交到仓库/Issue/日志
- 建议为该工具创建专用 Neo4j 用户并最小化权限
