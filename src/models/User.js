const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mail_adress: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    phone_number: { type: String },

    /*
        This field stores the password reset token temporarily.
        - It allows us to invalidate the token after it's used.
        - If null, it means no active reset request exists.
    */
    resetPasswordToken: { type: String, default: null }
});

module.exports = mongoose.model("User",UserSchema);