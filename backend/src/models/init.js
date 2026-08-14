/**
 * 数据库初始化 - 启动时自动创建所有数据表
 */
import Database from "better-sqlite3"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function initDB() {
  const dbPath = path.join(__dirname, "..", "..", "dream_travel.db")
  const sqlPath = path.join(__dirname, "..", "config", "init.sql")
  const sql = fs.readFileSync(sqlPath, "utf-8")

  const db = new Database(dbPath)
  // 执行建表 SQL（多条语句同时执行）
  db.exec(sql)
  db.close()

  console.log("  ✓ 数据表创建/确认完成")
}
