import { useEffect, useState } from "react";
import { socket } from "../../config/socket";

const useLiveBoot = (serialNumber) => {
    const [boot, setBoot] = useState(null);

    useEffect(() => {
        if (!serialNumber) {
            setBoot(null);
            return;
        }

        setBoot(null); // reset on device change

        const handler = (data) => {
            if (data.serial_number === serialNumber) {
                setBoot(data.payload);
            }
        };

        socket.on("LIVE_BOOT", handler);

        return () => {
            socket.off("LIVE_BOOT", handler);
        };
    }, [serialNumber]);

    return boot;
};

export default useLiveBoot;
