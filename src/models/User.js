const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mail_adress: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    phone_number: { type: String }
});

module.exports = mongoose.model("User", UserSchema);