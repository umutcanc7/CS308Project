import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css";

function ProfilePage({ isSignedIn, signOut }) {
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    address: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState({ ...userInfo });

  useEffect(() => {
    if (!isSignedIn) {
      navigate("/");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      signOut();
      return;
    }

    const cached = localStorage.getItem("userData");
    if (cached) {
      const parsed = JSON.parse(cached);
      setUserInfo(parsed);
      setEditedInfo(parsed);
    }

    fetch("http://localhost:5001/user/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUserInfo(data.data);
          setEditedInfo(data.data);
          localStorage.setItem("userData", JSON.stringify(data.data));
        }
      })
      .catch(console.error);
  }, [navigate, isSignedIn, signOut]);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setIsEditing(false);
    setEditedInfo({ ...userInfo });
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5001/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editedInfo),
      });
      const data = await res.json();
      if (data.success) {
        setUserInfo(editedInfo);
        localStorage.setItem("userData", JSON.stringify(editedInfo));
        setIsEditing(false);
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile");
    }
  };

  const handleChange = (e) =>
    setEditedInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  if (!isSignedIn) return null;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>My Profile</h1>

        <div className="profile-content">
          {isEditing ? (
            <div className="profile-form">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={editedInfo.name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={editedInfo.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Phone Number:</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={editedInfo.phoneNumber}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Address:</label>
                <textarea
                  name="address"
                  value={editedInfo.address}
                  onChange={handleChange}
                />
              </div>

              <div className="button-group">
                <button className="save-button" onClick={handleSave}>
                  Save
                </button>
                <button className="cancel-button" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-info">
              <div className="info-group">
                <label>Name:</label>
                <p>{userInfo.name}</p>
              </div>
              <div className="info-group">
                <label>Email:</label>
                <p>{userInfo.email}</p>
              </div>
              <div className="info-group">
                <label>Phone Number:</label>
                <p>{userInfo.phoneNumber || "Not provided"}</p>
              </div>
              <div className="info-group">
                <label>Address:</label>
                <p>{userInfo.address || "Not provided"}</p>
              </div>

              <button className="edit-button" onClick={handleEdit}>
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
