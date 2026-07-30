import express from 'express';
import { body, param } from 'express-validator';
import { ReportController } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('reportedUserId').isInt({ min: 1 }).withMessage('reportedUserId is required'),
    body('contentType')
      .isIn(['message', 'profile'])
      .withMessage('contentType must be either message or profile'),
    body('contentId').optional().isString().withMessage('contentId must be a string'),
    body('content').optional().isString().isLength({ max: 5000 }).withMessage('content must be a string up to 5000 characters'),
    body('reason').optional().isString().isLength({ max: 500 }).withMessage('reason must be up to 500 characters'),
    handleValidationErrors,
  ],
  ReportController.createReport
);

router.post(
  '/:id/resolve',
  [
    param('id').isString().withMessage('Valid report id is required'),
    body('status')
      .isIn(['reviewed', 'actioned', 'dismissed'])
      .withMessage('status must be reviewed, actioned, or dismissed'),
    handleValidationErrors,
  ],
  ReportController.resolveReport
);

export default router;
