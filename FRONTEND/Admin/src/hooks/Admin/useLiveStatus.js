import { useEffect, useState, useRef } from "react";

const useLiveStatus = (serialNumber) => {
    const [status, setStatus] = useState(null);
    const [lastStart, setLastStart] = useState(null);
    const [lastStop, setLastStop] = useState(null);
    const prevMotorRunning = useRef(null);

    useEffect(() => {
        if (!serialNumber) {
            setStatus(null);
            setLastStart(null);
            setLastStop(null);
            prevMotorRunning.current = null;
            return;
        }

        setStatus(null);  // reset on device change
        setLastStart(null);
        setLastStop(null);
        prevMotorRunning.current = null;

        const socket = new WebSocket("ws://localhost:8081");

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.event === "LIVE_STATUS" && data.serial_number === serialNumber) {
                const newStatus = data.payload;
                // Track start/stop times on state change
                if (newStatus.motor_running === true && prevMotorRunning.current === false) {
                    setLastStart(newStatus.timestamp);
                }
                if (newStatus.motor_running === false && prevMotorRunning.current === true) {
                    setLastStop(newStatus.timestamp);
                }
                prevMotorRunning.current = newStatus.motor_running;
                setStatus(newStatus);
            }
        };

        return () => socket.close();
    }, [serialNumber]);

    return { status, lastStart, lastStop };
};

export default useLiveStatus;
