import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authMiddleware } from '../middlewares/authMiddlewares';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/reset-password', asyncHandler(authController.resetPassword));
router.get('/me', authMiddleware, asyncHandler(authController.me));

export default router;
