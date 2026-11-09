import { Router } from 'express';
import { getGames, getGame } from '../controllers/gamesController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(getGames));
router.get('/:identifier', asyncHandler(getGame));

export default router;
