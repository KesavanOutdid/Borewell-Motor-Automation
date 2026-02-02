import { useState } from 'react';

const useManageUsersView = () => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;

    const [assignedDevices, setAssignedDevices] = useState([]);
    const [sharedDevices, setSharedDevices] = useState([]);
    const [loadingDevices, setLoadingDevices] = useState(true);
    const [errorDevices, setErrorDevices] = useState('');
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
                setSharedDevices(data.shared_devices || []);
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
                setSharedDevices([]);
            }
        } catch (error) {
            console.error('Error fetching assigned devices:', error);
            setErrorDevices('An error occurred while fetching devices');
            setAssignedDevices([]);
        } finally {
            setLoadingDevices(false);
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

    return {
        assignedDevices,
        sharedDevices,
        loadingDevices,
        errorDevices,
        fetchUserAssignedDevices,
        pagination,
        handlePageChange,
        handleLimitChange
    };
};

export default useManageUsersView;
