# Smart Tourist Safety Monitoring & Incident Response System - Backend API

A comprehensive Node.js backend system for monitoring tourist safety, detecting anomalies, and managing incident responses through digital tourist identification, geofencing, and real-time tracking.

## 🚀 Features

### Core Modules
- **KYC Processing & Digital Tourist ID (DTID)** - Identity verification and QR code generation
- **Geofencing** - Restricted zone monitoring with real-time breach detection
- **Location Tracking** - Real-time GPS tracking with historical data
- **Anomaly Detection** - AI-powered rules for detecting safety incidents
- **QR Code System** - Digital verification for authorities
- **Safety Scoring** - Dynamic risk assessment system
- **Dashboard APIs** - Administrative insights and alert management

### Technical Features
- JWT Authentication with role-based access
- Supabase integration for scalable database operations
- Real-time anomaly detection algorithms
- Haversine distance calculations for geofencing
- Rate limiting and security middleware
- Comprehensive error handling and logging

## 📋 Prerequisites

- Node.js (v16 or higher)
- Supabase account and project
- Environment variables configured

## 🛠️ Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Update the `.env` file with your Supabase credentials:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_super_secret_jwt_key
   ```

3. **Database Setup**
   The Supabase migration file will automatically create all necessary tables and policies.

4. **Start the Server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🔌 API Endpoints

### Authentication
- `POST /auth/admin/login` - Admin login (username: admin, password: admin123)
- `POST /auth/refresh` - Tourist token refresh

### KYC & Tourist Management
- `POST /kyc/verify` - KYC verification and DTID generation
- `GET /kyc/:dtid` - Get tourist profile

### Geofencing
- `POST /geofence/check` - Check restricted zone entry
- `GET /geofence/zones` - Get all restricted zones

### Location Tracking
- `POST /location/update` - Update tourist location
- `GET /location/:dtid` - Get latest location
- `GET /location/:dtid/history` - Get location history

### Anomaly Detection
- `GET /anomaly/:dtid` - Check anomalies for tourist
- `PUT /anomaly/:anomalyId/resolve` - Resolve anomaly (admin)
- `GET /anomaly` - Get all anomalies (admin)

### QR Code System
- `GET /qr/:dtid` - Get QR code image
- `POST /qr/scan` - Scan QR code for verification
- `GET /qr/verify/:dtid` - Quick QR verification

### Safety Scoring
- `GET /safety-score/:dtid` - Get safety score
- `GET /safety-score` - Get all safety scores (admin)

### Dashboard (Admin Only)
- `GET /dashboard/clusters` - Tourist location clusters
- `GET /dashboard/alerts` - Active alerts and incidents
- `GET /dashboard/stats` - System statistics

## 🔐 Authentication

### Tourist Authentication
1. Complete KYC verification to receive DTID and JWT token
2. Use token in Authorization header: `Bearer <token>`

### Admin Authentication
1. Login with admin credentials
2. Use admin token for dashboard and management endpoints

## 📊 Sample Data

The system includes pre-populated restricted zones for testing:
- Border areas (critical risk)
- Naxal affected regions (high risk)
- Landslide prone zones (high risk)
- Military areas (medium risk)
- Wildlife sanctuaries (medium risk)

## 🧪 Testing with Postman

### 1. Admin Login
```json
POST /auth/admin/login
{
  "username": "admin",
  "password": "admin123"
}
```

### 2. KYC Verification
```json
POST /kyc/verify
{
  "aadhaar_number": "123456789012",
  "full_name": "John Doe",
  "date_of_birth": "1990-01-01",
  "contact_number": "+91-9876543210",
  "emergency_contact_1": "+91-9876543211",
  "nationality": "India",
  "itinerary": [{
    "destination_name": "Goa Beach",
    "destination_lat": 15.2993,
    "destination_lng": 74.1240,
    "planned_arrival": "2024-01-15T10:00:00Z"
  }]
}
```

### 3. Location Update
```json
POST /location/update
Authorization: Bearer <tourist_token>
{
  "dtid": "DTID-1234567890-ABC123",
  "latitude": 28.6129,
  "longitude": 77.2295,
  "altitude": 233.5,
  "accuracy": 10.0
}
```

### 4. Geofence Check
```json
POST /geofence/check
Authorization: Bearer <tourist_token>
{
  "dtid": "DTID-1234567890-ABC123",
  "currentLat": 32.7767,
  "currentLong": 74.8728
}
```

## 🚨 Anomaly Detection Rules

1. **Inactivity**: No location update for >30 minutes
2. **Route Deviation**: >5km deviation from planned itinerary
3. **Altitude Drop**: >100m drop in <2 minutes (accident detection)
4. **Speed Anomaly**: Speed >120 km/h (vehicle accident detection)
5. **Geofence Breach**: Entry into restricted/dangerous zones

## 🎯 Safety Scoring System

- **Initial Score**: 100 points
- **Deductions**:
  - Inactivity: -10 to -15 points
  - Geofence breach: -20 to -30 points
  - Route deviation: -15 points
  - Altitude drop: -25 to -40 points
  - Speed anomaly: -10 points

## 🔒 Security Features

- JWT-based authentication with role separation
- Rate limiting (100 requests per 15 minutes)
- Helmet.js security headers
- Input validation and sanitization
- Row Level Security (RLS) in Supabase
- Environment variable protection

## 📱 QR Code System

Each tourist receives a QR code containing:
- DTID (Digital Tourist ID)
- Verification URL
- Tourist basic information
- Generation timestamp

QR codes can be scanned by authorities for instant tourist verification and safety status.

## 🏥 Health Check

Access `GET /health` for system status monitoring.

## 📈 Dashboard Features

- Real-time tourist location clusters
- Active alerts and incident management
- Safety score distributions
- System statistics and analytics
- Geofenced area management

## 🚀 Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure proper database connection limits
4. Set up monitoring and logging
5. Enable HTTPS/SSL certificates
6. Configure proper CORS origins

## 🤝 Contributing

This system is designed for extensibility:
- Add new anomaly detection algorithms
- Integrate with government KYC APIs
- Add ML-based prediction models
- Extend dashboard analytics
- Add mobile app integration

## 📄 License

MIT License - see LICENSE file for details.

---

**Note**: This system includes mock KYC verification. In production, integrate with actual government identity verification services.