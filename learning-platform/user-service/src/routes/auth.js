const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';
const JWT_EXPIRE = `${process.env.JWT_EXPIRE_MINUTES || 1440}m`;

const generateToken = (user) =>
  jwt.sign({ sub: user._id.toString(), email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, password, firstName, lastName, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ error: 'Email already registered' });

    const user = new User({ email, password, firstName, lastName, role: role || 'student' });
    await user.save();
    const token = generateToken(user);

    res.status(201).json({ message: 'User registered successfully', token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and get JWT
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ error: 'Account deactivated' });

    const isValid = await user.comparePassword(password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    res.json({ message: 'Login successful', token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (clear refresh token)
 */
router.post('/logout', require('../middleware/auth'), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.sub, { refreshToken: null });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;
