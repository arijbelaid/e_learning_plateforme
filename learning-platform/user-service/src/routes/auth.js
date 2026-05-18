const router = require('express').Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_learncloud_2026';
const JWT_EXPIRE = `${process.env.JWT_EXPIRE_MINUTES || 1440}m`;

const generateToken = (user) =>
  jwt.sign({ sub: user._id.toString(), email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

// Middleware: vérifie que MongoDB est connecté avant d'exécuter la route
function requireMongo(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Service temporairement indisponible — base de données en cours de connexion. Réessayez dans quelques secondes.' });
  }
  next();
}

/**
 * POST /api/auth/register
 */
router.post('/register', requireMongo, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Données invalides', details: errors.array() });

  try {
    const { email, password, firstName, lastName, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ error: 'Cet email est déjà utilisé' });

    const user = new User({ email, password, firstName, lastName, role: role || 'student' });
    await user.save();
    const token = generateToken(user);

    res.status(201).json({ message: 'Compte créé avec succès', token, user });
  } catch (err) {
    console.error('[Register] Error:', err.message);
    if (err.code === 11000) return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', requireMongo, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Email ou mot de passe invalide' });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    if (!user.isActive) return res.status(403).json({ error: 'Compte désactivé' });

    const isValid = await user.comparePassword(password);
    if (!isValid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    res.json({ message: 'Connexion réussie', token, user });
  } catch (err) {
    console.error('[Login] Error:', err.message);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireMongo, require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', requireMongo, require('../middleware/auth'), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.sub, { refreshToken: null });
    res.json({ message: 'Déconnexion réussie' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la déconnexion' });
  }
});

module.exports = router;
