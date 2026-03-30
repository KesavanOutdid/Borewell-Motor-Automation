import { useState, useEffect } from 'react';
import axios from 'axios';

const useDeviceSchedules = (serialNumber, userInfo, isDashboard = false) => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const API_BASE = process.env.REACT_APP_SERVER_URL;

    useEffect(() => {
        if (!serialNumber) {
            setSchedules([]);
            return;
        }

        const fetchSchedules = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_BASE}/app/getSchedules`, {
                    params: { 
                        serial_number: serialNumber,
                        dashboard: isDashboard 
                    },
                    headers: {
                        Authorization: `Bearer ${userInfo?.token}`
                    }
                });
                if (response.data.success) {
                    setSchedules(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching device schedules:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedules();
    }, [serialNumber, userInfo?.token, API_BASE, isDashboard]);

    return { schedules, loading };
};

export default useDeviceSchedules;
