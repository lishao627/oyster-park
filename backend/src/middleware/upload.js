/**
 * 图片上传中间件
 * - 使用 multer 接收文件
 * - 使用 sharp 自动压缩图片
 * - 严格校验文件格式，禁止非图片文件上传
 */
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import sharp from 'sharp';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 允许的图片 MIME 类型
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// multer 存储配置：内存模式，方便 sharp 处理后再写入
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIMES.includes(file.mimetype) || !ALLOWED_EXT.includes(ext)) {
    return cb(new Error('仅支持 JPG/PNG/WebP/GIF 格式的图片文件'), false);
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

/**
 * 压缩并保存图片
 * @param {Object} file - multer 的文件对象
 * @param {string} subDir - 子目录名（如城市id）
 * @returns {Promise<string>} 相对 URL 路径
 */
export async function compressAndSave(file, subDir = 'general') {
  const targetDir = path.join(UPLOAD_DIR, subDir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const uniqueName = `${uuidv4()}${ext}`;
  const outputPath = path.join(targetDir, uniqueName);

  try {
    // 使用 sharp 压缩：JPEG 质量 80%，PNG 压缩级别 8，WebP 质量 80%
    if (ext === '.gif') {
      // GIF 直接保存，不做压缩（sharp 不支持动图压缩）
      fs.writeFileSync(outputPath, file.buffer);
    } else {
      await sharp(file.buffer)
        .resize({ width: 1920, withoutEnlargement: true }) // 最大宽度 1920
        .jpeg({ quality: 80, mozjpeg: true })
        .png({ compressionLevel: 8 })
        .webp({ quality: 80 })
        .toFile(outputPath);
    }

    // 返回相对 URL 路径
    return `/uploads/${subDir}/${uniqueName}`;
  } catch (err) {
    throw new Error('图片处理失败: ' + err.message);
  }
}
