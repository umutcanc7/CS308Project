import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from './Menu';
import './ProfilePage.css';
import { useCart } from './CartContext';

function ProfilePage({ isSignedIn, signOut, openModal }) {
  const navigate = useNavigate();
  const { getTotalItems, clearCart } = useCart();
  const [wishlistCount, setWishlistCount] = useState(0);
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState({...userInfo});

  // Add function to fetch wishlist count
  const fetchWishlistCount = async () => {
    if (!isSignedIn) {
      setWishlistCount(0);
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5001/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setWishlistCount(data.data.length);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
  };

  useEffect(() => {
    fetchWishlistCount();
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      signOut();
      return;
    }

    // Fetch user information
    fetch('http://localhost:5001/user/profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUserInfo(data.data);
          setEditedInfo(data.data);
        }
      })
      .catch(console.error);
  }, [navigate, isSignedIn, signOut]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedInfo({...userInfo});
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5001/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editedInfo)
      });
      
      const data = await response.json();
      if (data.success) {
        setUserInfo(editedInfo);
        setIsEditing(false);
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="profile-page">
      <Menu />

      {/* Navigation Bar */}
      <div className="auth-links">
        {isSignedIn ? (
          <>
            <div className="auth-button" onClick={() => navigate("/wishlist")}>
              ❤️ Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
            </div>

            <div className="auth-button" onClick={() => navigate("/cart")}>
              🛒 Cart {getTotalItems() > 0 && `(${getTotalItems()})`}
            </div>

            <div className="auth-button" onClick={() => navigate("/profile")}>
              👤 Profile
            </div>

            <div className="auth-button" onClick={() => navigate("/purchased-products")}>
              📦 My Purchases
            </div>

            <div className="auth-button signout-button" onClick={() => { signOut(); clearCart(); }}>
              🚪 Sign Out
            </div>
          </>
        ) : (
          <>
            <div className="auth-button" onClick={() => navigate("/cart")}>
              🛒 Cart {getTotalItems() > 0 && `(${getTotalItems()})`}
            </div>
            <div className="auth-button" onClick={() => openModal("login")}>
              🔐 Login / Sign Up
            </div>
          </>
        )}
      </div>

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
                <button className="save-button" onClick={handleSave}>Save</button>
                <button className="cancel-button" onClick={handleCancel}>Cancel</button>
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
                <p>{userInfo.phoneNumber || 'Not provided'}</p>
              </div>
              <div className="info-group">
                <label>Address:</label>
                <p>{userInfo.address || 'Not provided'}</p>
              </div>
              <button className="edit-button" onClick={handleEdit}>Edit Profile</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage; 