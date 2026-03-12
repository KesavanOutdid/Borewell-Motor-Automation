import { useState } from 'react';

const useManageUsersDeviceHistory = () => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;

    const [deviceHistory, setDeviceHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [errorHistory, setErrorHistory] = useState('');
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    });

    const fetchDeviceHistory = async (user_id, page = 1, limit = 10) => {
        try {
            setLoadingHistory(true);
            setErrorHistory('');

            const response = await fetch(`${API_BASE}/admin/userDeviceHistory`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id }),
            });

            if (response.ok) {
                const data = await response.json();
                setDeviceHistory(data.data || []);
                
                const totalRecords = data.count || 0;
                setPagination({
                    currentPage: page,
                    totalPages: Math.ceil(totalRecords / limit),
                    totalRecords,
                    limit,
                    hasNextPage: page < Math.ceil(totalRecords / limit),
                    hasPrevPage: page > 1
                });
            } else {
                const errorData = await response.json();
                setErrorHistory(errorData.message || 'Failed to fetch device history');
                setDeviceHistory([]);
            }
        } catch (error) {
            console.error('Error fetching device history:', error);
            setErrorHistory('An error occurred while fetching history');
            setDeviceHistory([]);
        } finally {
            setLoadingHistory(false);
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
            totalPages: Math.ceil((prev.totalRecords || 0) / newLimit),
        }));
    };

    return {
        deviceHistory,
        loadingHistory,
        errorHistory,
        fetchDeviceHistory,
        pagination,
        handlePageChange,
        handleLimitChange
    };
};

export default useManageUsersDeviceHistory;
