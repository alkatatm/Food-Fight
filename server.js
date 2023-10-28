const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken'); // CF: JWT token authentication
const app = express();
const port = 3001;
const db = new sqlite3.Database('database.db');
const cors = require('cors');
const multer = require('multer');
const secretKey = 'secret-key'; // CF: Must be before verifyToken function
//const cookieParser = require('cookie-parser'); // CF: Tokens stored as cookies
//app.use(cookieParser()); // CF: Parsing for tokens as cookies
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads'); 
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});


//CF: JWT token verification. verifyToken added as second argument in routes to be protected
function verifyToken(req, res, next) {
    const token = req.headers.authorization; // CF: assumes token is in header
    if(!token) {
        console.log('No Token found');
        return res.status(401).json({ error: 'Unauthorized'});
    }

    if(invalidatedTokens.includes(token)) {
        return res.status(401).json({ error: 'Token has been invalidated' });
    }
    
    // CF: Token mismatch
    jwt.verify(token, secretKey, (err, decoded) => {
        if(err) {
            console.log('Verification failed');
            console.log('Backend token:', token);
            return res.status(403).json({ error: 'Forbidden'});
        }

        // CF: When token is invalid user data stored in request object
        req.user = decoded;
        next();
    });
}
const upload = multer({ storage: storage });

app.use('/uploads', express.static('uploads')); 
app.use(cors({
    origin: 'https://food-fight.onrender.com',  // Allow this origin
    credentials: true,                // Allow cookies
    httpOnly: true,
}));
app.use(bodyParser.json());



// Registration endpoint
app.post('/register', (req, res) => {
    console.log("Received POST request on /register");
    const { username, password } = req.body;
    // Check if the user already exists
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (row) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        // Insert the new user with plain text password (not recommended)
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Registration failed' });
            }
            res.status(201).json({ message: 'Registration successful' });
        });
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log("Received POST request on /login");

    // Retrieve user from the database
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        // Compare the plain text password (not recommended)
        if (password !== user.password) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate JWT token that expires in 1h upon successful login.
        const token = jwt.sign({username}, secretKey,{expiresIn:'1h'});
        // Directly send the token in the response body
        res.json({ success: true, token });
    });
});

let invalidatedTokens = [];
app.post('/logout', (req, res) => {
    console.log("Received POST request on /logout");
    // Receive the token to be invalidated.
    const token = req.body.token;

    if(token) {
        // Add the token to our list of invalidated tokens.
        invalidatedTokens.push(token);

        // Responding to the client to proceed with logout on their end.
        res.json({ success: true, message: 'Logout successful' });
    } else {
        res.status(400).json({ success: false, message: 'Token not provided' });
    }
});

app.get('/getid', (req, res) => {
    const { username } = req.query; // Retrieve username from query string
    console.log("Received GET request on /getid with username:", username);
    
    // Check if a username was provided
    if (!username) {
        return res.status(400).json({ error: 'Username is required in the query string' });
    }

    // Retrieve user from the database based on username
    db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        // Send the user ID as a JSON response
        res.json({ success: true, userId: user.id });
    });
});



// CF: Token verification added, see: 'verifyToken' argument
app.get('/dashboard', verifyToken, (req, res) => {
    console.log("Received GET request on /dashboard");
    
    db.all('SELECT photos.*, COALESCE(AVG(ratings.rating), 0) AS average_rating FROM photos LEFT JOIN ratings ON photos.id = ratings.photo_id GROUP BY photos.id ORDER BY average_rating DESC;', (err, rows) => {
      
      if (err) {
        // Handle any errors that occur during the database query
        console.error("Database error occurred:", err.message);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      if (!rows || rows.length === 0) {
        // If no rows are found, send a custom message
        return res.json({ message: "No Images Found!" });
      }
      
      // If successful, send the images as JSON response
      res.json(rows);
    });
});

// CF: Token verification added, see: 'verifyToken' argument
app.post('/dashboard/upload', verifyToken, upload.single('image'), (req, res) => {
    const description = req.body.description;
    const imagePath = req.file.path; // This will store the path of the uploaded image

    db.run('INSERT INTO photos (image_path, description) VALUES (?, ?)', [imagePath, description], (err) => {
        if (err) {
            console.error("Error inserting into photos:", err.message);
            return res.status(500).json({ error: 'Photo upload failed', details: err.message });
        }
        res.status(201).json({ message: 'Photo uploaded successfully' });
    });
});

// CF: Token verification added, see: 'verifyToken' argument
app.post('/dashboard/rate', verifyToken, (req, res) => {
    const user_id = req.body.user_id;
    const photo_id = req.body.photo_id;
    const rating = req.body.rating;
    
    console.log("Fetching ratings");
    // Check if the user has already rated this photo
    db.get('SELECT * FROM ratings WHERE user_id = ? AND photo_id = ?', [user_id, photo_id], (err, existingRating) => {
      if (err) {
        console.error("Database error occurred:", err.message);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
  
      if (existingRating) {
        // If the user has already rated this photo, update the existing rating
        db.run('UPDATE ratings SET rating = ? WHERE user_id = ? AND photo_id = ?', [rating, user_id, photo_id], (err) => {
          if (err) {
            console.error("Error updating rating:", err.message);
            return res.status(500).json({ error: 'Rating update failed', details: err.message });
          }
          res.json({ message: 'Rating updated successfully' });
        });
      } else {
        // If the user has not rated this photo before, insert a new rating
        db.run('INSERT INTO ratings (user_id, photo_id, rating) VALUES (?, ?, ?)', [user_id, photo_id, rating], (err) => {
        console.log("500 error");
          if (err) {
            console.error("Error inserting rating:", err.message);
            return res.status(500).json({ error: 'Rating failed', details: err.message });
          }
          res.json({ message: 'Rating posted successfully' });
        });
      }
    });
  });

  app.get('/dashboard/rating/:photoId', (req, res) => {
    const photoId = req.params.photoId;  // Extracting photoId from route parameter

    if (!photoId) {
        return res.status(400).json({ error: 'Photo ID is required' });
    }

    // Fetch the average rating for the specified photo
    db.all('SELECT rating FROM ratings WHERE photo_id = ?', [photoId], (err, row) => {
        if (err) {
            console.error("Database error occurred:", err.message);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }

        if (!row) {
            return res.status(404).json({ message: "Rating not found for the given photo" });
        }
        
        // If successful, send the average rating as JSON response
        res.json(row); // If no ratings, default to 0
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
