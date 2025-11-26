import { useState, useEffect, useRef, useCallback } from 'react';

export const useProfile = (userInfo) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;

    const [user_name, setUpdateUname] = useState('');
    const [user_phone, setUpdatePhone] = useState('');
    const [user_email, setUpdateEmail] = useState('');
    const [password, setUpdatePassword] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [initialUserData, setInitialUserData] = useState({});
    const [userModified, setUserModified] = useState(false);
    const fetchCalled = useRef(false);
    const [loadingUpdate, setLoadingUpdate] = useState(false);

    const token = userInfo?.token || sessionStorage.getItem("token");
    const userId = userInfo?.user?.user_id;

    // Fetch Profile (NodeJS backend)
    const fetchProfile = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/app/profile/${userId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (res.ok) {
                setInitialUserData(data.user);
                setUpdateUname(data.user.user_name);
                setUpdatePhone(data.user.user_phone);
                setUpdateEmail(data.user.user_email);
                setUpdatePassword(data.user.password); 
            } else {
                setErrorMessage("Failed to load profile");
            }
        } catch (err) {
            setErrorMessage("Server error");
        }
    }, [API_BASE, userId, token]);


    useEffect(() => {
        if (!fetchCalled.current && userId) {
            fetchProfile();
            fetchCalled.current = true;
        }
    }, [fetchProfile, userId]);


    // Detect modifications
    useEffect(() => {
        setUserModified(
            user_name !== initialUserData.user_name ||
            user_phone !== initialUserData.user_phone ||
            password !== initialUserData.password

        );
    }, [user_name, user_phone, password, initialUserData]);


    // Update Profile (NodeJS)
    const handleUpdate = async () => {
        if (loadingUpdate) return;
        setLoadingUpdate(true);

        try {
            const res = await fetch(`${API_BASE}/app/updatedProfile/${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_name,
                    user_phone: parseInt(user_phone),
                    password: parseInt(password),
                    status: true
                })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccessMessage(data.message);
                fetchProfile();
            } else {
                setErrorMessage(data.message);
            }
        } catch (err) {
            setErrorMessage("Server error while updating profile");
        }

        setLoadingUpdate(false);
    };

    return {
        user_name,
        user_phone,
        user_email,
        password,
        setUpdateUname,
        setUpdatePhone,
        setUpdatePassword,
        successMessage,
        errorMessage,
        setErrorMessage,
        userModified,
        loadingUpdate,
        handleUpdate,
    };
};
