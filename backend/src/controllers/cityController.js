/**
 * 城市数据控制器
 * 增删改查城市
 */
import { query } from '../config/db.js';

/** 获取当前用户的所有城市 */
export async function getCities(req, res) {
  try {
    const result = await query(
      'SELECT id, name, lat, lng, date, folder, unlocked, created_at FROM cities WHERE user_id = $1 ORDER BY created_at ASC',
      [req.user.id]
    );

    // 同时获取每个城市的照片和手账
    const citiesWithExtra = await Promise.all(
      result.rows.map(async (city) => {
        const photosResult = await query(
          'SELECT id, filename, original_name, url, created_at FROM photos WHERE city_id = $1 ORDER BY created_at ASC',
          [city.id]
        );
        const journalResult = await query(
          'SELECT id, title, weather, mood, content FROM journals WHERE city_id = $1',
          [city.id]
        );
        return {
          ...city,
          photos: photosResult.rows,
          journal: journalResult.rows[0] || null,
        };
      })
    );

    res.json({ cities: citiesWithExtra });
  } catch (err) {
    console.error('获取城市列表失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

/** 新增城市 */
export async function createCity(req, res) {
  try {
    const { name, lat, lng, date } = req.body;

    if (!name || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: '城市名称、经纬度为必填项' });
    }

    // 校验经纬度范围
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: '经纬度数值超出有效范围' });
    }

    // 自动生成 folder 名称（拼音化处理：取英文名或转换）
    const folder = `city_${Date.now()}`;

    const result = await query(
      'INSERT INTO cities (user_id, name, lat, lng, date, folder) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, name, lat, lng, date || '', folder]
    );

    const city = result.rows[0];

    res.status(201).json({
      message: '城市添加成功',
      city: { ...city, photos: [], journal: null },
    });
  } catch (err) {
    console.error('添加城市失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

/** 更新城市信息 */
export async function updateCity(req, res) {
  try {
    const { id } = req.params;
    const { name, lat, lng, date } = req.body;

    // 验证城市属于当前用户
    const check = await query('SELECT id FROM cities WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: '城市不存在或无权限' });
    }

    const result = await query(
      'UPDATE cities SET name = COALESCE($1, name), lat = COALESCE($2, lat), lng = COALESCE($3, lng), date = COALESCE($4, date), updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, lat, lng, date, id]
    );

    res.json({ message: '城市更新成功', city: result.rows[0] });
  } catch (err) {
    console.error('更新城市失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

/** 删除城市 */
export async function deleteCity(req, res) {
  try {
    const { id } = req.params;

    const check = await query('SELECT id FROM cities WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: '城市不存在或无权限' });
    }

    await query('DELETE FROM cities WHERE id = $1', [id]);

    res.json({ message: '城市已删除' });
  } catch (err) {
    console.error('删除城市失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
}
