import React, { useState, useContext } from 'react';
import $ from 'jquery';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import UserContext from '../UserContext/UserContext';

const LOGIN_URL = "/login";

function LoginForm({ onLogin }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { setUserId } = useContext(UserContext);
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

  const handleSubmit = (e) => {
    e.preventDefault();
  
    const deferred = $.Deferred();

    if (validateForm()) {
      api.post(LOGIN_URL, formData)
        .then(response => {
          if (response.data.success) {
            localStorage.setItem('jwtToken', response.data.token);
            return api.get('/getid', { params: { username: formData.username } });
          } else {
            deferred.reject(new Error('Invalid credentials'));
          }
        })
        .then(userIdResponse => {
          const userId = userIdResponse.data.userId;
          setLoginSuccess(true);
          setFormData({ username: '', password: '' }); // Clear form data
          setErrors({}); // Clear errors
          onLogin(userId);
          setUserId(userId);
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
          deferred.resolve();
        })
        .catch(error => {
          console.error('Login Error:', error);
          setErrors({ general: 'An error occurred. Please try again later.' });
          deferred.reject(error);
        });
    }

    return deferred.promise();
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
