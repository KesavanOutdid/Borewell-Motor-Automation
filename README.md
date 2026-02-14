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
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)

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
├── README.md                              # This file
└── VOUCHER_SYSTEM_SUMMARY.md              # Voucher feature docs
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
```

---

nDisplayChanged oldDisplayState=3 newDisplayState=4
I/VRI[MainActivity]@f3ac994(12091): onDisplayChanged oldDisplayState=4 newDisplayState=3
I/VRI[MainActivity]@f3ac994(12091): onDisplayChanged oldDisplayState=3 newDisplayState=1
I/PhenotypeProcessReaper(12091): Memory state is: 125
I/VRI[MainActivity]@f3ac994(12091): onDisplayChanged oldDisplayState=1 newDisplayState=2
D/SV[169759259 MainActivity](12091): updateSurface: surface is not valid
I/SV[169759259 MainActivity](12091): releaseSurfaces: viewRoot = VRI[MainActivity]@f3ac994
D/VRI[MainActivity]@f3ac994(12091): applyTransactionOnDraw applyImmediately
I/VRI[MainActivity]@f3ac994(12091): handleAppVisibility mAppVisible = false visible = true
I/VRI[MainActivity]@f3ac994(12091): stopped(false) old = true
D/VRI[MainActivity]@f3ac994(12091): WindowStopped on com.example.end_user/com.example.end_user.MainActivity set to false
D/SV[169759259 MainActivity](12091): updateSurface: surface is not valid
I/SV[169759259 MainActivity](12091): releaseSurfaces: viewRoot = VRI[MainActivity]@f3ac994
D/VRI[MainActivity]@f3ac994(12091): applyTransactionOnDraw applyImmediately
I/SV[169759259 MainActivity](12091): onWindowVisibilityChanged(0) false io.flutter.embedding.android.FlutterSurfaceView{a1e521b V.E...... ......ID 0,0-1080,2340} of VRI[MainActivity]@f3ac994
D/SV[169759259 MainActivity](12091): updateSurface: surface is not valid
I/SV[169759259 MainActivity](12091): releaseSurfaces: viewRoot = VRI[MainActivity]@f3ac994
D/VRI[MainActivity]@f3ac994(12091): applyTransactionOnDraw applyImmediately
I/InsetsController(12091): onStateChanged: host=com.example.end_user/com.example.end_user.MainActivity, from=android.view.ViewRootImpl.onInsetsStateChanged:3026, state=InsetsState: {mDisplayFrame=Rect(0, 0 - 1080, 2340), mDisplayCutout=DisplayCutout{insets=Rect(0, 99 - 0, 0) waterfall=Insets{left=0, top=0, right=0, bottom=0} boundingRect={Bounds=[Rect(0, 0 - 0, 0), Rect(505, 0 - 575, 99), Rect(0, 0 - 0, 0), Rect(0, 0 - 0, 0)]} cutoutPathParserInfo={CutoutPathParserInfo{displayWidth=1080 displayHeight=2340 physicalDisplayWidth=1080 physicalDisplayHeight=2340 density={3.0} cutoutSpec={M 0,0 M 0,29 a 35,35 0 1,0 0,70 a 35,35 0 1,0 0,-70 Z} rotation={0} scale={1.0} physicalPixelDisplaySizeRatio={1.0}}} sideOverrides={}}, mRoundedCorners=RoundedCorners{[RoundedCorner{position=TopLeft, radius=108, center=Point(108, 108)}, RoundedCorner{position=TopRight, radius=108, center=Point(972, 108)}, RoundedCorner{position=BottomRight, radius=108, center=Point(972, 2232)}, RoundedCorner{position=BottomLeft, radius=108, center=Point(108, 2232)}]}  mRoundedCornerFrame=Rect(0, 0 - 1080, 2340), mPrivacyIndicatorBounds=PrivacyIndicatorBounds {static bounds=Rect(948, 0 - 1080, 99) rotation=0}, mDisplayShape=DisplayShape{ spec=-311912193 displayWidth=1080 displayHeight=2340 physicalPixelDisplaySizeRatio=1.0 rotation=0 offsetX=0 offsetY=0 scale=1.0}, mSources= { InsetsSource: {a6430000 mType=statusBars mFrame=[0,0][1080,99] mVisible=true mFlags= mSideHint=TOP mBoundingRects=null}, InsetsSource: {a6430005 mType=mandatorySystemGestures mFrame=[0,0][1080,135] mVisible=true mFlags= mSideHint=TOP mBoundingRects=null}, InsetsSource: {a6430006 mType=tappableElement mFrame=[0,0][1080,99] mVisible=true mFlags= mSideHint=TOP mBoundingRects=null}, InsetsSource: {b2a30001 mType=navigationBars mFrame=[0,2295][1080,2340] mVisible=false mFlags=SUPPRESS_SCRIM mSideHint=BOTTOM mBoundingRects=null}, InsetsSource: {b2a30004 mType=systemGestures mFrame=[0,0][90,2340] mVisible=true mFlags= mSideHint=LEFT mBoundingRects=null}, InsetsSource: {b2a30005 mType=mandatorySystemGestures mFrame=[0,2244][1080,2340] mVisible=true mFlags= mSideHint=BOTTOM mBoundingRects=null}, InsetsSource: {b2a30006 mType=tappableElement mFrame=[0,0][0,0] mVisible=true mFlags= mSideHint=NONE mBoundingRects=null}, InsetsSource: {b2a30024 mType=systemGestures mFrame=[990,0][1080,2340] mVisible=true mFlags= mSideHint=RIGHT mBoundingRects=null}, InsetsSource: {3 mType=ime mFrame=[0,0][0,0] mVisible=false mFlags= mSideHint=NONE mBoundingRects=null}, InsetsSource: {27 mType=displayCutout mFrame=[0,0][1080,99] mVisible=true mFlags= mSideHint=TOP mBoundingRects=null} }
W/libc    (12091): Access denied finding property "vendor.display.enable_optimal_refresh_rate"
I/BufferQueueProducer(12091): [](id:2f3b00000019,api:0,p:0,c:12091) setDequeueTimeout:2077252342
I/BLASTBufferQueue_Java(12091): new BLASTBufferQueue, mName= VRI[MainActivity]@f3ac994 mNativeObject= 0xb400006dd4778da0 caller= android.view.ViewRootImpl.updateBlastSurfaceIfNeeded:3585 android.view.ViewRootImpl.relayoutWindow:11685 android.view.ViewRootImpl.performTraversals:4804 android.view.ViewRootImpl.doTraversal:3924 android.view.ViewRootImpl$TraversalRunnable.run:12903 android.view.Choreographer$CallbackRecord.run:1901 android.view.Choreographer$CallbackRecord.run:1910 android.view.Choreographer.doCallbacks:1367 android.view.Choreographer.doFrame:1292 android.view.Choreographer$FrameDisplayEventReceiver.run:1870 
I/BLASTBufferQueue_Java(12091): update, w= 1080 h= 2340 mName = VRI[MainActivity]@f3ac994 mNativeObject= 0xb400006dd4778da0 sc.mNativeObject= 0xb400006d94725550 format= -3 caller= android.view.ViewRootImpl.updateBlastSurfaceIfNeeded:3590 android.view.ViewRootImpl.relayoutWindow:11685 android.view.ViewRootImpl.performTraversals:4804 android.view.ViewRootImpl.doTraversal:3924 android.view.ViewRootImpl$TraversalRunnable.run:12903 android.view.Choreographer$CallbackRecord.run:1901 
W/libc    (12091): Access denied finding property "vendor.display.enable_optimal_refresh_rate"
I/VRI[MainActivity]@f3ac994(12091): Relayout returned: old=(0,0,1080,2340) new=(0,0,1080,2340) relayoutAsync=false req=(1080,2340)0 dur=16 res=0x3 s={true 0xb400006f24708360} ch=true seqId=0
D/VRI[MainActivity]@f3ac994(12091): mThreadedRenderer.initialize() mSurface={isValid=true 0xb400006f24708360} hwInitialized=true
I/SV[169759259 MainActivity](12091): windowStopped(false) true io.flutter.embedding.android.FlutterSurfaceView{a1e521b V.E...... ......ID 0,0-1080,2340} of VRI[MainActivity]@f3ac994
I/SurfaceView(12091): 169759259 Changes: creating=true format=false size=false visible=true alpha=false hint=false left=false top=false z=false attached=true lifecycleStrategy=false
W/libc    (12091): Access denied finding property "vendor.display.enable_optimal_refresh_rate"
I/BufferQueueProducer(12091): [](id:2f3b0000001a,api:0,p:0,c:12091) setDequeueTimeout:2077252342
I/BLASTBufferQueue_Java(12091): new BLASTBufferQueue, mName= a1e521b SurfaceView[com.example.end_user/com.example.end_user.MainActivity]@0 mNativeObject= 0xb400006dd46ed4f0 caller= android.view.SurfaceView.createBlastSurfaceControls:1781 android.view.SurfaceView.updateSurface:1450 android.view.SurfaceView.setWindowStopped:539 android.view.SurfaceView.surfaceCreated:2327 android.view.ViewRootImpl.notifySurfaceCreated:3502 android.view.ViewRootImpl.performTraversals:5286 android.view.ViewRootImpl.doTraversal:3924 android.view.ViewRootImpl$TraversalRunnable.run:12903 android.view.Choreographer$CallbackRecord.run:1901 android.view.Choreographer$CallbackRecord.run:1910 
I/BLASTBufferQueue_Java(12091): update, w= 1080 h= 2340 mName = a1e521b SurfaceView[com.example.end_user/com.example.end_user.MainActivity]@0 mNativeObject= 0xb400006dd46ed4f0 sc.mNativeObject= 0xb400006d946a55d0 format= 4 caller= android.view.SurfaceView.createBlastSurfaceControls:1782 android.view.SurfaceView.updateSurface:1450 android.view.SurfaceView.setWindowStopped:539 android.view.SurfaceView.surfaceCreated:2327 android.view.ViewRootImpl.notifySurfaceCreated:3502 android.view.ViewRootImpl.performTraversals:5286 
I/SurfaceView(12091): 169759259 Cur surface: Surface(name=null mNativeObject=0)/@0x1d24edf
D/SurfaceComposerClient(12091): setCornerRadius ## a1e521b SurfaceView[com.example.end_user/com.example.end_user.MainActivity]@0#5051 cornerRadius=0.000000
I/SV[169759259 MainActivity](12091): pST: sr = Rect(0, 0 - 1080, 2340) sw = 1080 sh = 2340
D/SurfaceView(12091): 169759259 performSurfaceTransaction RenderWorker position = [0, 0, 1080, 2340] surfaceSize = 1080x2340
W/libc    (12091): Access denied finding property "vendor.display.enable_optimal_refresh_rate"
I/SV[169759259 MainActivity](12091): updateSurface: mVisible = true mSurface.isValid() = true
I/SV[169759259 MainActivity](12091): updateSurface: mSurfaceCreated = false surfaceChanged = true visibleChanged = true
I/SurfaceView(12091): 169759259 visibleChanged -- surfaceCreated
I/SV[169759259 MainActivity](12091): surfaceCreated 1 #1 io.flutter.embedding.android.FlutterSurfaceView{a1e521b V.E...... ......ID 0,0-1080,2340}
E/qdgralloc(12091): GetGpuPixelFormat: No map for format: 0x38
E/AdrenoUtils(12091): <validate_memory_layout_input_parmas:1970>: Unknown Format 0
E/AdrenoUtils(12091): <adreno_init_memory_layout:4720>: Memory Layout input parameter validation failed!
E/qdgralloc(12091): GetGpuResourceSizeAndDimensions Graphics metadata init failed
E/Gralloc4(12091): isSupported(1, 1, 56, 1, ...) failed with 1
E/GraphicBufferAllocator(12091): Failed to allocate (4 x 4) layerCount 1 format 56 usage b00: 1
E/AHardwareBuffer(12091): GraphicBuffer(w=4, h=4, lc=1) failed (Unknown error -1), handle=0x0
E/qdgralloc(12091): GetGpuPixelFormat: No map for format: 0x3b
E/AdrenoUtils(12091): <validate_memory_layout_input_parmas:1970>: Unknown Format 0
E/AdrenoUtils(12091): <adreno_init_memory_layout:4720>: Memory Layout input parameter validation failed!
E/qdgralloc(12091): GetGpuResourceSizeAndDimensions Graphics metadata init failed
E/Gralloc4(12091): isSupported(1, 1, 59, 1, ...) failed with 1
E/GraphicBufferAllocator(12091): Failed to allocate (4 x 4) layerCount 1 format 59 usage b00: 1
E/AHardwareBuffer(12091): GraphicBuffer(w=4, h=4, lc=1) failed (Unknown error -1), handle=0x0
E/qdgralloc(12091): GetGpuPixelFormat: No map for format: 0x38
E/AdrenoUtils(12091): <validate_memory_layout_input_parmas:1970>: Unknown Format 0
E/AdrenoUtils(12091): <adreno_init_memory_layout:4720>: Memory Layout input parameter validation failed!
E/qdgralloc(12091): GetGpuResourceSizeAndDimensions Graphics metadata init failed
E/Gralloc4(12091): isSupported(1, 1, 56, 1, ...) failed with 1
E/GraphicBufferAllocator(12091): Failed to allocate (4 x 4) layerCount 1 format 56 usage b00: 1
E/AHardwareBuffer(12091): GraphicBuffer(w=4, h=4, lc=1) failed (Unknown error -1), handle=0x0
E/qdgralloc(12091): GetGpuPixelFormat: No map for format: 0x3b
E/AdrenoUtils(12091): <validate_memory_layout_input_parmas:1970>: Unknown Format 0
E/AdrenoUtils(12091): <adreno_init_memory_layout:4720>: Memory Layout input parameter validation failed!
E/qdgralloc(12091): GetGpuResourceSizeAndDimensions Graphics metadata init failed
E/Gralloc4(12091): isSupported(1, 1, 59, 1, ...) failed with 1
E/GraphicBufferAllocator(12091): Failed to allocate (4 x 4) layerCount 1 format 59 usage b00: 1
E/AHardwareBuffer(12091): GraphicBuffer(w=4, h=4, lc=1) failed (Unknown error -1), handle=0x0
I/SurfaceView(12091): 169759259 surfaceChanged -- format=4 w=1080 h=2340
I/SV[169759259 MainActivity](12091): surfaceChanged (1080,2340) 1 #1 io.flutter.embedding.android.FlutterSurfaceView{a1e521b V.E...... ......ID 0,0-1080,2340}
I/SurfaceView(12091): 169759259 surfaceRedrawNeeded
V/SurfaceView(12091): Layout: x=0 y=0 w=1080 h=2340, frame=Rect(0, 0 - 1080, 2340)
D/VRI[MainActivity]@f3ac994(12091): reportNextDraw android.view.ViewRootImpl.performTraversals:5443 android.view.ViewRootImpl.doTraversal:3924 android.view.ViewRootImpl$TraversalRunnable.run:12903 android.view.Choreographer$CallbackRecord.run:1901 android.view.Choreographer$CallbackRecord.run:1910 
D/VRI[MainActivity]@f3ac994(12091): Setup new sync=wmsSync-VRI[MainActivity]@f3ac994#15
I/VRI[MainActivity]@f3ac994(12091): Creating new active sync group VRI[MainActivity]@f3ac994#16
D/VRI[MainActivity]@f3ac994(12091): Start draw after previous draw not visible
D/VRI[MainActivity]@f3ac994(12091): registerCallbacksForSync syncBuffer=false
D/SurfaceView(12091): 169759259 updateSurfacePosition RenderWorker, frameNr = 1, position = [0, 0, 1080, 2340] surfaceSize = 1080x2340
I/SV[169759259 MainActivity](12091): uSP: rtp = Rect(0, 0 - 1080, 2340) rtsw = 1080 rtsh = 2340
I/SV[169759259 MainActivity](12091): onSSPAndSRT: pl = 0 pt = 0 sx = 1.0 sy = 1.0
I/SV[169759259 MainActivity](12091): aOrMT: VRI[MainActivity]@f3ac994 t = android.view.SurfaceControl$Transaction@682b283 fN = 1 android.view.SurfaceView.-$$Nest$mapplyOrMergeTransaction:0 android.view.SurfaceView$SurfaceViewPositionUpdateListener.positionChanged:1932 android.graphics.RenderNode$CompositePositionUpdateListener.positionChanged:401 
I/VRI[MainActivity]@f3ac994(12091): mWNT: t=0xb400006ee4806b10 mBlastBufferQueue=0xb400006dd4778da0 fn= 1 HdrRenderState mRenderHdrSdrRatio=1.0 caller= android.view.SurfaceView.applyOrMergeTransaction:1863 android.view.SurfaceView.-$$Nest$mapplyOrMergeTransaction:0 android.view.SurfaceView$SurfaceViewPositionUpdateListener.positionChanged:1932 
D/VRI[MainActivity]@f3ac994(12091): Received frameDrawingCallback syncResult=0 frameNum=1.
I/VRI[MainActivity]@f3ac994(12091): mWNT: t=0xb400006ee4710990 mBlastBufferQueue=0xb400006dd4778da0 fn= 1 HdrRenderState mRenderHdrSdrRatio=1.0 caller= android.view.ViewRootImpl$12.onFrameDraw:15441 android.view.ThreadedRenderer$1.onFrameDraw:718 <bottom of call stack> 
I/VRI[MainActivity]@f3ac994(12091): Setting up sync and frameCommitCallback
I/BLASTBufferQueue(12091): [VRI[MainActivity]@f3ac994#7](f:0,a:0,s:0) onFrameAvailable the first frame is available
I/SurfaceComposerClient(12091): apply transaction with the first frame. layerId: 5047, bufferData(ID: 51930449576113, frameNumber: 1)
I/VRI[MainActivity]@f3ac994(12091): Received frameCommittedCallback lastAttemptedDrawFrameNum=1 didProduceBuffer=true
I/InsetsController(12091): onStateChanged: host=com.example.end_user/com.example.end_user.MainActivity, from=android.view.ViewRootImpl.onInsetsStateChanged:3026, state=InsetsState: {mDisplayFrame=Rect(0, 0 - 1080, 2340), mDisplayCutout=DisplayCutout{insets=Rect(0, 99 - 0, 0) waterfall=Insets{left=0, top=0, right=0, bottom=0} boundingRect={Bounds=[Rect(0, 0 - 0, 0), Rect(505, 0 - 575, 99), Rect(0, 0 - 0, 0), Rect(0, 0 - 0, 0)]} cutoutPathParserInfo={CutoutPathParserInfo{displayWidth=1080 displayHeight=2340 physicalDisplayWidth=1080 physicalDisplayHeight=2340 density={3.0} cutoutSpec={M 0,0 M 0,29 a 35,35 0 1,0 0,70 a 35,35 0 1,0 0,-70 Z} rotation={0} scale={1.0} physicalPixelDisplaySizeRatio={1.0}}} sideOverrides={}}, mRoundedCorners=RoundedCorners{[RoundedCorner{position=TopLeft, radius=108, center=Point(108, 108)}, RoundedCorner{position=TopRight, radius=108, center=Point(972, 108)}, RoundedCorner{position=BottomRight, radius=108, center=Point(972, 2232)}, RoundedCorner{position=BottomLeft, radius=108, center=Point(108, 2232)}]}  mRoundedCornerFrame=Rect(0, 0 - 1080, 2340), mPrivacyIndicatorBounds=PrivacyIndicatorBounds {static bounds=Rect(948, 0 - 1080, 99) rotation=0}, mDisplayShape=DisplayShape{ spec=-311912193 displayWidth=1080 displayHeight=2340 physicalPixelDisplaySizeRatio=1.0 rotation=0 offsetX=0 offsetY=0 scale=1.0}, mSources= { InsetsSource: {a6430000 mType=statusBars mFrame=[0,0][1080,99] mVisible=true mFlags= mSideHint=TOP mBoundingRects=null}, InsetsSource: {a6430005 mType=mandatorySystemGestures mFrame=[0,0][1080,135] mVisible=true mFlags= mSideHint=TOP mBoundingRects=null}, InsetsSource: {a6430006 mType=tappableElement mFrame=[0,0][1080,99] mVisible=true mFlags= mSideHint=TOP mBoundingRects=null}, InsetsSource: {b2a30001 mType=navigationBars mFrame=[0,2295][1080,2340] mVisible=true mFlags=SUPPRESS_SCRIM mSideHint=BOTTOM mBoundingRects=null}, InsetsSource: {b2a30004 mType=systemGestures mFrame=[0,0][90,2340] mVisible=true mFlags= mSideHint=LEFT mBoundingRects=null}, InsetsSource: {b2a30005 mType=mandatorySystemGestures mFrame=[0,2244][1080,2340] mVisible=true mFlags= mSideHint=BOTTOM mBoundingRects=null}, InsetsSource: {b2a30006 mType=tappableElement mFrame=[0,0][0,0] mVisible=true mFlags= mSideHint=NONE mBoundingRects=null}, InsetsSource: {b2a30024 mType=systemGestures mFrame=[990,0][1080,2340] mVisible=true mFlags= mSideHint=RIGHT mBoundingRects=null}, InsetsSource: {3 mType=ime mFrame=[0,0][0,0] mVisible=false mFlags= mSideHint=NONE mBoundingRects=null}, InsetsSource: {27 mType=displayCutout mFrame=[0,0][1080,99] mVisible=true mFlags= mSideHint=TOP mBoundingRects=null} }
I/VRI[MainActivity]@f3ac994(12091): handleResized, frames=ClientWindowFrames{frame=[0,0][1080,2340] display=[0,0][1080,2340] parentFrame=[0,0][0,0]} displayId=0 dragResizing=false compatScale=1.0 frameChanged=false attachedFrameChanged=false configChanged=false displayChanged=false compatScaleChanged=false dragResizingChanged=false
I/VRI[MainActivity]@f3ac994(12091): handleResized mSyncSeqId = 0
D/VRI[MainActivity]@f3ac994(12091): reportNextDraw android.view.ViewRootImpl.handleResized:2983 android.view.ViewRootImpl.-$$Nest$mhandleResized:0 android.view.ViewRootImpl$W.resized:14082 android.app.servertransaction.WindowStateResizeItem.execute:93 android.app.servertransaction.WindowStateTransactionItem.execute:62 
I/VRI[MainActivity]@f3ac994(12091): handleResized, frames=ClientWindowFrames{frame=[0,0][1080,2340] display=[0,0][1080,2340] parentFrame=[0,0][0,0]} displayId=0 dragResizing=false compatScale=1.0 frameChanged=false attachedFrameChanged=false configChanged=false displayChanged=false compatScaleChanged=false dragResizingChanged=false
I/VRI[MainActivity]@f3ac994(12091): handleResized mSyncSeqId = 0
D/VRI[MainActivity]@f3ac994(12091): reportNextDraw android.view.ViewRootImpl.handleResized:2983 android.view.ViewRootImpl.-$$Nest$mhandleResized:0 android.view.ViewRootImpl$W.resized:14082 android.app.servertransaction.WindowStateResizeItem.execute:93 android.app.servertransaction.WindowStateTransactionItem.execute:62 
D/VRI[MainActivity]@f3ac994(12091): Setup new sync=wmsSync-VRI[MainActivity]@f3ac994#17
I/VRI[MainActivity]@f3ac994(12091): Creating new active sync group VRI[MainActivity]@f3ac994#18
D/VRI[MainActivity]@f3ac994(12091): registerCallbacksForSync syncBuffer=false
D/VRI[MainActivity]@f3ac994(12091): Received frameDrawingCallback syncResult=0 frameNum=2.
I/VRI[MainActivity]@f3ac994(12091): Setting up sync and frameCommitCallback
I/VRI[MainActivity]@f3ac994(12091): Received frameCommittedCallback lastAttemptedDrawFrameNum=2 didProduceBuffer=false
I/BLASTBufferQueue_Java(12091): gatherPendingTransactions, mName= VRI[MainActivity]@f3ac994 mNativeObject= 0xb400006dd4778da0 frameNumber= 2 caller= android.view.ViewRootImpl$12.lambda$onFrameDraw$3:15525 android.view.ViewRootImpl$12.$r8$lambda$CTo3ExVBk8akdVTGlqHPAoYLRVI:0 android.view.ViewRootImpl$12$$ExternalSyntheticLambda1.onFrameCommit:0 android.view.ThreadedRenderer$1.lambda$onFrameDraw$0:730 android.view.ThreadedRenderer$1$$ExternalSyntheticLambda0.onFrameCommit:0 <bottom of call stack> 
D/VRI[MainActivity]@f3ac994(12091): reportDrawFinished seqId=0
I/BLASTBufferQueue(12091): [a1e521b SurfaceView[com.example.end_user/com.example.end_user.MainActivity]@0#8](f:0,a:0,s:0) onFrameAvailable the first frame is available
I/SurfaceComposerClient(12091): apply transaction with the first frame. layerId: 5052, bufferData(ID: 51930449576108, frameNumber: 1)
D/VRI[MainActivity]@f3ac994(12091): reportDrawFinished seqId=0
I/SurfaceView(12091): 169759259 finishedDrawing
I/InsetsSourceConsumer(12091): applyRequestedVisibilityToControl: visible=true, type=navigationBars, host=com.example.end_user/com.example.end_user.MainActivity
I/InsetsSourceConsumer(12091): applyRequestedVisibilityToControl: visible=true, type=statusBars, host=com.example.end_user/com.example.end_user.MainActivity
D/VRI[MainActivity]@f3ac994(12091): mThreadedRenderer.initializeIfNeeded()#2 mSurface={isValid=true 0xb400006f24708360}
D/InputMethodManagerUtils(12091): startInputInner - Id : 0
I/InputMethodManager(12091): startInputInner - IInputMethodManagerGlobalInvoker.startInputOrWindowGainedFocus
I/InputMethodManager(12091): handleMessage: setImeVisibility visible=false
D/InsetsController(12091): hide(ime(), fromIme=false)
I/ImeTracker(12091): com.example.end_user:91bc6762: onCancelled at PHASE_CLIENT_ALREADY_HIDDEN
D/InputTransport(12091): Input channel constructed: 'ClientS', fd=223

lib/feature/end_user_app/home/presentation/controllers/home_controller.dart:294:17: Error: Can't find ')' to match '('.
      Get.dialog(
                ^
lib/feature/end_user_app/device/presentation/controllers/add_device_controller.dart:73:21: Error: Can't find ')' to match '('.
          Get.dialog(
                    ^
lib/feature/end_user_app/device/presentation/controllers/add_device_controller.dart:172:21: Error: Can't find ')' to match '('.
          Get.dialog(
                    ^
lib/feature/end_user_app/device/presentation/controllers/add_device_controller.dart:427:17: Error: Can't find ')' to match '('.
      Get.dialog(
                ^
Performing hot reload...                                                
Try again after fixing the above error(s).

lib/feature/end_user_app/home/presentation/controllers/home_controller.dart:294:17: Error: Can't find ')' to match '('.
      Get.dialog(
                ^
lib/feature/end_user_app/device/presentation/controllers/add_device_controller.dart:73:21: Error: Can't find ')' to match '('.
          Get.dialog(
                    ^
lib/feature/end_user_app/device/presentation/controllers/add_device_controller.dart:172:21: Error: Can't find ')' to match '('.
          Get.dialog(
                    ^
lib/feature/end_user_app/device/presentation/controllers/add_device_controller.dart:427:17: Error: Can't find ')' to match '('.
      Get.dialog(
                ^
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
