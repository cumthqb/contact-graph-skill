import neo4j, { Driver, Session, QueryResult } from 'neo4j-driver';

export interface PersonNode {
  name: string;
  type: 'person';
  company?: string;
  title?: string;
  phone?: string;
  email?: string;
  wechat?: string;
  hometown?: string;
  industry?: string;
  city?: string;
  note?: string;
  closeness?: number;
  tags?: string[];
  major?: string;
  age?: number;
  school?: string;
  created_at?: string;
  updated_at?: string;
  last_contact?: string;
  interactions?: Array<{ date: string; note: string }>;
}

export interface CompanyNode {
  name: string;
  type: 'company';
  industry?: string;
  business?: string;
  city?: string;
  note?: string;
  created_at?: string;
}

export interface Relationship {
  from: string;
  to: string;
  type: string;
  relation_type?: string;
  strength?: number;
  since?: string;
  source?: string;
  note?: string;
  title?: string;
}

export interface DBStats {
  总人数: number;
  公司数: number;
  人脉关系数: number;
  总连接数: number;
}

export class ContactGraphDB {
  private driver: Driver;
  private uri: string;
  private auth: { username: string; password: string };

  constructor(
    uri?: string,
    username?: string,
    password?: string
  ) {
    this.uri = uri || process.env.CONTACT_GRAPH_NEO4J_URI || 'bolt://localhost:7687';
    this.auth = {
      username: username || process.env.CONTACT_GRAPH_NEO4J_USERNAME || 'neo4j',
      password: password || process.env.CONTACT_GRAPH_NEO4J_PASSWORD || ''
    };
    this.driver = neo4j.driver(this.uri, neo4j.auth.basic(this.auth.username, this.auth.password));
  }

  async close(): Promise<void> {
    await this.driver.close();
  }

  async verifyConnectivity(): Promise<boolean> {
    try {
      await this.driver.verifyConnectivity();
      return true;
    } catch {
      return false;
    }
  }

  async initConstraints(): Promise<void> {
    const session = this.driver.session();
    try {
      // Create constraints
      await session.run(`
        CREATE CONSTRAINT person_name IF NOT EXISTS 
        FOR (p:Person) REQUIRE p.name IS UNIQUE
      `);
      await session.run(`
        CREATE CONSTRAINT company_name IF NOT EXISTS 
        FOR (c:Company) REQUIRE c.name IS UNIQUE
      `);
      console.log('✅ 约束已创建');
    } catch (error) {
      console.log('⚠️ 约束可能已存在:', error);
    } finally {
      await session.close();
    }
  }

