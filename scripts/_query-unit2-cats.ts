import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.resolve(process.cwd(), 'dev.db'));

const cats = db.prepare(`
  SELECT c.id, c.name 
  FROM categories c 
  JOIN units u ON c.unit_id = u.id 
  WHERE u.title = 'At the zoo'
  ORDER BY c.name
`).all();

console.log(JSON.stringify(cats, null, 2));
db.close();
