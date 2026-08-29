# Hardware-to-Cloud Interface Specification (ICD)

## 1. Communication Protocol
- **Protocol**: MQTT v3.1.1
- **Data Format**: JSON (UTF-8)
- **Quality of Service (QoS)**: 1 (At least once delivery)
- **Retain Flag**: `false` (Should not retain messages unless specified)

---

## 2. Topic Structure
The hardware device must publish to topics using its unique **Serial Number** as the identifier.

| Message Type | Topic Pattern | Direction | Description |
|--------------|---------------|-----------|-------------|
| **Boot** | `borewell/{serial_number}/boot` | HW → Cloud | Sent once when the device powers on. |
| **Heartbeat**| `borewell/{serial_number}/heartbeat` | HW → Cloud | Sent periodically to indicate the device is online. |
| **Telemetry**| `borewell/{serial_number}/telemetry` | HW → Cloud | Real-time sensor data (sent while motor is ON). |
| **Status** | `borewell/{serial_number}/status` | HW → Cloud | Confirmation of motor Start/Stop execution. |
| **Alert** | `borewell/{serial_number}/alert` | HW → Cloud | Immediate notification of faults or errors. |
| **Command** | `borewell/{serial_number}/cmd` | Cloud → HW | Received by device to execute Start/Stop. |

---

## 3. Payload Definitions (Uplink: Hardware to Cloud)

### **3.1 Boot Message**
Sent immediately upon connection to the network.
```json
{
  "v": 1,
  "message_type": "BOOT",
  "serial_number": "SN12345",
  "imei_number": "8645...",
  "user_id": 1,
  "timestamp": "ISO-8601-String",
  "device_status": "Ready",
  "power_status": "ON",
  "network_status": "4G/GSM",
  "signal_strength": 85,
  "voltage": 230.5
}
```

### **3.2 Telemetry Message**
Recommended frequency: Every 5-10 seconds when the motor is running.
```json
{
  "version": 1,
  "type": "TELEMETRY",
  "serial_number": "SN12345",
  "imei_number": "8645...",
  "user_id": 1,
  "timestamp": "ISO-8601-String",
  "voltage_rms": 230.5,    // Volts
  "current_rms": 4.5,      // Amperes
  "motor_rpm": 2100,       // Rotations per minute
  "power_kw": 1.1,         // Kilowatts
  "energy_kwh": 0.05,      // Energy consumed in this message interval
  "device_temp_c": 38.5,   // Celsius
  "flow_lpm": 250,         // Liters per minute
  "signal_strength": 75,   // Percentage 0-100
  "fault_code": 0          // 0 = No fault
}
```

### **3.3 Status Message**
Sent as an acknowledgment after a Start/Stop command is executed.
```json
{
  "v": 1,
  "message_type": "STATUS",
  "serial_number": "SN12345",
  "motor_running": true,   // true = Running, false = Stopped
  "acknowledged_command": "START_MOTOR", // "START_MOTOR" or "STOP_MOTOR"
  "timestamp": "ISO-8601-String"
}
```

### **3.4 Alert Message**
Sent immediately when a threshold is breached or a fault is detected.
```json
{
  "v": 1,
  "message_type": "ALERT",
  "alert_type": "Dry run",  // e.g., "Dry run", "Overload", "Phase Fail"
  "device_status": "Critical", // "Warning" or "Critical"
  "description": "Short description of the event",
  "timestamp": "ISO-8601-String"
}
```

---

## 4. Payload Definitions (Downlink: Cloud to Hardware)

The device must subscribe to `borewell/{serial_number}/cmd` to receive instructions from the cloud.

### **4.1 Control Command**
```json
{
  "v": 1,
  "command": "START_MOTOR", // "START_MOTOR" or "STOP_MOTOR"
  "user_id": 1,
  "timestamp": "ISO-8601-String"
}
```
*Note: Upon receiving this, the device must execute the physical relay change and then publish a corresponding **Status Message** back to the cloud as an acknowledgment.*

---

## 5. Hardware Requirements
1. **Time Sync**: Device should ideally sync time via NTP to provide accurate `timestamp` fields.
2. **Buffering**: If GSM/4G connection is lost, the device should buffer critical events (Alerts/Status) and publish them once reconnected.
3. **LWT (Last Will & Testament)**: The device should configure a LWT on the topic `borewell/{serial_number}/heartbeat` with a payload indicating `offline` to allow the server to detect sudden disconnections.

---

## 5. Engineering Units
- **Voltage**: Volts (V) - Root Mean Square
- **Current**: Amperes (A) - Root Mean Square
- **Power**: Kilowatts (kW)
- **Energy**: Kilowatt-hours (kWh)
- **Frequency**: Hertz (Hz)
- **Flow**: Liters per Minute (LPM)
