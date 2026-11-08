import {
  listCollection,
  addToCollection,
  removeFromCollection,
  moveWishlistItem,
  markGamePlayed,
} from '../services/collectionService.js';
import { toPublicCollectionEntry } from '../models/collectionEntry.js';

export function getCollection(type) {
  return (req, res) =>
    res.json({ data: listCollection(type, req.userId).map(toPublicCollectionEntry) });
}

export function postCollection(type) {
  return (req, res) => {
    const entry = addToCollection(type, req.userId, req.body.game || req.body);
    res.status(201).json({ data: toPublicCollectionEntry(entry) });
  };
}

export function deleteCollectionItem(type) {
  return (req, res) => {
    const entry = removeFromCollection(type, req.userId, req.params.gameId);
    res.json({ data: toPublicCollectionEntry(entry) });
  };
}

export function patchWishlistItem(req, res) {
  const entries = moveWishlistItem(req.userId, req.params.gameId, req.body.position);
  res.json({ data: entries.map(toPublicCollectionEntry) });
}

export function patchLibraryItem(req, res) {
  res.json({ data: toPublicCollectionEntry(markGamePlayed(req.userId, req.params.gameId)) });
}
