import { Router } from 'express';
import { optionalAuth, requireAuth } from '../middlewares/auth.js';
import {
  getCollection,
  postCollection,
  deleteCollectionItem,
  patchWishlistItem,
  patchLibraryItem,
} from '../controllers/collectionsController.js';

const router = Router();

router.use(optionalAuth);
for (const type of ['cart', 'wishlist']) {
  router.get(`/${type}`, getCollection(type));
  router.post(`/${type}`, postCollection(type));
  router.delete(`/${type}/:gameId`, deleteCollectionItem(type));
}
// A biblioteca só pode ser consultada ou atualizada quanto ao registro de execução.
// Não existe POST /library: a inclusão ocorre exclusivamente em placeOrder().
router.get('/library', requireAuth, getCollection('library'));
router.patch('/library/:gameId', requireAuth, patchLibraryItem);
router.patch('/wishlist/:gameId', patchWishlistItem);

export default router;
