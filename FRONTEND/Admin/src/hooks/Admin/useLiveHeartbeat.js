import { useEffect, useState } from "react";
import { WS_URL } from "../../config/websocket";

const useLiveHeartbeat = (serialNumber) => {
    const [heartbeat, setHeartbeat] = useState(null);

    useEffect(() => {
        if (!serialNumber) {
            setHeartbeat(null);
            return;
        }

        setHeartbeat(null);  // reset on device change

        const socket = new WebSocket(WS_URL);

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (
                data.event === "LIVE_HEARTBEAT" &&
                data.serial_number === serialNumber
            ) {
                setHeartbeat(data.payload);
            }
        };

        return () => socket.close();
    }, [serialNumber]);

    return heartbeat;
};

export default useLiveHeartbeat;