import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
const LOGIN_URL = "/login";

function LoginForm() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loginSuccess, setLoginSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) {
      newErrors.username = 'Username is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (validateForm()) {
      try {
        const response = await axios.post(LOGIN_URL, formData);
        if (response.data.success) {
          setLoginSuccess(true);
          setFormData({ username: '', password: '' }); // Clear form data
          setErrors({}); // Clear errors
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          setErrors({ general: 'Invalid credentials' });
        }
      } catch (error) {
        console.error('Login Error:', error);
        setErrors({ general: 'An error occurred. Please try again later.' });
      }
    }
  };
  
  return (
    <div>
      <h2>Login</h2>
      {loginSuccess ? (
      <div className="success">Login Successful!</div>
    ) : (
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Username"
        />
        {errors.username && <div className="error">{errors.username}</div>}
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
        />
        {errors.password && <div className="error">{errors.password}</div>}
        <button type="submit">Login</button>
      </form>
    )}
    </div>
  );
}

export default LoginForm;
