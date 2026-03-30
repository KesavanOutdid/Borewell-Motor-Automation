import { useState, useCallback } from 'react';
import { showAlertSuccess } from '../../../utils/alert';

const useManageHelp = (userInfo) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;

    const [helpRequests, setHelpRequests] = useState([]);
    const [errorHelp, setErrorHelp] = useState('');
    const [loadingHelp, setLoadingHelp] = useState(true);
    const [currentHelpDetails, setCurrentHelpDetails] = useState(null);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [errorMessageUpdate, setErrorMessageUpdate] = useState('');

    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalHelp: 0,
        totalPending: 0,
        totalSolved: 0,
        totalRejected: 0,
        totalReSolved: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    });

    const fetchHelpData = useCallback(async (page = 1, limit = 10, search = '', statusFilter = '') => {
        try {
            setLoadingHelp(true);
            const params = new URLSearchParams({ page, limit });
            if (search) params.append('search', search);
            if (statusFilter && statusFilter !== 'all') params.append('status_filter', statusFilter);

            const response = await fetch(
                `${API_BASE}/admin/getAllHelp?${params.toString()}`,
                {
                    headers: {
                        'Authorization': `Bearer ${userInfo.token}`
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setHelpRequests(data.data);
                setPagination(data.pagination);
                setLoadingHelp(false);
            } else {
                const errorData = await response.json();
                setErrorHelp(errorData.message || 'Error fetching help requests');
                setLoadingHelp(false);
            }
        } catch (error) {
            console.error('Fetch Help Error:', error);
            setErrorHelp('An error occurred while fetching help requests.');
            setLoadingHelp(false);
        }
    }, [API_BASE, userInfo.token]);

    const fetchHelpById = useCallback(async (id) => {
        try {
            const response = await fetch(`${API_BASE}/admin/getHelpById?id=${id}`, {
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.data;
            } else {
                const errorData = await response.json();
                setErrorMessageUpdate(errorData.message || 'Error fetching help details');
                return null;
            }
        } catch (error) {
            console.error('Fetch Help By ID Error:', error);
            setErrorMessageUpdate('An error occurred while fetching help details.');
            return null;
        }
    }, [API_BASE, userInfo.token]);

    const updateHelpStatus = useCallback(async (id, status, admin_remarks) => {
        if (loadingUpdate) return false;
        setLoadingUpdate(true);
        setErrorMessageUpdate('');

        try {
            const response = await fetch(`${API_BASE}/admin/updateHelpStatus`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({
                    id,
                    status,
                    admin_remarks,
                    updatedBy: userInfo?.user?.user_email
                })
            });

            const res = await response.json();

            if (!response.ok) {
                setErrorMessageUpdate(res.message || 'Error updating help status');
                setLoadingUpdate(false);
                return false;
            }

            showAlertSuccess('Help status updated successfully!');
            setLoadingUpdate(false);
            return true;
        } catch (err) {
            console.log('Update Help Status Error:', err);
            setErrorMessageUpdate('Error updating help status.');
            setLoadingUpdate(false);
            return false;
        }
    }, [API_BASE, userInfo, loadingUpdate]);

    const handlePageChange = useCallback((newPage, searchQuery = '', statusFilter = '') => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchHelpData(newPage, pagination.limit, searchQuery, statusFilter);
        }
    }, [pagination.totalPages, pagination.limit, fetchHelpData]);

    const handleLimitChange = useCallback((newLimit, searchQuery = '', statusFilter = '') => {
        fetchHelpData(1, newLimit, searchQuery, statusFilter);
    }, [fetchHelpData]);

    return {
        helpRequests,
        errorHelp,
        loadingHelp,
        pagination,
        currentHelpDetails,
        setCurrentHelpDetails,
        loadingUpdate,
        errorMessageUpdate,
        setErrorMessageUpdate,
        fetchHelpData,
        fetchHelpById,
        updateHelpStatus,
        handlePageChange,
        handleLimitChange
    };
};

export default useManageHelp;
