# 🌾 Borewell Motor Automation System

**AgriPlus** - A comprehensive IoT-based borewell motor automation system with real-time monitoring, e-commerce integration, and voucher management.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Folder Structure](#folder-structure)
- [Features](#features)
- [Database Models](#database-models)
- [Installation & Setup](#installation--setup)
- [Docker Deployment Guide](#docker-deployment-guide)
- [Detailed Documentation Index](#detailed-documentation-index)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)

---

## 🐳 Docker Deployment Guide

For containerized running locally or cloud server deployment using Docker & Docker Compose, see the complete guide:
- 📖 [Docker Deployment Guide](docs/DOCKER_DEPLOYMENT_GUIDE.md)

---

## 📚 Detailed Documentation Index

All architectural specs, implementation guides, and reports are organized in the [`docs/`](docs/) directory:

| Document | Purpose |
| :--- | :--- |
| 🐳 [Docker Deployment Guide](docs/DOCKER_DEPLOYMENT_GUIDE.md) | Container setup, docker-compose, and cloud VPS deployment guide |
| 🏗 [Project Technical Overview](docs/PROJECT_TECHNICAL_OVERVIEW.md) | High-level system architecture and component interactions |
| 🔌 [Hardware Interface Specification](docs/HARDWARE_INTERFACE_SPECIFICATION.md) | ESP32/ESP8266 IoT hardware communication protocol |
| 📋 [Product Requirement Document](docs/PRODUCT_REQUIREMENT_DOCUMENT.md) | System requirements, user personas, and feature specs |
| 📁 [Folder Structure Rules](docs/FOLDER_STRUCTURE_RULES.md) | Codebase clean architecture and directory conventions |
| 🎟 [Voucher System Summary](docs/VOUCHER_SYSTEM_SUMMARY.md) | E-commerce discount vouchers and validation logic |
| 📍 [Address & Pincode Implementation](docs/ADDRESS_PINCODE_IMPLEMENTATION.md) | Address management & pincode lookup APIs |
| 🎨 [Flutter Form Controller Pattern](docs/FLUTTER_FORM_CONTROLLER_PATTERN.md) | GetX form handling and validation patterns |
| 🚀 [Tour Implementation](docs/TOUR_IMPLEMENTATION.md) | Interactive app walkthrough/onboarding implementation |
| ⚡ [Performance Report](docs/PERFORMANCE_REPORT.md) | System performance metrics and optimization strategies |
| 🔮 [Future Specification](docs/FUTURE_SPECIFICATION.md) | Roadmap for upcoming features and system upgrades |

---


## 🎯 Overview

This project is a full-stack IoT solution for automating and monitoring borewell motors. It consists of:

- **Flutter Mobile App** (End User) - Monitor devices, purchase products, track orders
- **React Admin Panel** - Manage users, devices, products, orders, and vouchers
- **Node.js Backend** - RESTful APIs, MQTT broker integration, Socket.IO real-time communication
- **MongoDB Database** - Store users, devices, telemetry, orders, vouchers

---

## 🛠️ Tech Stack

### **Frontend - Flutter App (End User)**
- **Framework**: Flutter 3.10+ / Dart
- **State Management**: GetX 4.6.6
- **HTTP Client**: Dio 5.4.0
- **Local Storage**: GetStorage 2.1.1
- **Real-time**: Socket.IO Client 2.0.3
- **Maps**: Google Maps Flutter 2.10.0
- **Notifications**: Flutter Local Notifications 18.0.1
- **Background Service**: Flutter Background Service 5.0.10
- **Charts**: FL Chart 0.69.0
- **Payments**: Razorpay Flutter 1.3.7
- **PDF Generation**: PDF 3.11.1, Printing 5.13.3
- **QR Scanner**: Mobile Scanner 5.2.3

### **Frontend - React Admin Panel**
- **Framework**: React 19.0.0
- **Routing**: React Router DOM 7.0.2
- **HTTP Client**: Axios 1.7.9
- **Real-time**: Socket.IO Client 4.8.1
- **Charts**: Chart.js 4.4.7, ZingChart 2.9.15
- **Maps**: React Google Maps API 2.20.3
- **Styling**: Styled Components 6.1.19, Bootstrap 5
- **Alerts**: SweetAlert2 11.14.5

### **Backend - Node.js Server**
- **Runtime**: Node.js (Express 5.1.0)
- **Database**: MongoDB (Mongoose 8.20.0)
- **Authentication**: JWT (jsonwebtoken 9.0.2), bcrypt 6.0.0
- **MQTT Protocol**: mqtt 5.14.1
- **Real-time**: Socket.IO 4.8.1
- **File Upload**: Multer 2.0.2
- **Payments**: Razorpay 2.9.6
- **API Documentation**: Swagger (swagger-jsdoc, swagger-ui-express)
- **Logging**: Winston 3.18.3
- **Validation**: Express Validator 7.3.0

### **Infrastructure**
- **Database**: MongoDB Atlas / Local MongoDB
- **MQTT Broker**: Mosquitto / HiveMQ
- **Real-time Communication**: Socket.IO WebSocket

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     BOREWELL MOTOR AUTOMATION                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  Flutter Mobile  │◄─────►│   Node.js API    │◄─────►│   MongoDB Atlas  │
│      App         │ REST  │   + Socket.IO    │ CRUD  │    Database      │
│   (End User)     │ API   │   + MQTT Client  │       │                  │
└──────────────────┘       └──────────────────┘       └──────────────────┘
        │                           │                           │
        │                           │                           │
        │ Real-time                 │ MQTT Pub/Sub              │
        │ Socket.IO                 ▼                           │
        │                  ┌──────────────────┐                │
        │                  │   MQTT Broker    │                │
        │                  │  (Mosquitto/     │                │
        │                  │    HiveMQ)       │                │
        │                  └──────────────────┘                │
        │                           │                           │
        ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  React Admin     │◄─────►│   IoT Devices    │       │   Razorpay       │
│     Panel        │ REST  │  (ESP32/ESP8266) │       │  Payment Gateway │
│  (Web Dashboard) │ API   │   Motor Control  │       │                  │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

### **Data Flow**

1. **Device → MQTT → Backend → App/Admin**
   - IoT devices publish telemetry data to MQTT topics
   - Backend subscribes to topics and stores data in MongoDB
   - Real-time updates pushed via Socket.IO to connected clients

2. **App/Admin → Backend → Device**
   - User sends control commands via REST API
   - Backend publishes MQTT commands to device topics
   - Device receives and executes commands

3. **E-commerce Flow**
   - User browses products → adds to cart → applies voucher → checkout
   - Payment via Razorpay → order created → admin manages fulfillment

---

## 📁 Folder Structure

```
Borewell-Motor-Automation/
│
├── FRONTEND/
│   ├── App/
│   │   └── end_user/                      # Flutter Mobile App
│   │       ├── lib/
│   │       │   ├── core/
│   │       │   │   ├── routes/            # App routing (GetX)
│   │       │   │   ├── services/          # Token, Notification, Background
│   │       │   │   └── splash_screen.dart
│   │       │   ├── feature/
│   │       │   │   └── end_user_app/
│   │       │   │       ├── auth/          # Login, Signup
│   │       │   │       │   ├── presentation/
│   │       │   │       │   │   ├── pages/
│   │       │   │       │   │   └── controllers/
│   │       │   │       ├── home/          # Home Dashboard
│   │       │   │       ├── device/        # Device Management
│   │       │   │       ├── shop/          # E-commerce (Cart, Orders, Vouchers)
│   │       │   │       ├── profile/       # User Profile
│   │       │   │       ├── settings/      # App Settings
│   │       │   │       ├── notifications/ # Push Notifications
│   │       │   │       └── dashboard/     # Analytics Dashboard
│   │       │   ├── utils/
│   │       │   │   ├── theme/             # Light/Dark theme
│   │       │   │   └── widgets/           # Reusable UI components
│   │       │   └── main.dart              # App entry point
│   │       ├── android/                   # Android config
│   │       ├── ios/                       # iOS config
│   │       └── pubspec.yaml               # Flutter dependencies
│   │
│   └── Admin/                             # React Admin Panel
│       ├── public/
│       ├── src/
│       │   ├── assets/                    # Images, icons
│       │   ├── charts/                    # Chart configurations
│       │   ├── components/
│       │   │   ├── Admin/                 # Admin UI components
│       │   │   │   ├── Sidebar.jsx
│       │   │   │   ├── Header.jsx
│       │   │   │   └── DashboardCards.jsx
│       │   │   └── Common/                # Shared components
│       │   ├── config/                    # API config
│       │   ├── hooks/
│       │   │   └── Admin/                 # Custom hooks
│       │   ├── pages/
│       │   │   └── Admin/
│       │   │       ├── Dashboard.jsx      # Main dashboard
│       │   │       ├── ManageUsers.jsx    # User management
│       │   │       ├── ManageDevices.jsx  # Device management
│       │   │       ├── ManageProducts.jsx # Product CRUD
│       │   │       ├── ManageOrders.jsx   # Order management
│       │   │       ├── ManageVouchers.jsx # Voucher management
│       │   │       ├── AddVoucher.jsx     # Create voucher
│       │   │       └── EditVoucher.jsx    # Edit voucher
│       │   ├── routes/
│       │   │   └── AdminRoutes.js         # React Router routes
│       │   ├── utils/                     # Helper functions
│       │   ├── App.js                     # React app root
│       │   └── index.js                   # Entry point
│       └── package.json                   # React dependencies
│
├── BACKEND/                               # Node.js Express Server
│   ├── config/
│   │   ├── db.js                          # MongoDB connection
│   │   └── multerConfig.js                # File upload config
│   ├── controllers/
│   │   ├── adminControllers.js            # Admin APIs (Users, Devices, Products)
│   │   ├── appControllers.js              # App APIs (Auth, Shop, Vouchers)
│   │   ├── orderControllers.js            # Order management APIs
│   │   └── addressControllers.js          # Address CRUD APIs
│   ├── models/
│   │   ├── User.js                        # User schema
│   │   ├── Device.js                      # IoT device schema
│   │   ├── Telemetry.js                   # Device telemetry data
│   │   ├── Product.js                     # E-commerce product
│   │   ├── Cart.js                        # Shopping cart
│   │   ├── Order.js                       # Order details
│   │   ├── Address.js                     # Delivery address
│   │   ├── Voucher.js                     # Discount vouchers
│   │   └── Role.js                        # User roles
│   ├── routes/
│   │   ├── adminRoutes.js                 # Admin endpoints
│   │   ├── appRoutes.js                   # App endpoints
│   │   ├── orderRoutes.js                 # Order endpoints
│   │   └── addressRoutes.js               # Address endpoints
│   ├── middlewares/
│   │   ├── authMiddleware.js              # JWT verification
│   │   ├── errorHandler.js                # Global error handler
│   │   ├── logger.js                      # Winston logger
│   │   └── requestLogger.js               # Log all requests
│   ├── mqtt/
│   │   ├── mqttClient.js                  # MQTT subscriber
│   │   ├── publisher.js                   # MQTT publisher
│   │   ├── socketServer.js                # Socket.IO integration
│   │   ├── routes/
│   │   │   └── logs.js                    # MQTT logs API
│   │   └── public/
│   │       └── index.html                 # MQTT monitoring dashboard
│   ├── helpers/
│   │   └── paginate.js                    # Pagination helper
│   ├── scripts/
│   │   └── bootstrapAdmin.js              # Create default admin
│   ├── upload/
│   │   ├── img/                           # Uploaded images
│   │   └── pdf/                           # Generated PDFs
│   ├── Log/                               # Winston logs
│   ├── .env                               # Environment variables
│   ├── server.js                          # Express server entry point
│   └── package.json                       # Node dependencies
│
├── docs/                                  # Project Documentation & System Specifications
│   ├── DOCKER_DEPLOYMENT_GUIDE.md         # Docker & Cloud Deployment Guide
│   ├── PROJECT_TECHNICAL_OVERVIEW.md      # System Architecture & Technical Specs
│   ├── HARDWARE_INTERFACE_SPECIFICATION.md# IoT Hardware Protocol Specs
│   ├── PRODUCT_REQUIREMENT_DOCUMENT.md    # Product Requirements Document (PRD)
│   ├── FOLDER_STRUCTURE_RULES.md          # Clean Architecture & Directory Rules
│   ├── VOUCHER_SYSTEM_SUMMARY.md          # E-commerce Voucher System Specs
│   ├── ADDRESS_PINCODE_IMPLEMENTATION.md  # Address & Pincode Lookup Specs
│   ├── FLUTTER_FORM_CONTROLLER_PATTERN.md # Form & Controller Patterns
│   ├── TOUR_IMPLEMENTATION.md             # Onboarding Tour Feature Specs
│   ├── PERFORMANCE_REPORT.md              # Performance Metrics & Benchmarks
│   └── FUTURE_SPECIFICATION.md            # System Roadmap & Future Features
│
├── docker-compose.yml                     # Production Docker Compose orchestration
├── docker-compose.dev.yml                 # Local Development Docker Compose override
├── .env.docker.example                    # Docker environment configuration template
└── README.md                              # Main Project Readme
```

---

## ✨ Features

### **📱 Flutter Mobile App (End User)**

#### **Authentication**
- ✅ User signup with email/phone
- ✅ Login with JWT authentication
- ✅ Token-based session management
- ✅ Auto-login on app restart

#### **Device Management**
- ✅ Add/configure IoT devices (via QR scan)
- ✅ View device list with real-time status
- ✅ Device details (telemetry, motor status)
- ✅ Device history (usage logs, CSV export)
- ✅ Device analytics (charts, graphs)
- ✅ Remote motor control (ON/OFF via MQTT)
- ✅ Real-time notifications (device alerts)

#### **E-commerce (Shop)**
- ✅ Browse products with search & filters
- ✅ Product details page
- ✅ Add to cart, update quantity
- ✅ Apply discount vouchers
- ✅ Multiple delivery addresses
- ✅ Razorpay payment integration
- ✅ Order history & tracking
- ✅ Order details with PDF invoice
- ✅ Manage saved addresses

#### **Dashboard**
- ✅ Device usage statistics
- ✅ Water level monitoring
- ✅ Power consumption charts
- ✅ Real-time telemetry display

#### **Profile & Settings**
- ✅ Edit profile (name, phone, email)
- ✅ Light/Dark theme toggle
- ✅ Privacy policy page
- ✅ Notification preferences
- ✅ Logout functionality

#### **Background Services**
- ✅ Background MQTT listening
- ✅ Push notifications (foreground/background)
- ✅ Location tracking (optional)
- ✅ Offline data sync

---

### **💻 React Admin Panel**

#### **Dashboard**
- ✅ Total users, devices, orders, revenue
- ✅ Recent orders table
- ✅ Real-time device status
- ✅ Analytics charts (sales, usage)

#### **User Management**
- ✅ View all users (paginated)
- ✅ Search users by name/email
- ✅ Activate/Deactivate users
- ✅ Assign roles (Admin, User)

#### **Device Management**
- ✅ View all registered devices
- ✅ Device telemetry monitoring
- ✅ Send remote commands
- ✅ Device activity logs
- ✅ Google Maps integration (device location)

#### **Product Management**
- ✅ Add/Edit/Delete products
- ✅ Upload product images
- ✅ Set pricing, stock, categories
- ✅ Product visibility toggle

#### **Order Management**
- ✅ View all orders (pending, shipped, delivered)
- ✅ Update order status
- ✅ View order details (items, address, payment)
- ✅ Generate PDF invoices

#### **Voucher Management**
- ✅ Create discount vouchers
- ✅ Set discount %, validity dates
- ✅ Usage limits & tracking
- ✅ Active/Scheduled/Expired status
- ✅ Real-time server time validation
- ✅ Search & pagination

#### **Real-time Monitoring**
- ✅ Socket.IO live data updates
- ✅ MQTT message logs
- ✅ Device status notifications

---

## 📊 Database Models

### **MongoDB Collections**

#### **1. User**
```javascript
{
  name: String,
  email: String (unique),
  phone_number: String,
  password: String (bcrypt hashed),
  role: ObjectId (ref: Role),
  active: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### **2. Device**
```javascript
{
  name: String,
  serial_number: String (unique),
  device_id: String,
  owner: ObjectId (ref: User),
  location: { latitude: Number, longitude: Number },
  status: String (online/offline),
  createdAt: Date
}
```

#### **3. Telemetry**
```javascript
{
  device_id: String,
  serial_number: String,
  motor_status: Boolean,
  water_level: Number,
  power_consumption: Number,
  voltage: Number,
  timestamp: Date
}
```

#### **4. Product**
```javascript
{
  name: String,
  description: String,
  price: Number,
  category: String,
  stock: Number,
  image: String (URL),
  active: Boolean,
  createdAt: Date
}
```

#### **5. Cart**
```javascript
{
  user_id: ObjectId (ref: User),
  items: [
    {
      product_id: ObjectId (ref: Product),
      quantity: Number,
      price: Number
    }
  ],
  total: Number
}
```

#### **6. Order**
```javascript
{
  user_id: ObjectId (ref: User),
  items: Array,
  total_amount: Number,
  discount_amount: Number,
  final_amount: Number,
  payment_status: String (pending/completed),
  order_status: String (pending/shipped/delivered),
  shipping_address: ObjectId (ref: Address),
  razorpay_order_id: String,
  voucher_code: String,
  createdAt: Date
}
```

#### **7. Address**
```javascript
{
  user_id: ObjectId (ref: User),
  full_name: String,
  phone: String,
  address_line1: String,
  address_line2: String,
  city: String,
  state: String,
  pincode: String,
  is_default: Boolean
}
```

#### **8. Voucher**
```javascript
{
  voucher_code: String (unique, uppercase),
  discount_percentage: Number (0-100),
  start_date: Date,
  end_date: Date,
  max_usage: Number,
  used_count: Number,
  status: Boolean (active/inactive),
  description: String,
  createdBy: String,
  createdAt: Date
}
```

#### **9. Role**
```javascript
{
  role_name: String (Admin, User),
  permissions: [String]
}
```

---

## 🚀 Installation & Setup

### **Prerequisites**
- **Node.js** 16+ and npm
- **MongoDB** (Local or MongoDB Atlas)
- **Flutter** 3.10+ SDK
- **MQTT Broker** (Mosquitto or cloud MQTT)
- **Android Studio / Xcode** (for mobile build)

---

### **1️⃣ Backend Setup**

```bash
# Navigate to backend folder
cd BACKEND

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

**Edit `.env` file:**
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/agri_automation
# or MongoDB Atlas: mongodb+srv://user:pass@cluster.mongodb.net/db

# JWT Secret
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Server
PORT=3030

# MQTT Broker
MQTT_BROKER=mqtt://broker.hivemq.com
MQTT_PORT=1883
MQTT_USERNAME=your-username
MQTT_PASSWORD=your-password

# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

**Bootstrap admin user:**
```bash
node scripts/bootstrapAdmin.js
```

**Start backend server:**
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

**Server will run on:**
- Local: `http://localhost:3030`
- Network: `http://<YOUR_LOCAL_IP>:3030`
- Swagger: `http://localhost:3030/api-docs`

---

### **2️⃣ Flutter App Setup**

```bash
# Navigate to Flutter app
cd FRONTEND/App/end_user

# Install dependencies
flutter pub get

# Configure backend API URL
# Edit: lib/core/services/api_config.dart
# Update BASE_URL to your backend IP:PORT

# Run on connected device/emulator
flutter run

# Build APK (Android)
flutter build apk --release

# Build iOS
flutter build ios --release
```

**Important configurations:**

**`lib/core/services/api_config.dart`:**
```dart
class ApiConfig {
  static const String BASE_URL = 'http://192.168.1.100:3030'; // Your backend IP
  static const String SOCKET_URL = 'http://192.168.1.100:3030';
}
```

**`android/app/src/main/AndroidManifest.xml`:**
```xml
<!-- Add permissions -->
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

---

### **3️⃣ React Admin Panel Setup**

```bash
# Navigate to admin panel
cd FRONTEND/Admin

# Install dependencies
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:3030" > .env

# Start development server
npm start

# Build for production
npm run build
```

**Admin Panel URL:** `http://localhost:6061`

**Default Admin Credentials:**
- Email: `admin@example.com`
- Password: `admin123` (change after first login)

---

## 🏃 Running the Application

### **Full Stack Development**

**Terminal 1 - Backend:**
```bash
cd BACKEND
npm run dev
```

**Terminal 2 - Admin Panel:**
```bash
cd FRONTEND/Admin
npm start
```

**Terminal 3 - Flutter App:**
```bash
cd FRONTEND/App/end_user
flutter run
```

**Terminal 4 - MQTT Broker (if local):**
```bash
mosquitto -c mosquitto.conf
---

## 📚 API Documentation

### **Swagger UI**
Access interactive API documentation at:
```
http://localhost:3030/api-docs
```

### **Key API Endpoints**

#### **Authentication**
- `POST /app/signup` - User registration
- `POST /app/login` - User login
- `POST /app/refresh-token` - Refresh JWT

#### **Device Management**
- `GET /app/devices` - Get user devices
- `POST /app/devices` - Register new device
- `GET /app/device/:id` - Get device details
- `POST /app/device/control` - Send MQTT command
- `GET /app/device/:id/telemetry` - Get telemetry logs

#### **E-commerce**
- `GET /app/products` - List products
- `GET /app/product/:id` - Product details
- `POST /app/cart/add` - Add to cart
- `GET /app/cart` - View cart
- `POST /app/order/create` - Create order
- `POST /app/validateVoucher` - Validate voucher

#### **Admin**
- `GET /admin/users` - List all users
- `GET /admin/devices` - List all devices
- `GET /admin/orders` - List all orders
- `POST /admin/createVoucher` - Create voucher
- `GET /admin/getAllVouchers` - List vouchers

**Authorization Header:**
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔐 Environment Variables

### **Backend (.env)**
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/db` |
| `JWT_SECRET` | Secret key for JWT | `your-secret-key` |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `PORT` | Server port | `3030` |
| `MQTT_BROKER` | MQTT broker URL | `mqtt://broker.hivemq.com` |
| `MQTT_PORT` | MQTT port | `1883` |
| `MQTT_USERNAME` | MQTT username | `user` |
| `MQTT_PASSWORD` | MQTT password | `pass` |
| `RAZORPAY_KEY_ID` | Razorpay key | `rzp_test_xxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | `xxx` |

### **Flutter App**
Update `lib/core/services/api_config.dart`:
```dart
static const String BASE_URL = 'http://YOUR_IP:3030';
static const String RAZORPAY_KEY = 'rzp_test_xxx';
```

### **React Admin**
Create `.env`:
```env
REACT_APP_API_URL=http://localhost:3030
REACT_APP_GOOGLE_MAPS_KEY=your-google-maps-api-key
```

---

## 📦 Additional Documentation

- **Voucher System**: [VOUCHER_SYSTEM_SUMMARY.md](./VOUCHER_SYSTEM_SUMMARY.md)
- **Admin Panel Theme**: [FRONTEND/Admin/THEME_CHANGES.md](./FRONTEND/Admin/THEME_CHANGES.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m "Add new feature"`
4. Push to branch: `git push origin feature/new-feature`
5. Submit Pull Request

---

## 📄 License

This project is proprietary and confidential.

---

## 📧 Support

For issues or questions:
- Create an issue on GitHub
- Email: support@autoharverst.com

---

**Built with ❤️ for IoT and Automation**
