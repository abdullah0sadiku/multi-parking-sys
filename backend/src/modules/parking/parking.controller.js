const service = require('./parking.service');

async function listLevels(req, res, next) {
  try {
    const result = await service.listLevels(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getLevelSpots(req, res, next) {
  try {
    const result = await service.getLevelSpots(Number(req.params.levelId));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function createLevel(req, res, next) {
  try {
    const level = await service.createLevel(req.body);
    res.status(201).json({ success: true, data: level });
  } catch (err) {
    next(err);
  }
}

async function updateLevel(req, res, next) {
  try {
    const level = await service.updateLevel(Number(req.params.levelId), req.body);
    res.json({ success: true, data: level });
  } catch (err) {
    next(err);
  }
}

async function deleteLevel(req, res, next) {
  try {
    await service.deleteLevel(Number(req.params.levelId));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function generateSpots(req, res, next) {
  try {
    const result = await service.generateSpotsForLevel(Number(req.params.levelId));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function updateSpotStatus(req, res, next) {
  try {
    const spot = await service.updateSpotStatus(Number(req.params.spotId), req.body.status);
    res.json({ success: true, data: spot });
  } catch (err) {
    next(err);
  }
}

async function recommendSpot(req, res, next) {
  try {
    const exclude = req.query.exclude ? String(req.query.exclude).split(',') : [];
    const spots = await service.recommendSpot(exclude);
    res.json({ success: true, data: spots });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listLevels,
  getLevelSpots,
  createLevel,
  updateLevel,
  deleteLevel,
  generateSpots,
  updateSpotStatus,
  recommendSpot,
};
