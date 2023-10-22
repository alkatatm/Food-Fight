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
const cookieParser = require('cookie-parser'); // CF: Tokens stored as cookies
app.use(cookieParser()); // CF: Parsing for tokens as cookies
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads'); // You need to create this directory to store uploaded images
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

//CF: JWT token verification. verifyToken added as second argument in routes to be protected
function verifyToken(req, res, next) {
    const token = req.headers.authorization; // CF: assumes token is in header
    if(!token) {
        return res.status(401).json({ error: 'Unauthorized'});
    }

    // CF: Token mismatch
    jwt.verify(token, secretKey, (err, decoded) => {
        if(err) {
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
    origin: 'http://localhost:3000',  // Allow this origin
    credentials: true,                // Allow cookies
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

        // CF: Generate JWT token that expires in 1h upon successful login.
        const token = jwt.sign({username}, secretKey,{expiresIn:'1h'});

        // CF: Set token as HTTP-only cookie for development
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // CF: for https environments set to true
            maxAge: 3600000, // CF: 1 hour expiration of token
        })

        // Authentication successful (not recommended) CF: Token being sent to client on successful login
        res.json({ success: true, token });
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
    const userId = req.body.user_id;
    const description = req.body.description;
    const imagePath = req.file.path; // This will store the path of the uploaded image

    db.run('INSERT INTO photos (user_id, image_path, description) VALUES (?, ?, ?)', [userId, imagePath, description], (err) => {
        if (err) {
            console.error("Error inserting into photos:", err.message);
            return res.status(500).json({ error: 'Photo upload failed', details: err.message });
        }
        res.status(201).json({ message: 'Photo uploaded successfully' });
    });
});

// CF: Token verification added, see: 'verifyToken' argument
app.post('/dashboard/rate', verifyToken, (req, res) => {
    const userId = req.body.user_id;
    const photoId = req.body.photo_id;
    const rating = req.body.rating;

    // Check if the user has already rated this photo
    db.get('SELECT * FROM ratings WHERE user_id = ? AND photo_id = ?', [userId, photoId], (err, existingRating) => {
        if (err) {
            console.error("Database error occurred:", err.message);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }

        if (existingRating) {
            // If the user has already rated this photo, update the existing rating
            db.run('UPDATE ratings SET rating = ? WHERE user_id = ? AND photo_id = ?', [rating, userId, photoId], (err) => {
                if (err) {
                    console.error("Error updating rating:", err.message);
                    return res.status(500).json({ error: 'Rating update failed', details: err.message });
                }
                res.json({ message: 'Rating updated successfully' });
            });
        } else {
            // If the user has not rated this photo before, insert a new rating
            db.run('INSERT INTO ratings (user_id, photo_id, rating) VALUES (?, ?, ?)', [userId, photoId, rating], (err) => {
                if (err) {
                    console.error("Error inserting rating:", err.message);
                    return res.status(500).json({ error: 'Rating failed', details: err.message });
                }
                res.json({ message: 'Rating posted successfully' });
            });
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
