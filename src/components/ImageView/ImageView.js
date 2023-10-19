import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';

function ImageView({ imageId }) {
  const [image, setImage] = useState(null);
  const [rating, setRating] = useState(0);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    fetchImageDetails();
  }, [imageId]);

  const fetchImageDetails = () => {
    axios.get(`/dashboard/${imageId}`)
      .then((response) => {
        setImage(response.data);
      })
      .catch((error) => {
        console.error("Error fetching image details:", error.message);
      });
  };

  const handleRatingSubmit = () => {
    axios.post(`/dashboard/${imageId}/ratings`, { rating: Number(rating) })
      .then(() => {
        setRating(0);
        fetchImageDetails();
        setNotification('Rating submitted successfully!');
      })
      .catch((error) => {
        console.error("Error submitting rating:", error.message);
      });
  };

  if (!image) {
    return <div>Loading...</div>; 
  }

  return (
    <div>
      {notification && <div className="notification">{notification}</div>}
      <h2>{image.title}</h2>
      <img src={image.imageUrl} alt={image.title} />
      <div>
        <h3>Rating</h3>
        <p>Average Rating: {image.averageRating.toFixed(2)}</p>
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))} aria-label="Select rating">
          <option value="0">Select Rating</option>
          <option value="1">1 (Poor)</option>
          <option value="2">2 (Fair)</option>
          <option value="3">3 (Good)</option>
          <option value="4">4 (Very Good)</option>
          <option value="5">5 (Excellent)</option>
        </select>
        <button onClick={handleRatingSubmit} aria-label="Submit rating">Submit Rating</button>
      </div>
    </div>
  );
}

export default ImageView;
