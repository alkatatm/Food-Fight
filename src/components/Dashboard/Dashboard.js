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

  useEffect(() => {
    // Fetch the images and also get the user_id here if possible
    async function fetchData() {
        try {
            const response = await axios.get('/dashboard');
            console.log(response.data); 
            setImages(Array.isArray(response.data) ? response.data : []);

            // You might want to set user ID here if you're fetching it along with the images
            // setUserId(response.data.userId); 
        } catch (error) {
            console.error("Error fetching data:", error);
            setImages([]);
        }
    }

    fetchData();
  }, []);

  const getImageUrl = (path) => {
    const fullPath = `http://localhost:3001/${path.replace('\\', '/')}`;
    console.log("Image URL: ", fullPath);
    return fullPath;
};

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    setUploadedImage(file);
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('image', uploadedImage);
    formData.append('description', description);

    try {
      await axios.post('/dashboard/upload', formData); // Adjust the endpoint URL as needed
      toggleUploadModal(); // Close modal after successful upload
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

  return (
    <div className="Dashboard">
      <h1>Food Gallery</h1>
      <button onClick={toggleUploadModal}>Upload A Photo</button>

      {isUploadModalVisible && (
        <div className="upload-modal">
          <div className="modal-content">
              <span className="close-button" onClick={toggleUploadModal}>X</span>
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

      <div className="image-grid">
        {Array.isArray(images) && images.map((image) => (
          <div
            key={image.id}
            className="image-thumbnail"
            onClick={() => handleImageClick(image)}
          >
            <img src={getImageUrl(image.image_path)} alt={image.description} />
          </div>
        ))}
      </div>

      {selectedImage && (
        <div>
          {/* Add your modal or separate page code here */}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