  async addPerson(name: string, attrs: Partial<PersonNode> = {}): Promise<void> {
    const session = this.driver.session();
    const defaults: PersonNode = {
      name,
      type: 'person',
      closeness: 5,
      tags: [],
      interactions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...attrs
    };

    try {
      const props = Object.entries(defaults).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, unknown>);

      await session.run(
        `
        MERGE (p:Person {name: $name})
        SET p += $props
        RETURN p
        `,
        { name, props }
      );
      console.log(`✅ 已添加/更新: ${name}`);
    } finally {
      await session.close();
    }
  }

  async addCompany(name: string, attrs: Partial<CompanyNode> = {}): Promise<void> {
    const session = this.driver.session();
    const defaults: CompanyNode = {
      name,
      type: 'company',
      created_at: new Date().toISOString(),
      ...attrs
    };

    try {
      const props = Object.entries(defaults).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, unknown>);

      await session.run(
        `
        MERGE (c:Company {name: $name})
        SET c += $props
        RETURN c
        `,
        { name, props }
      );
      console.log(`✅ 已添加/更新公司: ${name}`);
    } finally {
      await session.close();
    }
  }

  async addRelationship(
    person1: string,
    person2: string,
    attrs: { relation_type?: string; strength?: number; since?: string; source?: string; note?: string } = {}
  ): Promise<void> {
    const session = this.driver.session();
    const relType = (attrs.relation_type || '朋友').toUpperCase().replace(/\s+/g, '_');

    try {
      await session.run(
        `
        MATCH (p1:Person {name: $name1})
        MATCH (p2:Person {name: $name2})
        MERGE (p1)-[r:${relType}]->(p2)
        SET r += $props
        RETURN r
        `,
        {
          name1: person1,
          name2: person2,
          props: {
            relation_type: attrs.relation_type || '朋友',
            strength: attrs.strength || 5,
            since: attrs.since || new Date().toISOString().split('T')[0],
            source: attrs.source,
            note: attrs.note
          }
        }
      );
      console.log(`✅ 已添加关系: ${person1} - ${attrs.relation_type || '朋友'} - ${person2}`);
    } catch (error) {
      console.log(`❌ 添加关系失败: ${error}`);
    } finally {
      await session.close();
    }
  }

  async worksAt(
    person: string,
    company: string,
    title: string = '',
    since: string = ''
  ): Promise<void> {
    const session = this.driver.session();

    try {
      // Ensure company exists
      await this.addCompany(company);

      await session.run(
        `
        MATCH (p:Person {name: $person})
        MATCH (c:Company {name: $company})
        MERGE (p)-[r:WORKS_AT]->(c)
        SET r.title = $title, r.since = $since
        RETURN r
        `,
        {
          person,
          company,
          title: title || '在职',
          since: since || new Date().toISOString().split('T')[0]
        }
      );
      console.log(`✅ 已添加工作关系: ${person} @ ${company}`);
    } catch (error) {
      console.log(`❌ 添加工作关系失败: ${error}`);
    } finally {
      await session.close();
    }
  }

  async addInteraction(person: string, note: string, date?: string): Promise<void> {
    const session = this.driver.session();
    const interactionDate = date || new Date().toISOString().split('T')[0];

    try {
      await session.run(
        `
        MATCH (p:Person {name: $name})
        SET p.interactions = CASE 
          WHEN p.interactions IS NULL THEN [$interaction]
          ELSE p.interactions + $interaction
        END,
        p.last_contact = $date,
        p.updated_at = $now
        RETURN p
        `,
        {
          name: person,
          interaction: JSON.stringify({ date: interactionDate, note }),
          date: interactionDate,
          now: new Date().toISOString()
        }
      );
      console.log(`✅ 已添加互动记录: ${person}`);
    } catch (error) {
      console.log(`❌ 添加互动记录失败: ${error}`);
    } finally {
      await session.close();
    }
  }

  async find(name: string): Promise<PersonNode | null> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        'MATCH (p:Person {name: $name}) RETURN p',
        { name }
      );
      const record = result.records[0];
      return record ? (record.get('p').properties as PersonNode) : null;
    } finally {
      await session.close();
    }
  }

  async search(keyword: string): Promise<PersonNode[]> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (p:Person)
        WHERE p.name CONTAINS $keyword
           OR p.company CONTAINS $keyword
           OR p.title CONTAINS $keyword
           OR p.note CONTAINS $keyword
           OR ANY(tag IN p.tags WHERE tag CONTAINS $keyword)
        RETURN p
        ORDER BY p.name
        `,
        { keyword }
      );
      return result.records.map(r => r.get('p').properties as PersonNode);
    } finally {
      await session.close();
    }
  }

  async getRelations(name: string): Promise<Array<{ name: string; type: string; relation: unknown }>> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (p:Person {name: $name})-[r]-(other)
        RETURN other.name AS name, other.type AS type, r AS relation, type(r) AS relType
        `,
        { name }
      );
      return result.records.map(r => ({
        name: r.get('name'),
        type: r.get('type'),
        relation: r.get('relation').properties
      }));
    } finally {
      await session.close();
    }
  }

  async listAll(tag?: string): Promise<PersonNode[]> {
    const session = this.driver.session();
    try {
      let query = 'MATCH (p:Person)';
      if (tag) {
        query += ' WHERE $tag IN p.tags';
      }
      query += ' RETURN p ORDER BY p.closeness DESC';

      const result = await session.run(query, tag ? { tag } : {});
      return result.records.map(r => r.get('p').properties as PersonNode);
    } finally {
      await session.close();
    }
  }

  async needContact(days: number = 30): Promise<PersonNode[]> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (p:Person)
        WHERE p.last_contact IS NULL 
           OR duration.inDays(date(p.last_contact), date()).days > $days
        RETURN p
        ORDER BY p.closeness DESC
        `,
        { days }
      );
      return result.records.map(r => r.get('p').properties as PersonNode);
    } finally {
      await session.close();
    }
  }

  async stats(): Promise<DBStats> {
    const session = this.driver.session();
    try {
      const personCount = await session.run('MATCH (p:Person) RETURN count(p) AS count');
      const companyCount = await session.run('MATCH (c:Company) RETURN count(c) AS count');
      const totalEdges = await session.run('MATCH ()-[r]->() RETURN count(r) AS count');
      const personEdges = await session.run(
        'MATCH (p1:Person)-[r]-(p2:Person) RETURN count(r) AS count'
      );

      return {
        总人数: personCount.records[0].get('count').toNumber(),
        公司数: companyCount.records[0].get('count').toNumber(),
        人脉关系数: personEdges.records[0].get('count').toNumber(),
        总连接数: totalEdges.records[0].get('count').toNumber()
      };
    } finally {
      await session.close();
    }
  }

  async delete(name: string): Promise<void> {
    const session = this.driver.session();
    try {
      await session.run(
        `
        MATCH (p:Person {name: $name})
        OPTIONAL MATCH (p)-[r]-()
        DELETE r, p
        `,
        { name }
      );
      console.log(`✅ 已删除: ${name}`);
    } catch (error) {
      console.log(`❌ 删除失败: ${error}`);
    } finally {
      await session.close();
    }
  }

  async exportCypher(): Promise<string> {
    const session = this.driver.session();
    const lines: string[] = [];

    try {
      // Export persons
      const persons = await session.run('MATCH (p:Person) RETURN p');
      persons.records.forEach(r => {
        const p = r.get('p');
        const props = Object.entries(p.properties)
          .filter(([k, v]) => k !== 'type' && k !== 'interactions' && v !== undefined && v !== null)
          .map(([k, v]) => `${k}: '${String(v).replace(/'/g, "\\'")}'`)
          .join(', ');
        const varName = p.properties.name.replace(/[^a-zA-Z0-9]/g, '_');
        lines.push(`CREATE (${varName}:Person {${props}})`);
      });

      // Export companies
      const companies = await session.run('MATCH (c:Company) RETURN c');
      companies.records.forEach(r => {
        const c = r.get('c');
        const props = Object.entries(c.properties)
          .filter(([k, v]) => k !== 'type' && v !== undefined && v !== null)
          .map(([k, v]) => `${k}: '${String(v).replace(/'/g, "\\'")}'`)
          .join(', ');
        const varName = c.properties.name.replace(/[^a-zA-Z0-9]/g, '_');
        lines.push(`CREATE (${varName}:Company {${props}})`);
      });

      // Export relationships
      const rels = await session.run('MATCH (a)-[r]->(b) RETURN a, r, b, type(r) AS relType');
      rels.records.forEach(r => {
        const a = r.get('a').properties.name.replace(/[^a-zA-Z0-9]/g, '_');
        const b = r.get('b').properties.name.replace(/[^a-zA-Z0-9]/g, '_');
        const relType = r.get('relType');
        const rel = r.get('r');
        const props = Object.entries(rel.properties)
          .filter(([k, v]) => v !== undefined && v !== null)
          .map(([k, v]) => `${k}: '${String(v).replace(/'/g, "\\'")}'`)
          .join(', ');
        
        if (props) {
          lines.push(`CREATE (${a})-[:${relType} {${props}}]->(${b})`);
        } else {
          lines.push(`CREATE (${a})-[:${relType}]->(${b})`);
        }
      });

      return lines.join('\n');
    } finally {
      await session.close();
    }
  }
}

export default ContactGraphDB;
