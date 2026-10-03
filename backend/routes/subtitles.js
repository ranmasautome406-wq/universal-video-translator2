import { Router } from 'express';
import { db } from '../utils/db.js';
import { requireAuth } from '../middleware/auth.js';
import { validateSegments } from '../utils/subtitles.js';

const router = Router();
router.use(requireAuth);

const ownJob = (req, res) => {
  const j = db.prepare('SELECT * FROM jobs WHERE id=? AND user_id=?').get(Number(req.params.id), req.user.id);
  if (!j) res.status(404).json({ error: 'Job not found.' });
  return j;
};

// :id is the translation job id (one subtitle track per target language).
router.get('/:id', (req, res) => {
  const j = ownJob(req, res); if (!j) return;
  const row = db.prepare('SELECT data FROM subtitles WHERE job_id=?').get(j.id);
  if (!row) return res.status(404).json({ error: 'Subtitles are not ready yet.' });
  res.json({ jobId: j.id, demo: !!j.demo, language: j.target_language, segments: JSON.parse(row.data) });
});

router.put('/:id', (req, res) => {
  const j = ownJob(req, res); if (!j) return;
  const segments = validateSegments(req.body?.segments);
  if (!segments) return res.status(400).json({ error: 'Each subtitle needs a start time, a later end time, and text.' });
  segments.sort((a, b) => a.start - b.start);
  db.prepare("INSERT INTO subtitles(job_id,data,updated_at) VALUES(?,?,datetime('now')) ON CONFLICT(job_id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at")
    .run(j.id, JSON.stringify(segments));
  res.json({ ok: true, segments });
});

export default router;
