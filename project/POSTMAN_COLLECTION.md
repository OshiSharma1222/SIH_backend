# Postman Collection for Smart Tourist Safety Monitoring API

This document provides sample Postman requests for testing all API endpoints.

## 🔐 Authentication

### 1. Admin Login
```
POST {{base_url}}/auth/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "role": "admin",
    "username": "admin"
  }
}
```

## 👤 KYC & Tourist Management

### 2. KYC Verification (Tourist Registration)
```
POST {{base_url}}/kyc/verify
Content-Type: application/json

{
  "aadhaar_number": "123456789012",
  "full_name": "Rahul Sharma",
  "date_of_birth": "1992-05-15",
  "contact_number": "+91-9876543210",
  "email": "rahul.sharma@email.com",
  "emergency_contact_1": "+91-9876543211",
  "emergency_contact_2": "+91-9876543212",
  "nationality": "India",
  "itinerary": [
    {
      "destination_name": "Red Fort, Delhi",
      "destination_lat": 28.6562,
      "destination_lng": 77.2410,
      "planned_arrival": "2024-01-20T10:00:00Z",
      "planned_departure": "2024-01-20T16:00:00Z"
    },
    {
      "destination_name": "Taj Mahal, Agra",
      "destination_lat": 27.1751,
      "destination_lng": 78.0421,
      "planned_arrival": "2024-01-21T09:00:00Z",
      "planned_departure": "2024-01-21T17:00:00Z"
    }
  ]
}
```

### 3. Get Tourist Profile
```
GET {{base_url}}/kyc/{{dtid}}
Authorization: Bearer {{tourist_token}}
```

## 📍 Location Tracking

### 4. Update Location
```
POST {{base_url}}/location/update
Authorization: Bearer {{tourist_token}}
Content-Type: application/json

{
  "dtid": "{{dtid}}",
  "latitude": 28.6129,
  "longitude": 77.2295,
  "altitude": 233.5,
  "accuracy": 10.0,
  "timestamp": "2024-01-20T14:30:00Z"
}
```

### 5. Get Latest Location
```
GET {{base_url}}/location/{{dtid}}
Authorization: Bearer {{tourist_token}}
```

### 6. Get Location History
```
GET {{base_url}}/location/{{dtid}}/history?limit=20&from=2024-01-20T00:00:00Z
Authorization: Bearer {{tourist_token}}
```

## 🚧 Geofencing

### 7. Check Geofence
```
POST {{base_url}}/geofence/check
Authorization: Bearer {{tourist_token}}
Content-Type: application/json

{
  "dtid": "{{dtid}}",
  "currentLat": 32.7767,
  "currentLong": 74.8728
}
```

### 8. Get Restricted Zones
```
GET {{base_url}}/geofence/zones
Authorization: Bearer {{tourist_token}}
```

## 🚨 Anomaly Detection

### 9. Check Tourist Anomalies
```
GET {{base_url}}/anomaly/{{dtid}}
Authorization: Bearer {{tourist_token}}
```

### 10. Get All Anomalies (Admin)
```
GET {{base_url}}/anomaly?status=active&limit=50
Authorization: Bearer {{admin_token}}
```

### 11. Resolve Anomaly (Admin)
```
PUT {{base_url}}/anomaly/{{anomaly_id}}/resolve
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "status": "resolved",
  "notes": "Tourist contacted and confirmed safe"
}
```

## 🔍 QR Code System

### 12. Get QR Code Image
```
GET {{base_url}}/qr/{{dtid}}
```

### 13. Scan QR Code
```
POST {{base_url}}/qr/scan
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "qrData": "{\"dtid\":\"DTID-1234567890-ABC123\",\"verificationUrl\":\"http://localhost:3000/qr/verify/DTID-1234567890-ABC123\",\"timestamp\":\"2024-01-20T10:00:00.000Z\"}"
}
```

### 14. Verify QR Code (Quick)
```
GET {{base_url}}/qr/verify/{{dtid}}
```

## 📊 Safety Scoring

### 15. Get Tourist Safety Score
```
GET {{base_url}}/safety-score/{{dtid}}
Authorization: Bearer {{tourist_token}}
```

