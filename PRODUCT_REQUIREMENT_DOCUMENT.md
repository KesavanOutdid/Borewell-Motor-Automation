# Product Requirement Document (PRD): Borewell Motor Automation

## 1. Executive Summary
The goal of this project is to develop a robust IoT ecosystem that allows farmers and industrial users to remotely monitor, control, and secure their borewell motors. The system eliminates the need for manual site visits, provides protection against electrical faults, and offers detailed energy analytics.

---

## 2. Target Audience
- **Primary**: Farmers and agricultural land owners.
- **Secondary**: Industrial site managers and maintenance technicians.
- **Administrators**: System owners who manage device distribution and inventory.

---

## 3. Functional Requirements

### **3.1 Device Management**
- **FR-01**: Admin must be able to register new hardware devices via unique Serial and IMEI numbers.
- **FR-02**: Admin must be able to assign/unassign devices to specific user accounts.
- **FR-03**: Users must be able to give their devices custom nicknames (e.g., "North Farm Motor").
- **FR-04**: Master users must be able to share device control with secondary users.

### **3.2 Remote Control & Monitoring**
- **FR-05**: Users must be able to start and stop the motor remotely with < 2 seconds latency.
- **FR-06**: The system must display live Voltage (RMS), Current (RMS), Motor RPM, and Power (kW).
- **FR-07**: The dashboard must show real-time signal strength (GSM/4G) and device temperature.

### **3.3 Alerts & Safety**
- **FR-08**: The system must automatically detect and notify users of "Dry Run" conditions.
- **FR-09**: Users must receive instant push notifications for "Overload" and "Low/High Voltage" faults.
- **FR-10**: The hardware must automatically shut down the motor during critical faults (Hardware-level safety).

### **3.4 Data Analytics**
- **FR-11**: The system must log every motor operation session (Start/Stop time, Duration, Energy used).
- **FR-12**: Users must be able to view historical usage trends (Daily/Weekly/Monthly).
- **FR-13**: Admin must have access to a business dashboard showing device deployment trends.

### **3.5 E-commerce & Shopping**
- **FR-14**: Users must be able to browse a catalog of motor accessories.
- **FR-15**: The system must support secure online payments (Razorpay) and Cash on Delivery (COD).
- **FR-16**: The system must support promotional vouchers for discounts.

---

## 4. Non-Functional Requirements

### **4.1 Performance & Scalability**
- **NFR-01**: The system must support up to 10,000 concurrent IoT device connections.
- **NFR-02**: Real-time telemetry updates must occur every 5-10 seconds during motor operation.

### **4.3 Security**
- **NFR-03**: All API communication must be secured via SSL/TLS and JWT authentication.
- **NFR-04**: User passwords (6-digit PINs) must be encrypted in the database.
- **NFR-05**: Only authorized users (Master/Shared) can send control commands to a specific device.

### **4.4 Reliability**
- **NFR-06**: The system must log MQTT messages to a fallback file if the primary database is temporarily unavailable.
- **NFR-07**: The backend must automatically reconnect to the MQTT broker upon connection loss.

---

## 5. User Journey / Use Cases

### **Case 1: Emergency Shutdown**
1. Motor is running at the farm.
2. Hardware detects a "Dry Run" (no water flow).
3. Hardware publishes an alert to MQTT.
4. Backend saves alert and sends a "Critical" push notification to the User.
5. User opens the app, sees the fault, and verifies the motor has been stopped.

### **Case 2: Energy Audit**
1. User wants to check electricity usage for the month.
2. User navigates to the "History" tab in the app.
3. User selects "Last 30 Days".
4. System displays total energy (kWh) and total runtime (Hours).

---

## 6. Success Metrics
- **Uptime**: 99.9% availability of the backend control services.
- **Latency**: Under 1 second for command acknowledgment.
- **Retention**: Active weekly usage of the monitoring dashboard.
