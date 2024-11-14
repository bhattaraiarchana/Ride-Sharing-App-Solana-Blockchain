require('dotenv').config();
console.log('MONGO_DB_URL:', process.env.MONGO_DB_URL);

const solanaWeb3 = require('@solana/web3.js');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');
const mongoose = require('mongoose');  // MongoDB for off-chain data storage
const { Keypair } = require('@solana/web3.js');

const app = express();
app.use(bodyParser.json());

// MongoDB connection using MONGO_DB_URL from .env file (updated to remove deprecated options)
mongoose.connect(process.env.MONGO_DB_URL)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Load the secret key from the JSON file
const privateKeyPath = '/home/moon/.config/solana/id.json';
const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(privateKeyPath)));
const keypair = Keypair.fromSecretKey(secretKey);

// Create a connection to the Solana devnet
const connection = new solanaWeb3.Connection(
  solanaWeb3.clusterApiUrl('devnet'),
  'confirmed'
);

// MongoDB schemas for users and rides
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  rides: Array,
  ratings: Array
});

const rideSchema = new mongoose.Schema({
  riderId: String,
  driverId: String,
  fare: Number,
  status: String,
  startLocation: String,
  endLocation: String,
  timestamp: Date
});

const User = mongoose.model('User', userSchema);
const Ride = mongoose.model('Ride', rideSchema);

// JWT Authentication middleware
const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).send('Access Denied');

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).send('Invalid Token');
  }
};

// Basic route
app.get('/', (req, res) => {
  res.send('Ride-sharing backend is running');
});

// User Registration
app.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  const newUser = new User({ username, password, email });
  await newUser.save();
  res.send({ message: 'User registered successfully' });
});

// User Authentication (login)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) return res.status(400).send('Invalid credentials');

  const token = jwt.sign({ _id: user._id, username: user.username }, process.env.JWT_SECRET);
  res.header('Authorization', token).send({ message: 'Login successful', token });
});

// Ride Request API
app.post('/request-ride', authenticateJWT, async (req, res) => {
  const { fare, startLocation } = req.body;

  // Create Solana transaction for ride request (without payment)
  const transaction = new solanaWeb3.Transaction().add(
    // Call smart contract's create_ride function (pseudo-code)
    // Example: create_ride(fare, startLocation, req.user.username)
  );

  const signature = await solanaWeb3.sendAndConfirmTransaction(connection, transaction, [keypair]);

  const newRide = new Ride({
    riderId: req.user._id,
    fare,
    startLocation,
    status: 'requested',
    timestamp: new Date()
  });
  await newRide.save();

  res.send({ signature, message: 'Ride requested on Solana', rideId: newRide._id });
});

// Ride Accept API
app.post('/accept-ride', authenticateJWT, async (req, res) => {
  const { rideId } = req.body;
  const ride = await Ride.findById(rideId);

  if (!ride) return res.status(404).send('Ride not found');

  // Solana transaction for accepting the ride
  const transaction = new solanaWeb3.Transaction().add(
    // Call smart contract's accept_ride function
    // Example: accept_ride(rideId)
  );

  const signature = await solanaWeb3.sendAndConfirmTransaction(connection, transaction, [keypair]);

  ride.status = 'accepted';
  ride.driverId = req.user._id;
  await ride.save();

  res.send({ signature, message: 'Ride accepted', ride });
});

// Ride Completion API
app.post('/complete-ride', authenticateJWT, async (req, res) => {
  const { rideId } = req.body;
  const ride = await Ride.findById(rideId);

  if (!ride) return res.status(404).send('Ride not found');

  // Solana transaction for completing the ride
  const transaction = new solanaWeb3.Transaction().add(
    // Call smart contract's complete_ride function
    // Example: complete_ride(rideId)
  );

  const signature = await solanaWeb3.sendAndConfirmTransaction(connection, transaction, [keypair]);

  ride.status = 'completed';
  await ride.save();

  res.send({ signature, message: 'Ride completed', ride });
});

// WebSocket for real-time updates
const wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', ws => {
  console.log('WebSocket connection established');
  
  ws.on('message', message => {
    console.log('Received:', message);
    // Handle real-time updates like ride status and location
  });
});

// Start the server
app.listen(3000, '0.0.0.0', () => {
  console.log('Ride-sharing backend running on http://0.0.0.0:3000');
});
