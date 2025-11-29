import { useState } from 'react';

const useManageUsersView = () => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;

    const [assignedDevices, setAssignedDevices] = useState([]);
    const [loadingDevices, setLoadingDevices] = useState(true);
    const [errorDevices, setErrorDevices] = useState('');
    const [isModalDeviceDetails, setIsModalDeviceDetails] = useState(false);
    const [isModalDeviceHistory, setIsModalDeviceHistory] = useState(false);
    const [selectedDeviceDetails, setSelectedDeviceDetails] = useState(null);
    const [selectedDeviceForHistory, setSelectedDeviceForHistory] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalDevices: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    });

    const fetchUserAssignedDevices = async (user_id, page = 1, limit = 10) => {
        try {
            setLoadingDevices(true);
            setErrorDevices('');
            
            const response = await fetch(`${API_BASE}/app/userAssignDevices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id }),
            });

            if (response.ok) {
                const data = await response.json();
                setAssignedDevices(data.data || []);
                setPagination({
                    currentPage: page,
                    totalPages: Math.ceil((data.count || 0) / limit),
                    totalDevices: data.count || 0,
                    limit,
                    hasNextPage: page < Math.ceil((data.count || 0) / limit),
                    hasPrevPage: page > 1
                });
            } else {
                const errorData = await response.json();
                setErrorDevices(errorData.message || 'Failed to fetch assigned devices');
                setAssignedDevices([]);
            }
        } catch (error) {
            console.error('Error fetching assigned devices:', error);
            setErrorDevices('An error occurred while fetching devices');
            setAssignedDevices([]);
        } finally {
            setLoadingDevices(false);
        }
    };

    const fetchDeviceDetails = async (serial_number, imei_number) => {
        try {
            const response = await fetch(`${API_BASE}/app/userDeviceDetails`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ serial_number, imei_number }),
            });

            if (response.ok) {
                const data = await response.json();
                setSelectedDeviceDetails(data.data);
                setIsModalDeviceDetails(true);
            } else {
                const errorData = await response.json();
                alert('Error fetching device details: ' + (errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error fetching device details:', error);
            alert('Error fetching device details');
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, currentPage: newPage }));
    };

    const handleLimitChange = (newLimit) => {
        setPagination(prev => ({
            ...prev,
            currentPage: 1,
            limit: newLimit,
            totalPages: Math.ceil((prev.totalDevices || 0) / newLimit),
        }));
    };

    const closeModal = () => {
        setIsModalDeviceDetails(false);
        setIsModalDeviceHistory(false);
        setSelectedDeviceDetails(null);
        setSelectedDeviceForHistory(null);
    };

    return {
        assignedDevices,
        loadingDevices,
        errorDevices,
        fetchUserAssignedDevices,
        fetchDeviceDetails,
        isModalDeviceDetails,
        setIsModalDeviceDetails,
        isModalDeviceHistory,
        setIsModalDeviceHistory,
        selectedDeviceDetails,
        setSelectedDeviceDetails,
        selectedDeviceForHistory,
        setSelectedDeviceForHistory,
        pagination,
        handlePageChange,
        handleLimitChange,
        closeModal
    };
};

export default useManageUsersView;
