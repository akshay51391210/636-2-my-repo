const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const checkRole = require('../middleware/checkRole');
const c = require('../controllers/adminUsersController');

// Only admin
router.use(protect, checkRole('admin'));

router.get('/', c.listUsers);
router.patch('/:id/role', c.updateRole);
router.delete('/:id', c.deleteUser);

module.exports = router;
