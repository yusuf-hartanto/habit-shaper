import { Router } from 'express';
import * as goalController from '../controllers/goalController';
import { authMiddleware } from '../middlewares/authMiddlewares';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(goalController.list));
router.post('/', asyncHandler(goalController.create));
router.put('/:id', asyncHandler(goalController.update));
router.delete('/:id', asyncHandler(goalController.remove));

export default router;
