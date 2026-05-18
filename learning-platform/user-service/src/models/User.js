const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  username: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
  avatar: { type: String },
  bio: { type: String, maxlength: 500 },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  enrolledCourses: [{ type: Number }],
  createdCourses: [{ type: Number }],
  preferences: {
    language: { type: String, default: 'fr' },
    notifications: { type: Boolean, default: true },
  },
  lastLogin: { type: Date },
  refreshToken: { type: String },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
