import Database from "better-sqlite3"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, "..", "..", "dream_travel.db")
const db = new Database(dbPath)

db.pragma("journal_mode = WAL")
db.pragma("foreign_keys = ON")

/**
 * 统一 SQL 查询函数
 * 支持 PostgreSQL 风格的 $1, $2 占位符，自动转换为 SQLite 的 ? 占位符
 * 自动处理 INSERT ... RETURNING
 */
export function query(text, params = []) {
  // PostgreSQL $1, $2 占位符 -> SQLite ?
  const sqlText = text.replace(/\$(\d+)/g, "?")

  const trimmed = sqlText.trim()
  const isInsert = /^INSERT/i.test(trimmed)
  const isReturning = /\bRETURNING\b/i.test(sqlText)

  if (isInsert && isReturning) {
    const match = sqlText.match(/INSERT\s+INTO\s+(\w+)/i)
    const tableName = match ? match[1] : null

    const insertSql = sqlText.replace(/\s+RETURNING\s+.+$/i, "")
    const stmt = db.prepare(insertSql)
    const result = stmt.run(...params)

    if (tableName) {
      const returnCols = sqlText.match(/RETURNING\s+(.+)$/i)?.[1] || "*"
      const selectStmt = db.prepare(`SELECT ${returnCols} FROM ${tableName} WHERE rowid = ?`)
      const rows = selectStmt.all(result.lastInsertRowid)
      return { rows }
    }
    return { rows: [{ id: Number(result.lastInsertRowid) }] }
  }

  const stmt = db.prepare(sqlText)
  const rows = stmt.all(...params)
  return { rows }
}

export default db
