import express from 'express';
import { Op } from 'sequelize';
import Payload from '../models/Payload.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

const withId = (obj) => ({ ...obj.toJSON(), id: obj.id, _id: obj.id });

router.get('/', async (req, res) => {
  try {
    const { projectId } = req.query;
    const where = { [Op.or]: [{ projectId: null }] };
    if (projectId) where[Op.or].push({ projectId });
    const payloads = await Payload.findAll({
      where,
      order: [['category', 'ASC'], ['name', 'ASC']],
    });
    res.json(payloads.map(withId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const payload = await Payload.findByPk(req.params.id);
    if (!payload) return res.status(404).json({ error: 'Not found' });
    res.json(withId(payload));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = await Payload.create(req.body);
    if (payload.projectId) {
      await logActivity(payload.projectId, 'payload_created', `"${payload.name}" (${payload.category})`);
    }
    res.json(withId(payload));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const payload = await Payload.findByPk(req.params.id);
    if (!payload) return res.status(404).json({ error: 'Not found' });

    const oldCategory = payload.category;
    await payload.update(req.body);

    if (payload.projectId) {
      let details = `"${payload.name}" updated`;
      if (oldCategory !== payload.category) {
        details = `"${payload.name}" category changed from ${oldCategory} to ${payload.category}`;
      }
      await logActivity(payload.projectId, 'payload_updated', details);
    }
    res.json(withId(payload));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const payload = await Payload.findByPk(req.params.id);
    if (!payload) return res.status(404).json({ error: 'Not found' });
    const projectId = payload.projectId;
    const name = payload.name;
    await payload.destroy();
    if (projectId) {
      await logActivity(projectId, 'payload_deleted', `"${name}" deleted`);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;