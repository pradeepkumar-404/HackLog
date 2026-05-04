import express from 'express';
import { Op } from 'sequelize';
import Note from '../models/Note.js';
import CalendarLog from '../models/CalendarLog.js';
import Project from '../models/Project.js';

const router = express.Router();

const withId = (obj, extra = {}) => ({ ...obj.toJSON(), id: obj.id, _id: obj.id, ...extra });

router.get('/', async (req, res) => {
  try {
    const query = req.query.q?.toLowerCase() || '';
    const type = req.query.type || 'all';

    let results = [];

    if (type === 'all' || type === 'notes') {
      const notes = await Note.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${query}%` } },
            { content: { [Op.like]: `%${query}%` } },
            { tags: { [Op.like]: `%${query}%` } }, // JSON field – might need different handling; simple text search works in SQLite
          ],
        },
        include: [{ model: Project, attributes: ['name'] }],
      });
      results.push(
        ...notes.map((n) =>
          withId(n, {
            type: 'note',
            projectName: n.Project?.name || '',
          })
        )
      );
    }

    if (type === 'all' || type === 'calendar') {
      const logs = await CalendarLog.findAll({
        where: {
          [Op.or]: [
            { notes: { [Op.like]: `%${query}%` } },
            { findings: { [Op.like]: `%${query}%` } },
            { vulnerabilities: { [Op.like]: `%${query}%` } },
            { projectName: { [Op.like]: `%${query}%` } },
          ],
        },
      });
      results.push(...logs.map((l) => withId(l, { type: 'calendar' })));
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;