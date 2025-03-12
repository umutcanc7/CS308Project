// ResetPassword.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// import "./ResetPassword.css"; // Optional: add CSS if needed

function ResetPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Dummy check: In a real app, you'd check if the email exists.
    setMessage(`If an account with the email ${email} exists, password reset instructions have been sent.`);

    setTimeout(() => {
        navigate("/");
      }, 2000);
    };

  return (
    <div className="reset-password-container">
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Submit</button>
      </form>
      <div>
        {message}
      </div>
    </div>
  );
}

export default ResetPassword;