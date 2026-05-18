// ============================================================
// MongoDB Initialization Script
// Learning Platform - User Service
// ============================================================

db = db.getSiblingDB('users_db');

// Create collections with schema validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'firstName', 'lastName'],
      properties: {
        email: { bsonType: 'string', description: 'Email must be a string and is required' },
        password: { bsonType: 'string', description: 'Password must be a string and is required' },
        firstName: { bsonType: 'string' },
        lastName: { bsonType: 'string' },
        role: { enum: ['student', 'instructor', 'admin'], description: 'Role must be one of the allowed values' },
      },
    },
  },
});

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ createdAt: -1 });

// Seed admin user (password: Admin@1234)
db.users.insertOne({
  email: 'admin@learncloud.fr',
  password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewL.a2PB1R2YPsqe',
  firstName: 'Admin',
  lastName: 'Platform',
  username: 'admin',
  role: 'admin',
  isActive: true,
  isEmailVerified: true,
  enrolledCourses: [],
  createdCourses: [],
  preferences: { language: 'fr', notifications: true },
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Seed instructor
db.users.insertOne({
  email: 'instructor@learncloud.fr',
  password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewL.a2PB1R2YPsqe',
  firstName: 'Jean',
  lastName: 'Dupont',
  username: 'jean.dupont',
  role: 'instructor',
  bio: 'Expert DevOps avec 10 ans d\'expérience en entreprise.',
  isActive: true,
  isEmailVerified: true,
  enrolledCourses: [],
  createdCourses: [1, 2],
  preferences: { language: 'fr', notifications: true },
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Seed student
db.users.insertOne({
  email: 'student@learncloud.fr',
  password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewL.a2PB1R2YPsqe',
  firstName: 'Alice',
  lastName: 'Martin',
  username: 'alice.martin',
  role: 'student',
  bio: 'Étudiante en Master DevOps & Cloud.',
  isActive: true,
  isEmailVerified: true,
  enrolledCourses: [1, 3],
  createdCourses: [],
  preferences: { language: 'fr', notifications: true },
  createdAt: new Date(),
  updatedAt: new Date(),
});

print('MongoDB initialization completed. Users collection seeded.');
