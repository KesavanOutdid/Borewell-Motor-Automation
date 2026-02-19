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

            // Handle transition OR initial state
            if (newStatus.motor_running === true) {
                if (prevMotorRunning.current === false || prevMotorRunning.current === null) {
                    setLastStart(newStatus.timestamp || newStatus.startAt);
                }
            } else if (newStatus.motor_running === false) {
                if (prevMotorRunning.current === true || prevMotorRunning.current === null) {
                    setLastStop(newStatus.timestamp || newStatus.stopAt);
                }
            }

            // Also if payload has explicit startAt/stopAt, use them
            if (newStatus.startAt) setLastStart(newStatus.startAt);
            if (newStatus.stopAt) setLastStop(newStatus.stopAt);

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
