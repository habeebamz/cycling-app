
import { Router } from 'express';
import { createReport, getReports, updateReportStatus, deletePostByReport } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, createReport);
router.get('/', authenticate, getReports);
router.patch('/:id/status', authenticate, updateReportStatus);
router.delete('/:id/post', authenticate, deletePostByReport);

export default router;
