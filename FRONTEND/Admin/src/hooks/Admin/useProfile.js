import { useState, useEffect, useRef, useCallback } from 'react';
import Swal from 'sweetalert2';

export const useProfile = (userInfo) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;

    const [user_name, setUpdateUname] = useState('');
    const [user_phone, setUpdatePhone] = useState('');
    const [user_email, setUpdateEmail] = useState('');
    const [password, setUpdatePassword] = useState('');
    const [profile_image, setProfileImage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [initialUserData, setInitialUserData] = useState({});
    const [userModified, setUserModified] = useState(false);
    const fetchCalled = useRef(false);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [loadingImageUpload, setLoadingImageUpload] = useState(false);

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
                setProfileImage(data.user.profile_image || ''); 
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
                fetchProfile();
                
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: data.message || 'Profile updated successfully',
                    timer: 5000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    position: 'top-end',
                    toast: true
                });
            } else {
                setErrorMessage(data.message);
            }
        } catch (err) {
            setErrorMessage("Server error while updating profile");
        }

        setLoadingUpdate(false);
    };

    // Upload Profile Image
    const handleImageUpload = async (imageFile) => {
        if (!imageFile) {
            setErrorMessage("Please select an image file");
            return;
        }

        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (imageFile.size > maxSize) {
            setErrorMessage("Image size must be less than 5MB");
            return;
        }

        // Check file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(imageFile.type)) {
            setErrorMessage("Only PNG and JPG images are allowed");
            return;
        }

        setLoadingImageUpload(true);
        setErrorMessage('');

        try {
            const formData = new FormData();
            formData.append('image', imageFile);

            const res = await fetch(`${API_BASE}/app/uploadProfileImage/${userId}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                setProfileImage(data.profile_image);
                setSelectedImage(null);
                fetchProfile();
                
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Image updated successfully',
                    timer: 5000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    position: 'top-end',
                    toast: true
                });
            } else {
                setErrorMessage(data.message || "Failed to upload image");
            }
        } catch (err) {
            setErrorMessage("Server error while uploading image");
        }

        setLoadingImageUpload(false);
    };

    return {
        user_name,
        user_phone,
        user_email,
        password,
        profile_image,
        selectedImage,
        setUpdateUname,
        setUpdatePhone,
        setUpdatePassword,
        setSelectedImage,
        errorMessage,
        setErrorMessage,
        userModified,
        loadingUpdate,
        loadingImageUpload,
        handleUpdate,
        handleImageUpload,
    };
};
