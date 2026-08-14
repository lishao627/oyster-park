/**
 * 旅行手账控制器
 */
import { query } from '../config/db.js';

/** 获取城市手账 */
export async function getJournal(req, res) {
  try {
    const { cityId } = req.params;

    const check = await query('SELECT id FROM cities WHERE id = $1 AND user_id = $2', [cityId, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: '城市不存在或无权限' });
    }

    const result = await query('SELECT * FROM journals WHERE city_id = $1', [cityId]);

    res.json({ journal: result.rows[0] || null });
  } catch (err) {
    console.error('获取手账失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

/** 新增/更新手账（使用 UPSERT） */
export async function upsertJournal(req, res) {
  try {
    const { cityId } = req.params;
    const { title, weather, mood, content } = req.body;

    // 验证城市属于当前用户
    const check = await query('SELECT id FROM cities WHERE id = $1 AND user_id = $2', [cityId, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: '城市不存在或无权限' });
    }

    // UPSERT: 如果存在则更新，否则插入
    const result = await query(
      `INSERT INTO journals (city_id, title, weather, mood, content)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (city_id)
       DO UPDATE SET title = COALESCE($2, journals.title),
                     weather = COALESCE($3, journals.weather),
                     mood = COALESCE($4, journals.mood),
                     content = COALESCE($5, journals.content),
                     updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [cityId, title || '', weather || '', mood || '', content || '']
    );

    res.json({
      message: '手账保存成功',
      journal: result.rows[0],
    });
  } catch (err) {
    console.error('保存手账失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

/** 删除手账 */
export async function deleteJournal(req, res) {
  try {
    const { cityId } = req.params;

    const check = await query('SELECT id FROM cities WHERE id = $1 AND user_id = $2', [cityId, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: '城市不存在或无权限' });
    }

    await query('DELETE FROM journals WHERE city_id = $1', [cityId]);

    res.json({ message: '手账已删除' });
  } catch (err) {
    console.error('删除手账失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
}
