import { useEffect, useState } from "react";
import { socket } from "../../config/socket";

const useLiveHeartbeat = (serialNumber) => {
    const [heartbeat, setHeartbeat] = useState(null);

    useEffect(() => {
        if (!serialNumber) {
            setHeartbeat(null);
            return;
        }

        setHeartbeat(null); // reset

        const handler = (data) => {
            if (data.serial_number === serialNumber) {
                setHeartbeat(data.payload);
            }
        };

        socket.on("LIVE_HEARTBEAT", handler);

        return () => {
            socket.off("LIVE_HEARTBEAT", handler);
        };
    }, [serialNumber]);

    return heartbeat;
};

export default useLiveHeartbeat;
