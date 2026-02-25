// client/hooks/useDashboard.js (call endpoint without limit to get all devices)
import { useState, useEffect, useRef, useCallback } from 'react';

const useDashboard = (userInfo) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;

    const fetchUserDataCalled = useRef(false);

    const [userData, setUserData] = useState({});
    const [errorMessage, setErrorMessage] = useState('');
    const [userLoading, setUserLoading] = useState(true);

    // Assign Devices States
    const [assignDevices, setAssignDevices] = useState([]);
    const [assignDeviceLoading, setAssignDeviceLoading] = useState(true);
    const [assignDeviceErrorMessage, setAssignDeviceErrorMessage] = useState('');

    const token = userInfo?.token || sessionStorage.getItem("token");
    const userId = userInfo?.user?.user_id;

    // Fetch profile
    const fetchProfile = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/app/profile/${userId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                setUserData(data.user);
            } else {
                setErrorMessage("Failed to fetch profile");
            }
        } catch (error) {
            setErrorMessage("Error fetching profile");
        }

        setUserLoading(false);
    }, [API_BASE, token, userId]);

    // Fetch assigned devices (NO limit/page -> returns all matching devices)
    const getAssignDevices = useCallback(async () => {
        setAssignDeviceLoading(true);
        try {
            // call endpoint WITHOUT page & limit to get all devices
            const response = await fetch(`${API_BASE}/admin/getAssignDevices`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            const data = await response.json();

            if (response.ok) {
                // server returns { success: true, data: [...devices] }
                setAssignDevices(data.data || []);
            } else {
                setAssignDeviceErrorMessage(data?.message || "Failed to load assigned devices");
            }
        } catch (error) {
            setAssignDeviceErrorMessage("Error fetching assigned devices");
        } finally {
            setAssignDeviceLoading(false);
        }
    }, [API_BASE]);

    // Run once on mount
    useEffect(() => {
        if (!fetchUserDataCalled.current && userId) {
            fetchProfile();
            getAssignDevices();
            fetchUserDataCalled.current = true;
        }
    }, [fetchProfile, getAssignDevices, userId]);

    return {
        userData,
        errorMessage,
        userLoading,

        assignDevices,
        assignDeviceLoading,
        assignDeviceErrorMessage,
    };
};

export default useDashboard;
