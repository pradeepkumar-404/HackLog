import express from 'express';
import ReconData from '../models/ReconData.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

const withId = (obj) => ({ ...obj.toJSON(), id: obj.id, _id: obj.id });

router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const data = await ReconData.findAll({
      where: { projectId },
      order: [['type', 'ASC'], ['value', 'ASC']],
    });
    res.json(data.map(withId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const recon = await ReconData.findByPk(req.params.id);
    if (!recon) return res.status(404).json({ error: 'Not found' });
    res.json(withId(recon));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const entry = await ReconData.create(req.body);
    await logActivity(entry.projectId, 'recon_created', `${entry.type}: "${entry.value}"`);
    res.json(withId(entry));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const entry = await ReconData.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Not found' });
    const oldValue = entry.value;
    await entry.update(req.body);
    if (oldValue !== entry.value) {
      await logActivity(entry.projectId, 'recon_updated', `${entry.type}: "${oldValue}" → "${entry.value}"`);
    } else {
      await logActivity(entry.projectId, 'recon_updated', `${entry.type}: "${entry.value}" updated`);
    }
    res.json(withId(entry));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const entry = await ReconData.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Not found' });
    const projectId = entry.projectId;
    const desc = `${entry.type}: "${entry.value}"`;
    await entry.destroy();
    await logActivity(projectId, 'recon_deleted', `${desc} deleted`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;