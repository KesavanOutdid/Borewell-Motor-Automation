import { useEffect, useState, useRef } from "react";
import { socket } from "../../config/socket";

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

        setStatus(null);
        setLastStart(null);
        setLastStop(null);
        prevMotorRunning.current = null;

        const handler = (data) => {
            if (data.serial_number !== serialNumber) return;

            const newStatus = data.payload;

            if (newStatus.motor_running === true && prevMotorRunning.current === false) {
                setLastStart(newStatus.timestamp);
            }
            if (newStatus.motor_running === false && prevMotorRunning.current === true) {
                setLastStop(newStatus.timestamp);
            }

            prevMotorRunning.current = newStatus.motor_running;
            setStatus(newStatus);
        };

        socket.on("LIVE_STATUS", handler);

        return () => {
            socket.off("LIVE_STATUS", handler);
        };
    }, [serialNumber]);

    return { status, lastStart, lastStop };
};

export default useLiveStatus;
