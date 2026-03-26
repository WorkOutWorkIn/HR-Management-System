import { Router } from 'express';
import auditTrailRoutes from '../modules/audit-trail/audit-trail.routes.js';
import healthRoutes from './health.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import employeesRoutes from '../modules/employees/employees.routes.js';
import leaveRoutes from '../modules/leave/leave.routes.js';
import orgChartRoutes from '../modules/org-chart/org-chart.routes.js';
import payrollRoutes from '../modules/payroll/payroll.routes.js';
import performanceReviewsRoutes from '../modules/performance/performance-reviews.routes.js';
import profileRoutes from '../modules/profile/profile.routes.js';
import reviewPeriodsRoutes from '../modules/performance/review-periods.routes.js';
import salaryRoutes from '../modules/salary/salary.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/audit-trail', auditTrailRoutes);
router.use('/auth', authRoutes);
router.use('/employees', employeesRoutes);
router.use('/profile', profileRoutes);
router.use('/leave-requests', leaveRoutes);
router.use('/org-chart', orgChartRoutes);
router.use('/review-periods', reviewPeriodsRoutes);
router.use('/performance-reviews', performanceReviewsRoutes);
router.use('/salary', salaryRoutes);
router.use('/payroll', payrollRoutes);

export default router;
