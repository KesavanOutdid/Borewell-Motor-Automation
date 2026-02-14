import { useEffect, useState } from "react";
import { socket } from "../../config/socket";

const useLiveTelemetry = (serialNumber) => {
    const [telemetry, setTelemetry] = useState(null);

    useEffect(() => {
        if (!serialNumber) return;

        // Load existing store
        const store = JSON.parse(localStorage.getItem("live-telemetry")) || {};
        if (store[serialNumber]) setTelemetry(store[serialNumber]);

        const handler = (data) => {
            if (data.serial_number !== serialNumber) {
                // still update global store
                const map = JSON.parse(localStorage.getItem("live-telemetry")) || {};
                map[data.serial_number] = data.telemetry;
                localStorage.setItem("live-telemetry", JSON.stringify(map));
                return;
            }

            const map = JSON.parse(localStorage.getItem("live-telemetry")) || {};
            map[serialNumber] = data.telemetry;
            localStorage.setItem("live-telemetry", JSON.stringify(map));

            setTelemetry(data.telemetry);
        };

        socket.on("LIVE_TELEMETRY", handler);

        return () => {
            socket.off("LIVE_TELEMETRY", handler);
        };
    }, [serialNumber]);

    return telemetry;
};

export default useLiveTelemetry;
