import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  createUser,
  getCurrentUser,
  updateCurrentUser,
  removeCurrentUser,
} from '../controllers/usersController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/', asyncHandler(createUser));
router.get('/me', requireAuth, getCurrentUser);
router.patch('/:id', requireAuth, updateCurrentUser);
router.delete('/:id', requireAuth, removeCurrentUser);

export default router;
