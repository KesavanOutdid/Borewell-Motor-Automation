# Borewell Motor Automation - Project Documentation

## 1. Project Overview
The **Borewell Motor Automation** system is an IoT-based solution designed to remotely monitor and control borewell motors. It allows users to start/stop motors, monitor real-time electrical parameters (voltage, current, power), and receive alerts for critical conditions like dry runs or overloads through a mobile application.

---

## 2. Technology Stack

### **Frontend (Mobile Application)**
- **Framework**: [Flutter](https://flutter.dev/) (Cross-platform Android/iOS)
- **Language**: [Dart](https://dart.dev/)
- **State Management**: [GetX](https://pub.dev/packages/get) (Simple and powerful solution for navigation and state)
- **Real-time Communication**: [Socket.io Client](https://pub.dev/packages/socket_io_client)
- **Local Storage**: [GetStorage](https://pub.dev/packages/get_storage)
- **Maps & Location**: Google Maps Flutter, Geolocator
- **Payments**: Razorpay Flutter Integration
- **Notifications**: Firebase Cloud Messaging (FCM) & Local Notifications

### **Backend (Server)**
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (with Mongoose ODM)
- **Real-time Engine**: [Socket.io](https://socket.io/)
- **IoT Protocol**: [MQTT](https://mqtt.org/) (Message Queuing Telemetry Transport)
- **Security**: JSON Web Tokens (JWT) & Bcrypt password hashing
- **API Documentation**: [Swagger/OpenAPI](https://swagger.io/)
- **Caching**: Redis (for performance optimization)

---

## 3. System Architecture & Workflow

### **Architecture Diagram (Conceptual)**
`Mobile App (Flutter) <--> REST API / Socket.io <--> Backend (Node.js) <--> MQTT Broker <--> Motor Controller (Hardware)`

### **1. Data Acquisition (Device to App)**
- **Telemetry**: The Motor Controller sends electrical data (Voltage, Current, RPM, Energy) to the **MQTT Broker** via the `telemetry` topic.
- **Processing**: The Node.js backend subscribes to these MQTT topics, parses the data, and stores it in **MongoDB**.
- **Live Updates**: The backend immediately broadcasts this data to the **Mobile App** via **Socket.io** for real-time dashboard updates.

### **2. Remote Control (App to Device)**
- **Command**: The user clicks "Start" or "Stop" in the Flutter App.
- **API Request**: The app sends a POST request to the `/app/startStopDevice` endpoint.
- **State Change**: The backend updates the device state in the database and sends a **Push Notification** to all authorized users.
- **Execution**: The hardware device (or simulator) reflects the state stored in the system, ensuring the motor responds to the user's intent.

### **3. Monitoring & Alerts**
- **Alerts**: If the hardware detects a fault (e.g., Dry Run), it publishes an `alert` to MQTT.
- **Notification**: The backend receives the alert, logs it, and sends an instant **FCM Push Notification** to the user's phone.

---

## 4. User Authentication & Security

The system employs a secure, role-based authentication mechanism to protect user data and device control.

### **1. User Registration**
- **Admin-Controlled**: To ensure security and hardware verification, users are primarily registered by the **System Administrator**.
- **User Profiles**: During registration, details such as Name, Email, Phone, and a secure 6-digit numeric PIN (Password) are assigned.
- **Role Assignment**: Every user is assigned a `role_id` (e.g., Admin, Master User, Shared User) which dictates their permissions across the platform.

### **2. Secure Login Process**
- **JWT Authentication**: The system uses **JSON Web Tokens (JWT)** for session management.
- **Validation**: Upon login, the backend verifies the Email, Password, and Role ID. If successful, it returns a signed token.
- **Persistent Sessions**: The Flutter app securely stores this token to maintain the user's session without requiring repeated logins.
- **FCM Token Linking**: During login, the device's unique FCM (Firebase Cloud Messaging) token is linked to the user account to enable personalized push notifications.

---

## 5. Real-time Data Pipeline (Telemetry Flow)

The core strength of the platform is its ability to handle high-frequency data from the hardware and deliver it to the user instantly.

### **1. Receiving Data (MQTT)**
- The hardware device publishes a JSON payload to the MQTT broker on specific topics (e.g., `borewell/SN123/telemetry`).
- The Node.js **MQTT Subscriber** is always listening. When a message arrives, it performs a "Safe JSON Parse" and validates the serial number.

### **2. Saving & Processing (MongoDB)**
- **Raw Logs**: Every single message is saved to raw collections (`agri_telemetry`, `agri_alerts`, etc.) for auditing.
- **State Update**: The main `devices` collection is updated with the latest motor status and signal strength.
- **Energy Aggregation**: Telemetry data is processed to update daily energy consumption records (kWh) and session history.

### **3. Instant UI Update (Socket.io)**
- As soon as the backend saves the data, it emits a `LIVE_TELEMETRY` event via **Socket.io**.
- The Mobile App receives this event and updates the dashboard gauges and charts instantly, without the user needing to refresh the screen.

### **4. Example Data Frames (MQTT Payloads)**

To understand exactly how the hardware communicates, here are the standard JSON frames used in the system:

**Telemetry Frame (Real-time Monitoring)**
```json
{
  "version": 1,
  "type": "TELEMETRY",
  "serial_number": "SN0987654321",
  "imei_number": "864509012345678",
  "user_id": 1,
  "timestamp": "2023-10-27T10:30:00Z",
  "voltage_rms": 235.5,
  "current_rms": 4.2,
  "motor_rpm": 2150,
  "power_kw": 1.2,
  "energy_kwh": 0.045,
  "device_temp_c": 42.0,
  "signal_strength": 85
}
```

**Status Frame (Motor Operation)**
```json
{
  "v": 1,
  "message_type": "STATUS",
  "serial_number": "SN0987654321",
  "motor_running": true,
  "acknowledged_command": "START_MOTOR",
  "timestamp": "2023-10-27T10:30:05Z"
}
```

**Alert Frame (Fault Detection)**
```json
{
  "v": 1,
  "message_type": "ALERT",
  "alert_type": "Dry run",
  "device_status": "Critical",
  "description": "No water detected in the borewell",
  "timestamp": "2023-10-27T10:35:00Z"
}
```

---

## 6. User Roles & Capabilities

### **Super Admin / Admin**
- **User Management**: Create, edit, and deactivate user accounts and roles.
- **Device Provisioning**: Register new hardware devices into the system using Serial Numbers.
- **Device Assignment**: Link devices to specific users (Master ownership).
- **Product Management**: Manage the integrated shop (Add/Update products, images, and prices).
- **Global History Access**: Monitor motor history and logs for all devices across the platform.

### **End User (Master / Shared)**
- **Device Control**: Remote Start/Stop operations via the mobile app.
- **Real-time Monitoring**: View live electrical parameters and motor status.
- **Device Sharing**: Master users can share access with other users (e.g., family or staff) with "Accepted/Pending" status workflows.
- **Personal History**: Access detailed logs of their own devices' usage.
- **Shopping & Orders**: Purchase equipment and track order history from creation to delivery.
- **Profile Management**: Update personal details, profile pictures, and notification preferences.

---

## 5. Analytics & Dashboard Insights

The system provides visual insights for both monitoring and business growth:

### **1. Motor Performance Analytics**
- Users can view historical graphs for **Voltage**, **Current**, and **Power consumption**.
- Data is aggregated on **Hourly**, **Daily**, and **Weekly** levels to help identify motor health or power quality issues.

### **2. Admin Business Analytics**
- The Admin dashboard tracks system-wide growth metrics:
    - **Device Trends**: Weekly/Monthly/Yearly charts of new device registrations.
    - **Assignment Status**: Distribution of assigned vs. unassigned devices.
    - **Operational Health**: Ratio of active vs. deactivated units in the field.

---

## 6. History & Data Logging System

The system maintains a comprehensive logging mechanism for accountability and energy tracking:

- **Borewell History**: Every motor operation (Start to Stop) is logged as a "Session" in the `agri_history` collection.
    - **Capture Points**: Records `startAt`, `stopAt`, `duration_minutes`, and `energy_kwh`.
    - **Attribution**: Tracks exactly who started and who stopped the motor (Name & Email).
    - **Peak Monitoring**: Logs maximum/minimum voltage and current recorded during each session.
- **Daily Energy Logs**: Aggregates energy consumption on a daily basis for long-term analytics.
- **Telemetry History**: High-frequency logs of electrical parameters for generating performance charts and graphs.

---

## 7. Shop & E-commerce System

The platform includes a built-in shop where users can purchase motor-related accessories and services.

- **Product Catalog**: Dynamic list of products with images, descriptions (including PDF specs), and real-time inventory tracking.
- **Cart Management**: Users can add items to their cart, update quantities, and calculate totals with GST and shipping costs.
- **Voucher System**: 
    - **Discount Codes**: Admin-defined promotional codes (e.g., `AGRI20`).
    - **Validation**: Backend checks for code status, date validity (start/end), and usage limits (`max_usage`).
    - **Automatic Calculation**: Discounts are applied as a percentage of the total price during checkout.

---

## 8. Order & Payment Lifecycle

The system ensures secure and reliable transactions through a structured order flow:

### **1. Order Creation**
- **Process**: Users provide a shipping address and select a payment method.
- **Inventory Check**: For COD, product quantities are reduced immediately upon order creation. For Razorpay, reduction happens after successful payment verification.

### **2. Payment Integration**
- **Razorpay**: 
    - **Handshake**: Backend generates a Razorpay order ID.
    - **Verification**: Post-payment, the system verifies the `razorpay_signature` to prevent fraud.
- **Cash on Delivery (COD)**: A simpler flow where orders are confirmed after manual or system-based verification.

### **3. Order Status & Tracking**
- **Lifecycle**: `Created` → `Confirmed` → `Processing` → `Shipped` → `Out for Delivery` → `Delivered`.
- **Timeline**: Every status change is logged in the `order_timeline` with a timestamp and the name of the person who updated it.
- **Cancellations**: Orders can be cancelled if they haven't been delivered. Inventory is automatically restored to the product stock upon cancellation.

---

## 9. Workflow Summary

1. **User Login**: User authenticates via the Flutter app (JWT-secured).
2. **Device Registration**: User scans or enters the device serial/IMEI to link the motor to their account.
3. **Live Monitoring**: App establishes a Socket.io connection to receive continuous telemetry updates.
4. **Operation**: User toggles the motor state; the backend validates permissions and processes the command.
5. **Session Logging**: Every start/stop action creates a "History Session" to track total run time and energy used.

---

## 10. Key Features Summary

- **Real-time Dashboard**: Live monitoring of electrical parameters.
- **Remote Control**: Global access to motor Start/Stop operations.
- **Smart Alerts**: Instant notifications for Dry Run, Overload, and Low Voltage.
- **E-commerce**: Integrated shop with secure Razorpay integration.
- **Sharing**: Multi-user access with permission management.
- **Analytics**: Historical data visualization for health monitoring.
