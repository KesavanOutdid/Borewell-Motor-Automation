import { useEffect, useState } from "react";
import { WS_URL } from "../../config/websocket";

const useLiveBoot = (serialNumber) => {
    const [boot, setBoot] = useState(null);

    useEffect(() => {
        if (!serialNumber) {
            setBoot(null);
            return;
        }

        setBoot(null);  // reset on device change

        const socket = new WebSocket(WS_URL);

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (
                data.event === "LIVE_BOOT" &&
                data.serial_number === serialNumber
            ) {
                setBoot(data.payload);
            }
        };

        return () => socket.close();
    }, [serialNumber]);

    return boot;
};

export default useLiveBoot;
