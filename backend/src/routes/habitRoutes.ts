import { Router } from 'express';
import * as habitController from '../controllers/habitController';
import { authMiddleware } from '../middlewares/authMiddlewares';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(habitController.list));
router.post('/', asyncHandler(habitController.create));
router.put('/:id', asyncHandler(habitController.update));
router.delete('/:id', asyncHandler(habitController.remove));
router.post('/:id/toggle', asyncHandler(habitController.toggle));
router.post('/:id/relapse', asyncHandler(habitController.relapse));

export default router;
