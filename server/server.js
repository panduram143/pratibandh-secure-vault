require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIO = require('socket.io');

const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// connect to database
connectDB();

// middleware
app.set('trust proxy', true); // Trust the reverse proxy to get the real client IP
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/registered-ids', require('./routes/registeredIds'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/collaboration', require('./routes/collaboration'));
app.use('/api/search', require('./routes/search'));

// basic health check
app.get('/', (req, res) => {
    res.json({ message: 'PRATIBANDH API is running', version: '1.0.0' });
});

// socket.io for real-time notifications
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// make io available to routes
app.set('io', io);

// error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ msg: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
