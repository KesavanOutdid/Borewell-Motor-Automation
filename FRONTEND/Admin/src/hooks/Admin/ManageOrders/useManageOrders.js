import { useState, useCallback } from 'react';

const useManageOrders = () => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [errorOrders, setErrorOrders] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 0,
        totalOrders: 0,
        totalFilteredOrders: 0,
        totalCreatedOrders: 0,
        totalConfirmedOrders: 0,
        totalProcessingOrders: 0,
        totalShippedOrders: 0,
        totalOutForDeliveryOrders: 0,
        totalDeliveredOrders: 0,
        totalCancelledOrders: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    });

    const fetchOrders = useCallback(async (page = 1, limit = 10, search = '', status = '') => {
        try {
            setLoadingOrders(true);
            setErrorOrders(null);

            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString()
            });

            if (search) params.append('search', search);
            if (status) params.append('status', status);

            const response = await fetch(
                `${API_BASE}/app/order/getAllOrders?${params.toString()}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch orders: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                setOrders(result.data.orders || []);
                setPagination({
                    currentPage: result.data.pagination.currentPage,
                    totalPages: result.data.pagination.totalPages,
                    totalOrders: result.data.pagination.totalOrders,
                    totalFilteredOrders: result.data.pagination.totalFilteredOrders || result.data.pagination.totalOrders,
                    totalCreatedOrders: result.data.pagination.totalCreatedOrders,
                    totalConfirmedOrders: result.data.pagination.totalConfirmedOrders,
                    totalProcessingOrders: result.data.pagination.totalProcessingOrders,
                    totalShippedOrders: result.data.pagination.totalShippedOrders,
                    totalOutForDeliveryOrders: result.data.pagination.totalOutForDeliveryOrders,
                    totalDeliveredOrders: result.data.pagination.totalDeliveredOrders,
                    totalCancelledOrders: result.data.pagination.totalCancelledOrders,
                    limit: result.data.pagination.limit,
                    hasNextPage: result.data.pagination.hasNextPage,
                    hasPrevPage: result.data.pagination.hasPrevPage
                });
            } else {
                setErrorOrders(result.message || 'Failed to fetch orders');
            }
        } catch (err) {
            setErrorOrders(err.message || 'An error occurred');
            console.error('Fetch orders error:', err);
        } finally {
            setLoadingOrders(false);
        }
    }, [API_BASE]);

    const handlePageChange = (newPage, search = '', status = '') => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            fetchOrders(newPage, pagination.limit, search, status);
        }
    };

    const handleLimitChange = (newLimit, search = '', status = '') => {
        fetchOrders(1, newLimit, search, status);
    };

    return {
        orders,
        errorOrders,
        loadingOrders,
        pagination,
        handlePageChange,
        handleLimitChange,
        fetchOrders
    };
};

export default useManageOrders;
