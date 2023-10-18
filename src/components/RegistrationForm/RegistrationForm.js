import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
const REGISTER_URL = "/register";

function RegistrationForm() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
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
        const response = await axios.post(REGISTER_URL, formData);
        if (response.status === 201) {
          setRegistrationSuccess(true);
          setTimeout(() => {
            navigate('/login');
          }, 2000); // 2-second delay to show the success message
        }
        
      } catch (error) {
        if (error.response && error.response.status === 400) {
          setErrors({ ...errors, username: 'Username already exists' });
        } else {
          console.error('Registration Error:', error);
        }
      }
    }
  };

  return (
    <div>
      <h2>Registration</h2>
    {registrationSuccess ? (
      <div className="success">Registration Successful!</div>
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
        <button type="submit">Register</button>
      </form>
    )}
    </div>
  );
}

export default RegistrationForm;
