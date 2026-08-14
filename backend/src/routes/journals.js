import { Router } from 'express';
import { getJournal, upsertJournal, deleteJournal } from '../controllers/journalController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/:cityId', getJournal);
router.put('/:cityId', upsertJournal);
router.delete('/:cityId', deleteJournal);

export default router;
