/**
 * 照片上传控制器
 */
import { query } from '../config/db.js';
import { compressAndSave } from '../middleware/upload.js';
import fs from 'fs';
import path from 'path';

/** 上传照片（可批量） */
export async function uploadPhotos(req, res) {
  try {
    const { cityId } = req.body;

    if (!cityId) {
      return res.status(400).json({ error: '缺少城市ID' });
    }

    // 验证城市属于当前用户
    const check = await query('SELECT id, folder FROM cities WHERE id = $1 AND user_id = $2', [cityId, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: '城市不存在或无权限' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '请选择要上传的图片' });
    }

    const savedPhotos = [];

    for (const file of req.files) {
      // 压缩并保存到子目录
      const url = await compressAndSave(file, `city_${cityId}`);
      const filename = path.basename(url);

      const result = await query(
        'INSERT INTO photos (city_id, filename, original_name, url) VALUES ($1, $2, $3, $4) RETURNING *',
        [cityId, filename, file.originalname, url]
      );

      savedPhotos.push(result.rows[0]);
    }

    res.status(201).json({
      message: `成功上传 ${savedPhotos.length} 张照片`,
      photos: savedPhotos,
    });
  } catch (err) {
    console.error('上传照片失败:', err);
    res.status(500).json({ error: '上传失败: ' + err.message });
  }
}

/** 获取城市的所有照片 */
export async function getPhotos(req, res) {
  try {
    const { cityId } = req.params;

    // 验证城市
    const check = await query('SELECT id FROM cities WHERE id = $1 AND user_id = $2', [cityId, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: '城市不存在或无权限' });
    }

    const result = await query(
      'SELECT id, filename, original_name, url, created_at FROM photos WHERE city_id = $1 ORDER BY created_at ASC',
      [cityId]
    );

    res.json({ photos: result.rows });
  } catch (err) {
    console.error('获取照片失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

/** 删除照片 */
export async function deletePhoto(req, res) {
  try {
    const { id } = req.params;

    // 查找照片，验证归属
    const photoResult = await query(
      'SELECT p.id, p.url, p.city_id FROM photos p JOIN cities c ON p.city_id = c.id WHERE p.id = $1 AND c.user_id = $2',
      [id, req.user.id]
    );

    if (photoResult.rows.length === 0) {
      return res.status(404).json({ error: '照片不存在或无权限' });
    }

    const photo = photoResult.rows[0];

    // 删除物理文件
    const filePath = path.join(process.env.UPLOAD_DIR || './uploads', photo.url.replace('/uploads/', ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await query('DELETE FROM photos WHERE id = $1', [id]);

    res.json({ message: '照片已删除' });
  } catch (err) {
    console.error('删除照片失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
}
