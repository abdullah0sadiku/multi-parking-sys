const { Router } = require('express');
const { z } = require('zod');
const controller = require('./parking.controller');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { validateBody, validateParams, validateQuery } = require('../../middleware/validate');

const router = Router();

const levelIdParam = z.object({ levelId: z.coerce.number().int().positive() });
const spotIdParam  = z.object({ spotId:  z.coerce.number().int().positive() });

const createLevelBody = z.object({
  name:         z.string().min(1).max(255),
  prefix:       z.string().min(1).max(10).toUpperCase(),
  floor_number: z.number().int(),
  capacity:     z.number().int().min(1).max(500),
  description:  z.string().optional().nullable(),
});

const updateLevelBody = z.object({
  name:         z.string().min(1).max(255).optional(),
  prefix:       z.string().min(1).max(10).toUpperCase().optional(),
  floor_number: z.number().int().optional(),
  capacity:     z.number().int().min(1).max(500).optional(),
  description:  z.string().optional().nullable(),
});

const updateSpotStatusBody = z.object({
  status: z.enum(['available', 'maintenance']),
});

const listQuery = z.object({
  page:   z.coerce.number().int().min(1).optional(),
  limit:  z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
});

// Levels
router.get('/',                         requireAuth, validateQuery(listQuery),            controller.listLevels);
router.post('/',                        requireAuth, requireRole('admin', 'staff'), validateBody(createLevelBody), controller.createLevel);
router.patch('/:levelId',               requireAuth, requireRole('admin', 'staff'), validateParams(levelIdParam), validateBody(updateLevelBody), controller.updateLevel);
router.delete('/:levelId',              requireAuth, requireRole('admin'),          validateParams(levelIdParam), controller.deleteLevel);

// Spots per level
router.get('/:levelId/spots',           requireAuth, validateParams(levelIdParam),        controller.getLevelSpots);
router.post('/:levelId/generate-spots', requireAuth, requireRole('admin', 'staff'), validateParams(levelIdParam), controller.generateSpots);

// Spot status update
router.patch('/spots/:spotId',          requireAuth, requireRole('admin', 'staff'), validateParams(spotIdParam), validateBody(updateSpotStatusBody), controller.updateSpotStatus);

// Spot recommendation (for subscriptions / new sessions)
router.get('/recommend-spot',           requireAuth, controller.recommendSpot);

module.exports = router;
