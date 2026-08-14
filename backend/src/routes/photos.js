import { Router } from 'express';
import { uploadPhotos, getPhotos, deletePhoto } from '../controllers/photoController.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(authMiddleware);

// 上传照片（支持多张）
router.post('/upload', upload.array('photos', 10), uploadPhotos);

// 获取城市照片
router.get('/city/:cityId', getPhotos);

// 删除照片
router.delete('/:id', deletePhoto);

export default router;
