// backend/server.js
require('dotenv').config();
require('./models/AppointmentModel');
require('./models/NotificationModel');
const bus = require('./events/bus');

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const { protect } = require('./middleware/authMiddleware'); // Import protect

const app = express();
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS
const ALLOW_LIST = new Set([
  'http://3.107.206.208',
  'http://3.107.206.208:3000',
  'http://3.107.206.208:5001',
  'http://13.239.237.156:5001',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (NODE_ENV !== 'production') return cb(null, true);
    if (ALLOW_LIST.has(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS: ' + origin));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

function tryRequire(pathList) {
  for (const p of pathList) {
    try {
      return require(p);
    } catch (err) {
      if (!(err && err.code === 'MODULE_NOT_FOUND')) throw err;
    }
  }
  return null;
}

const authRoutes = tryRequire(['./routes/auth', './routes/authRoutes']);
const petRoutes = tryRequire(['./routes/pets', './routes/petRoutes']);
const ownerRoutes = tryRequire(['./routes/owners', './routes/ownerRoutes']);
const appointmentRoutes = tryRequire(['./routes/appointments', './routes/appointmentRoutes']);
const historyRoutes = tryRequire(['./routes/history', './routes/historyRoutes']);
const taskRoutes = tryRequire(['./routes/tasks', './routes/taskRoutes']);
const adminUsersRoutes = tryRequire(['./routes/adminUsers']);

function mount(name, router, useProtect = false) {
  if (!router) return;
  
  if (useProtect) {
    // Protected routes
    app.use(`/${name}`, protect, router);
    app.use(`/api/${name}`, protect, router);
  } else {
    // Public routes
    app.use(`/${name}`, router);
    app.use(`/api/${name}`, router);
  }
  console.log(`[route] /${name} & /api/${name} mounted ${useProtect ? '(protected)' : ''}`);
}

// Mount routes
mount('auth', authRoutes); // Public (has own protect where needed)
mount('pets', petRoutes); // Can be protected or handle inside route
mount('owners', ownerRoutes);
mount('appointments', appointmentRoutes, true); // Protected
mount('history', historyRoutes, true); // Protected
mount('tasks', taskRoutes);
mount('admin/users', adminUsersRoutes);

mount('auth', authRoutes); // Public (has own protect where needed)
mount('pets', petRoutes, true); // Protected - changed from false to true
mount('owners', ownerRoutes, true); // Protected - changed from false to true
mount('appointments', appointmentRoutes, true); // Protected
mount('history', historyRoutes, true); // Protected
mount('tasks', taskRoutes);
mount('admin/users', adminUsersRoutes);

// Health
app.get('/', (_req, res) => {
  res.send('Backend is running on EC2 with PM2 🚀');
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: NODE_ENV });
});

// Start server
async function start() {
  try {
    if (NODE_ENV !== 'test') {
      await connectDB();
      console.log('[db] MongoDB connected');
    }

    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: (origin, cb) => {
          if (!origin) return cb(null, true);
          if (NODE_ENV !== 'production') return cb(null, true);
          return cb(ALLOW_LIST.has(origin) ? null : new Error('Not allowed by CORS: ' + origin), true);
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: false,
      },
    });

    io.on('connection', (socket) => {
      console.log('socket connected:', socket.id);
      socket.on('disconnect', () => console.log('socket disconnected:', socket.id));
    });

    require('./listeners/notificationListener')(bus, io);

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[http] Listening on 0.0.0.0:${PORT} (${NODE_ENV})`);
    });

    process.on('SIGINT', () => {
      console.log('\nSIGINT received. Closing gracefully...');
      mongoose.connection.close(() => {
        console.log('[db] connection closed');
        server.close(() => process.exit(0));
      });
    });
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Closing gracefully...');
      mongoose.connection.close(() => {
        console.log('[db] connection closed');
        server.close(() => process.exit(0));
      });
    });
  } catch (err) {
    console.error('[start] fatal:', err);
    process.exit(1);
  }
}

if (NODE_ENV !== 'test') {
  start();
}

module.exports = app;