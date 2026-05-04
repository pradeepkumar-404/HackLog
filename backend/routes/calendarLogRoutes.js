import express from 'express';
import CalendarLog from '../models/CalendarLog.js';

const router = express.Router();

const withId = (obj) => ({ ...obj.toJSON(), id: obj.id, _id: obj.id });

router.get('/', async (req, res) => {
  try {
    const logs = await CalendarLog.findAll({ order: [['date', 'ASC']] });
    res.json(logs.map(withId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:date', async (req, res) => {
  try {
    const log = await CalendarLog.findOne({ where: { date: req.params.date } });
    res.json(log ? withId(log) : null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { date, notes, cookies, headers, projectId, projectName, findings, vulnerabilities, status } = req.body;
    const [log, created] = await CalendarLog.upsert({
      date,
      notes,
      cookies,
      headers,
      projectId,
      projectName,
      findings,
      vulnerabilities,
      status,
    });
    res.json(withId(log));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:date', async (req, res) => {
  try {
    await CalendarLog.destroy({ where: { date: req.params.date } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;