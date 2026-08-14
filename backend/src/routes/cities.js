import { Router } from 'express';
import { getCities, createCity, updateCity, deleteCity } from '../controllers/cityController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// 所有城市路由都需要登录验证
router.use(authMiddleware);

router.get('/', getCities);
router.post('/', createCity);
router.put('/:id', updateCity);
router.delete('/:id', deleteCity);

export default router;
