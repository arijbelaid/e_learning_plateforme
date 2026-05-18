const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

/**
 * GET /api/users
 * List users (admin only)
 */
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = search ? { $or: [{ email: new RegExp(search, 'i') }, { firstName: new RegExp(search, 'i') }] } : {};
    const users = await User.find(query).limit(+limit).skip((+page - 1) * +limit).sort({ createdAt: -1 });
    const total = await User.countDocuments(query);
    res.json({ users, total, page: +page, pages: Math.ceil(total / +limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/users/:id
 * Get user profile by ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * PUT /api/users/:id
 * Update user profile
 */
router.put('/:id', auth, [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('bio').optional().isLength({ max: 500 }),
], async (req, res) => {
  if (req.user.sub !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { firstName, lastName, bio, avatar, preferences } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { firstName, lastName, bio, avatar, preferences } },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/users/:id
 * Deactivate user (admin only)
 */
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

module.exports = router;
