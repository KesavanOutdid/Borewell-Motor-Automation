import { useEffect, useState } from "react";

const useLiveBoot = (serialNumber) => {
    const [boot, setBoot] = useState(null);

    useEffect(() => {
        if (!serialNumber) {
            setBoot(null);
            return;
        }

        setBoot(null);  // reset on device change

        const socket = new WebSocket("ws://localhost:8081");

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
