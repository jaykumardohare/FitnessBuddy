// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const messageRoutes = require('./routes/message');
const workoutRoutes = require('./routes/workout');
const goalRoutes = require('./routes/goal');
const buddyRoutes = require('./routes/buddy');
const challengeRoutes = require('./routes/challenge');
const gymRoutes = require('./routes/gym');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/buddies', buddyRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/gyms', gymRoutes);

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  preferredWorkouts: [{
    type: String,
    enum: ['yoga', 'running', 'weightlifting', 'swimming', 'cycling', 'hiit', 'pilates', 'other']
  }],
  fitnessGoals: [{
    type: String,
    enum: ['weight loss', 'strength training', 'endurance', 'flexibility', 'muscle gain', 'other']
  }],
  profilePicture: {
    type: String,
    default: ''
  },
  buddies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;

// backend/models/Workout.js
const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  calories: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Workout = mongoose.model('Workout', workoutSchema);

module.exports = Workout;

// backend/models/Goal.js
const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  targetValue: {
    type: Number,
    required: true
  },
  currentValue: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  }
});

const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;

// backend/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;

// backend/models/Challenge.js
const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  goal: {
    type: String,
    required: true
  },
  targetValue: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    progress: {
      type: Number,
      default: 0
    },
    joined: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: true
  }
});

const Challenge = mongoose.model('Challenge', challengeSchema);

module.exports = Challenge;

// backend/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, location, preferredWorkouts, fitnessGoals } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    user = new User({
      name,
      email,
      password,
      location,
      preferredWorkouts,
      fitnessGoals
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// backend/controllers/buddyController.js
const User = require('../models/User');

// Find potential workout buddies
exports.findBuddies = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    // Basic algorithm to match users based on location, workouts, and goals
    const potentialBuddies = await User.find({
      _id: { $ne: userId }, // Not the current user
      location: user.location, // Same location
      $or: [
        { preferredWorkouts: { $in: user.preferredWorkouts } }, // Similar workout preferences
        { fitnessGoals: { $in: user.fitnessGoals } } // Similar fitness goals
      ]
    }).select('-password');
    
    res.json(potentialBuddies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add buddy
exports.addBuddy = async (req, res) => {
  try {
    const userId = req.user.id;
    const { buddyId } = req.body;
    
    // Update current user's buddies list
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { buddies: buddyId } }
    );
    
    // Update buddy's buddies list
    await User.findByIdAndUpdate(
      buddyId,
      { $addToSet: { buddies: userId } }
    );
    
    res.json({ message: 'Buddy added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's buddies
exports.getBuddies = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .populate('buddies', 'name email location preferredWorkouts fitnessGoals profilePicture');
    
    res.json(user.buddies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');
  
  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authController.login);

module.exports = router;

// backend/routes/buddy.js
const express = require('express');
const router = express.Router();
const buddyController = require('../controllers/buddyController');
const auth = require('../middleware/auth');

// @route   GET api/buddies/find
// @desc    Find potential workout buddies
// @access  Private
router.get('/find', auth, buddyController.findBuddies);

// @route   POST api/buddies/add
// @desc    Add a buddy
// @access  Private
router.post('/add', auth, buddyController.addBuddy);

// @route   GET api/buddies
// @desc    Get user's buddies
// @access  Private
router.get('/', auth, buddyController.getBuddies);

module.exports = router;