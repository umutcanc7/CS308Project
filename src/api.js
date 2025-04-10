// src/api.js, unused file (?)

const API_URL = 'http://localhost:5001'; // Backend URL

// Register User
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    // Check if the response was successful
    if (!response.ok) {
      throw new Error('Failed to register user');
    }

    // Parse JSON response
    const result = await response.json();
    return result;  // Return the response
  } catch (error) {
    console.error('Error registering user:', error);
    return { success: false, message: error.message };
  }
};

// Login User
export const loginUser = async (credentials) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error logging in user:', error);
      return { success: false, message: error.message };
    }
  };
