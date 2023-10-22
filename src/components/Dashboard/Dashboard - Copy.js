import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import './Dashboard.css';

function Dashboard() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [description, setDescription] = useState('');
  const [userId, setUserId] = useState('');
  const [userRating, setUserRating] = useState(0); // User's rating for the selected image

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Retrieve the token from local storage
      const authToken = localStorage.getItem('authToken');
      console.log('Dashboard authToken:', authToken); // Add this line for debugging
  
      const response = await axios.get('/dashboard', {
        headers: {
          Authorization: `Bearer ${authToken}`, // Include the token in the request headers
        },
      });
  
      setImages(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setImages([]);
    }
  };

  const getImageUrl = (path) => {
    return `http://localhost:3001/${path.replace('\\', '/')}`;
  };

  const handleImageChange = (event) => {
    setUploadedImage(event.target.files[0]);
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('image', uploadedImage);
    formData.append('description', description);

    try {
      const authToken = localStorage.getItem('authToken');

      await axios.post('/dashboard/upload', formData, {
        headers: {
          Authorization: `Bearer ${authToken}`, // Include the token in the request headers
        },
      });

      toggleUploadModal();
      fetchData();
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const toggleUploadModal = () => {
    setUploadModalVisible(!isUploadModalVisible);
  };

  const handleRating = async (rating) => {
    console.log("Rated:", rating); // For now, it just logs the rating. You can update this function as needed.
    try {
      const authToken = localStorage.getItem('authToken');

      await axios.post('/dashboard/rate', {
        imageId: selectedImage.id,
        userId: userId,
        rating: rating,
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`, // Include the token in the request headers
        },
      });

      setUserRating(rating);
      // You may also want to update the average rating for this image in the UI.
    } catch (error) {
      console.error("Error rating image:", error);
    }
  };

  const SelectedImageModal = () => {
    return (
      <div className="dashboard-modal">
        <div className="dashboard-modal-content">
          <span className="dashboard-close-button" onClick={() => setSelectedImage(null)}>X</span>
          <h2>Selected Photo</h2>
          <img src={getImageUrl(selectedImage.image_path)} alt={selectedImage.description} />
          <p>{selectedImage.description}</p>
          <div className="rate-section">
            <span className="rate-text">Rate:</span>
            <span className="empty-star" onClick={() => handleRating(5)}>&#9734;</span>
            <span className="empty-star" onClick={() => handleRating(4)}>&#9734;</span>
            <span className="empty-star" onClick={() => handleRating(3)}>&#9734;</span>
            <span className="empty-star" onClick={() => handleRating(2)}>&#9734;</span>
            <span className="empty-star" onClick={() => handleRating(1)}>&#9734;</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="Dashboard">
      <h1>Food Gallery</h1>

      <div className="image-grid">
        {images.map((image) => (
          <div
            key={image.id}
            className="image-thumbnail"
            onClick={() => handleImageClick(image)}
          >
            <img src={getImageUrl(image.image_path)} alt={image.description} />
          </div>
        ))}
      </div>

      <button className="upload-btn" onClick={toggleUploadModal}>Upload A Photo</button>

      {isUploadModalVisible && (
        <div className="upload-modal">
          <div className="dashboard-modal-content">
            <span className="dashboard-close-button" onClick={toggleUploadModal}>X</span>
            <h2>Upload Photo</h2>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            <textarea
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
            <button onClick={handleSubmit}>Submit</button>
          </div>
        </div>
      )}

      {selectedImage && <SelectedImageModal />}
    </div>
  );
}

export default Dashboard;
