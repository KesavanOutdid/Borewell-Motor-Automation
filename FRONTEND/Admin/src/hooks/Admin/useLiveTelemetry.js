import { useEffect, useState } from "react";

const useLiveTelemetry = (serialNumber) => {
    const [telemetry, setTelemetry] = useState(null);

    useEffect(() => {
        if (!serialNumber) return;

        // Load existing store
        const store = JSON.parse(localStorage.getItem("live-telemetry")) || {};

        // Set value if exists
        if (store[serialNumber]) setTelemetry(store[serialNumber]);

        const socket = new WebSocket("ws://localhost:8081");

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.event === "LIVE_TELEMETRY") {
                const sn = data.serial_number;

                // update LocalStorage map
                const map = JSON.parse(localStorage.getItem("live-telemetry")) || {};
                map[sn] = data.telemetry;
                localStorage.setItem("live-telemetry", JSON.stringify(map));

                // update UI if same device
                if (sn === serialNumber) {
                    setTelemetry(data.telemetry);
                }
            }
        };

        return () => socket.close();

    }, [serialNumber]);

    return telemetry;
};

export default useLiveTelemetry;
