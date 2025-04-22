const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  location: { type: String },
  preferences: { type: [String] }, // e.g., ["yoga", "running"]
  goals: { type: String }, // e.g., "weight loss"
  profilePicture: { type: String }, // URL to profile picture
  bio: { type: String }, // User bio
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);