### 16. Get All Safety Scores (Admin)
```
GET {{base_url}}/safety-score?riskLevel=high&limit=20
Authorization: Bearer {{admin_token}}
```

## 📈 Dashboard (Admin Only)

### 17. Get Tourist Clusters
```
GET {{base_url}}/dashboard/clusters?radius=5000
Authorization: Bearer {{admin_token}}
```

### 18. Get Active Alerts
```
GET {{base_url}}/dashboard/alerts?severity=high&limit=50
Authorization: Bearer {{admin_token}}
```

### 19. Get Dashboard Statistics
```
GET {{base_url}}/dashboard/stats
Authorization: Bearer {{admin_token}}
```

## 🔄 Token Refresh

### 20. Refresh Tourist Token
```
POST {{base_url}}/auth/refresh
Content-Type: application/json

{
  "dtid": "{{dtid}}"
}
```

## 🏥 System Health

### 21. Health Check
```
GET {{base_url}}/health
```

### 22. API Documentation
```
GET {{base_url}}/
```

## 📋 Environment Variables for Postman

Create a Postman environment with these variables:

```
base_url: http://localhost:3000
admin_token: {{admin_token_from_login}}
tourist_token: {{tourist_token_from_kyc}}
dtid: {{dtid_from_kyc_verification}}
anomaly_id: {{anomaly_id_from_response}}
```

## 🧪 Testing Scenarios

### Scenario 1: Tourist Registration & Tracking
1. Execute request #2 (KYC Verification)
2. Save `dtid` and `token` from response
3. Execute request #4 (Update Location) with saved token
4. Execute request #5 (Get Latest Location)
5. Execute request #9 (Check Anomalies)
6. Execute request #15 (Get Safety Score)

### Scenario 2: Geofence Breach Testing
1. Use tourist token from Scenario 1
2. Execute request #7 with coordinates inside a restricted zone:
   - Border Area: `32.7767, 74.8728`
   - Military Area: `28.6129, 77.2295`
3. Check anomalies (request #9) to see geofence breach
4. Check updated safety score (request #15)

### Scenario 3: Admin Dashboard Monitoring
1. Execute request #1 (Admin Login)
2. Save admin token
3. Execute request #18 (Get Active Alerts)
4. Execute request #17 (Get Tourist Clusters)
5. Execute request #19 (Get Dashboard Stats)
6. Execute request #10 (Get All Anomalies)

### Scenario 4: QR Code Verification
1. Execute request #12 (Get QR Code Image)
2. Execute request #14 (Verify QR Code)
3. Execute request #13 (Scan QR Code) with admin token

## 📝 Sample Test Data

### Test Tourist Data:
```json
{
  "full_name": "Priya Patel",
  "aadhaar_number": "987654321098",
  "date_of_birth": "1988-12-10",
  "contact_number": "+91-8765432109",
  "emergency_contact_1": "+91-8765432110",
  "nationality": "India"
}
```

### Test Locations:
- **Safe Location**: `28.7041, 77.1025` (Delhi)
- **Border Risk**: `32.7767, 74.8728` (Pakistan border)
- **Naxal Area**: `20.2961, 81.8847` (Chhattisgarh)
- **Tourist Spot**: `27.1751, 78.0421` (Taj Mahal)

### Test Itinerary:
```json
{
  "destination_name": "Golden Temple, Amritsar",
  "destination_lat": 31.6200,
  "destination_lng": 74.8765,
  "planned_arrival": "2024-01-22T08:00:00Z"
}
```

## 🚨 Expected Error Responses

### 401 Unauthorized:
```json
{
  "success": false,
  "message": "Access token required"
}
```

### 403 Forbidden:
```json
{
  "success": false,
  "message": "Admin access required"
}
```

### 404 Not Found:
```json
{
  "success": false,
  "message": "Tourist not found"
}
```

### 400 Bad Request:
```json
{
  "success": false,
  "message": "Required fields: dtid, latitude, longitude"
}
```

This collection provides comprehensive testing coverage for all API endpoints and common use cases.