import { Router } from 'express';
import { requireRole } from '../middleware/authMiddleware';
import { listUsers, updateUser } from '../controllers/adminUserController';

const router = Router();

// All admin user routes require admin role
router.use(requireRole('admin'));

router.get('/users', listUsers);
router.patch('/users/:id', updateUser);

export default router;
