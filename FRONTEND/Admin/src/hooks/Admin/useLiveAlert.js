// FRONTEND/src/hooks/live/useLiveAlert.js
import { useEffect, useState } from "react";
import { socket } from "../../config/socket";

const useLiveAlert = (serialNumber) => {
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        if (!serialNumber) return;

        // Load previous alert from localStorage
        const store = JSON.parse(localStorage.getItem("live-alert")) || {};
        if (store[serialNumber]) setAlert(store[serialNumber]);

        const handler = (data) => {
            const sn = data.serial_number;

            // update LocalStorage
            const map = JSON.parse(localStorage.getItem("live-alert")) || {};
            map[sn] = data.payload;
            localStorage.setItem("live-alert", JSON.stringify(map));

            if (sn === serialNumber) {
                setAlert(data.payload);
            }
        };

        socket.on("LIVE_ALERT", handler);

        return () => {
            socket.off("LIVE_ALERT", handler);
        };
    }, [serialNumber]);

    return alert;
};

export default useLiveAlert;
