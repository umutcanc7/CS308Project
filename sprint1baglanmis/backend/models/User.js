// models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mail_adress: { type: String, required: true, unique: true },
  phone_number: { type: String, required: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

module.exports = User;