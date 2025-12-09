import { useState, useCallback } from 'react';

const useViewOrder = () => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;
    const [order, setOrder] = useState(null);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const [errorOrder, setErrorOrder] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const fetchOrderDetails = useCallback(async (orderId) => {
        try {
            setLoadingOrder(true);
            setErrorOrder(null);

            const response = await fetch(
                `${API_BASE}/app/order/getOrderById`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: order?.user_id || 0,
                        order_id: orderId
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch order details');
            }

            const result = await response.json();

            if (result.success) {
                setOrder(result.data.order);
            } else {
                setErrorOrder(result.message || 'Failed to fetch order details');
            }
        } catch (err) {
            setErrorOrder(err.message || 'An error occurred');
            console.error('Fetch order details error:', err);
        } finally {
            setLoadingOrder(false);
        }
    }, [API_BASE, order?.user_id]);

    const updateOrderStatus = useCallback(async (orderId, newStatus, message, updatedBy) => {
        try {
            setUpdatingStatus(true);

            const response = await fetch(
                `${API_BASE}/app/order/updateOrderStatus`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        order_id: orderId,
                        order_status: newStatus,
                        message: message || `Order updated to ${newStatus}`,
                        updated_by: updatedBy
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update order status');
            }

            const result = await response.json();

            if (result.success) {
                setOrder(prevOrder => ({
                    ...prevOrder,
                    order_status: result.data.order_status,
                    order_timeline: result.data.order_timeline
                }));
                return { success: true, message: result.message };
            } else {
                throw new Error(result.message || 'Failed to update order status');
            }
        } catch (err) {
            console.error('Update order status error:', err);
            return { success: false, message: err.message || 'An error occurred' };
        } finally {
            setUpdatingStatus(false);
        }
    }, [API_BASE]);

    return {
        order,
        loadingOrder,
        errorOrder,
        updatingStatus,
        fetchOrderDetails,
        updateOrderStatus,
        setOrder
    };
};

export default useViewOrder;
