import { useEffect, useState } from "react";
import { WS_URL } from "../../config/websocket";

const useLiveAlert = (serialNumber) => {
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        if (!serialNumber) return;

        // Load previous alert from localStorage store
        const store = JSON.parse(localStorage.getItem("live-alert")) || {};
        if (store[serialNumber]) setAlert(store[serialNumber]);

        const socket = new WebSocket(WS_URL);

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.event === "LIVE_ALERT") {
                const sn = data.serial_number;

                // update global LocalStorage map
                const map = JSON.parse(localStorage.getItem("live-alert")) || {};
                map[sn] = data.payload;
                localStorage.setItem("live-alert", JSON.stringify(map));

                // update component only if matching selected device
                if (sn === serialNumber) {
                    setAlert(data.payload);
                }
            }
        };

        return () => socket.close();

    }, [serialNumber]);

    return alert;
};

export default useLiveAlert;
