/**
 * Unified Parking Service
 * Combines ParkingLevels + ParkingSpots into one coherent module.
 * Exposes:
 *   - listLevels()         → levels with spot-count stats
 *   - getLevelSpots()      → all spots for a level
 *   - createLevel()        → create level + auto-generate spots
 *   - updateLevel()        → update level metadata
 *   - deleteLevel()        → delete level (cascades spots)
 *   - updateSpotStatus()   → change a spot's status directly
 *   - recommendSpot()      → next available spot(s), ordered A→B→C
 */
const { AppError } = require('../../utils/AppError');
const { parsePagination, paginationMeta } = require('../../utils/pagination');
const levelRepo = require('../parking-levels/parking-level.repository');
const levelService = require('../parking-levels/parking-level.service');
const spotRepo = require('../parking-spots/parking-spot.repository');

async function listLevels(queryParams) {
  const { page, limit, offset } = parsePagination(queryParams);
  const { rows, total } = await levelRepo.list({
    offset,
    limit,
    search: queryParams.search || undefined,
  });
  return { items: rows, meta: paginationMeta({ page, limit, total }) };
}

async function getLevelSpots(levelId) {
  const level = await levelRepo.findById(levelId);
  if (!level) throw new AppError('Parking level not found', 404, 'NOT_FOUND');
  const spots = await spotRepo.listByLevel(levelId);
  return { level, spots };
}

async function createLevel(body) {
  return levelService.create(body);
}

async function updateLevel(id, body) {
  return levelService.update(id, body);
}

async function deleteLevel(id) {
  return levelService.remove(id);
}

async function generateSpotsForLevel(levelId) {
  const inserted = await levelService.generateSpots(levelId);
  const level = await levelRepo.findById(levelId);
  return { level, generated: inserted };
}

async function updateSpotStatus(spotId, status) {
  const spot = await spotRepo.findById(spotId);
  if (!spot) throw new AppError('Parking spot not found', 404, 'NOT_FOUND');

  const ALLOWED_MANUAL = ['available', 'maintenance'];
  if (!ALLOWED_MANUAL.includes(status)) {
    throw new AppError(
      `Manual status change only allows: ${ALLOWED_MANUAL.join(', ')}. "occupied" and "reserved" are set automatically by sessions/subscriptions.`,
      400,
      'INVALID_STATUS'
    );
  }
  return spotRepo.update(spotId, { status });
}

async function recommendSpot(excludeIds = []) {
  const ids = Array.isArray(excludeIds)
    ? excludeIds.map(Number).filter(Boolean)
    : [];
  const spots = await spotRepo.findRecommendedAvailable(ids);
  return spots;
}

module.exports = {
  listLevels,
  getLevelSpots,
  createLevel,
  updateLevel,
  deleteLevel,
  generateSpotsForLevel,
  updateSpotStatus,
  recommendSpot,
};
