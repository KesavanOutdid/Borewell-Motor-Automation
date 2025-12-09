import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/Admin/Header';
import Sidebar from '../../components/Admin/Sidebar';
import Footer from '../../components/Admin/Footer';
// import StatusTimeline from '../../components/Admin/StatusTimeline';
import useViewOrder from '../../hooks/Admin/useViewOrder';
import { showAlertSuccess, showAlertError } from '../../utils/alert';

const ViewOrder = ({ userInfo, handleLogout }) => {
    // const API_BASE = process.env.REACT_APP_SERVER_URL;
    const location = useLocation();
    const navigate = useNavigate();
    const { order: passedOrder } = location.state || {};
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    const { order, updatingStatus, updateOrderStatus, setOrder } = useViewOrder();

    useEffect(() => {
        if (passedOrder) {
            setOrder(passedOrder);
        }
    }, [passedOrder, setOrder]);

    const statusFlow = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

    const getAvailableStatuses = (currentStatus) => {
        const currentIndex = statusFlow.indexOf(currentStatus);
        if (currentIndex === -1) return statusFlow;
        return statusFlow.slice(currentIndex + 1);
    };

    const handleUpdateStatus = async () => {
        if (!selectedStatus) {
            showAlertError('Please select a status');
            return;
        }

        const result = await updateOrderStatus(
            order.order_id,
            selectedStatus,
            statusMessage || `Order updated to ${selectedStatus}`,
            userInfo?.user_email || 'admin'
        );

        if (result.success) {
            showAlertSuccess('Order status updated successfully');
            setTimeout(() => {
                setShowStatusModal(false);
                setSelectedStatus('');
                setStatusMessage('');
            }, 300);
        } else {
            showAlertError(result.message);
        }
    };

    if (!order) {
        return (
            <div style={{ paddingTop: '15px' }}>
                <Sidebar />
                <main className="main-content position-relative h-100 mt-1 border-radius-lg">
                    <Header userInfo={userInfo} handleLogout={handleLogout} />
                    <div className="container-fluid py-4">
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <p>Loading order details...</p>
                        </div>
                    </div>
                    <Footer />
                </main>
            </div>
        );
    }

    const getStatusColor = (status) => {
        const colors = {
            created: '#6c757d',
            confirmed: '#0dcaf0',
            processing: '#ffc107',
            shipped: '#0d6efd',
            out_for_delivery: '#fd7e14',
            delivered: '#198754',
            // cancelled: '#dc3545'
        };
        return colors[status] || '#999';
    };

    const getPaymentStatusColor = (status) => {
        const colors = {
            pending: '#ffc107',
            completed: '#198754',
            failed: '#dc3545',
            // cancelled: '#6c757d'
        };
        return colors[status] || '#999';
    };

    const getStatusLabel = (status) => {
        const labels = {
            created: 'Created',
            confirmed: 'Confirmed',
            processing: 'Processing',
            shipped: 'Shipped',
            out_for_delivery: 'Out for Delivery',
            delivered: 'Delivered',
            // cancelled: 'Cancelled'
        };
        return labels[status] || status;
    };

    const isStatusCompleted = (status) => {
        const currentIndex = statusFlow.indexOf(order.order_status);
        const statusIndex = statusFlow.indexOf(status);
        return statusIndex < currentIndex;
    };

    const isStatusCurrent = (status) => {
        return order.order_status === status;
    };

    const formatDateIndian = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    const availableStatuses = getAvailableStatuses(order.order_status);

    return (
        <div style={{ paddingTop: '15px' }}>
            <Sidebar />
            <main className="main-content position-relative h-100 mt-1 border-radius-lg">
                <Header userInfo={userInfo} handleLogout={handleLogout} />
                <div className="container-fluid py-4">
                    <div className="row">
                        <div className="col-12">
                            <button
                                className="btn btn-secondary mb-3"
                                onClick={() => navigate(-1)}
                                style={{ fontSize: '13px', padding: '8px 16px' }}
                            >
                                <i className="fas fa-arrow-left"></i> Back
                            </button>

                            <div className="card mb-4">
                                <div className="card-body" style={{ padding: '20px' }}>
                                    <h6 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '20px', color: '#333' }}>Order Progress</h6>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                                        {statusFlow.map((status, index) => {
                                            const completed = isStatusCompleted(status);
                                            const current = isStatusCurrent(status);
                                            const statusColor = getStatusColor(status);

                                            return (
                                                <div key={status} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                                                    {index > 0 && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '20px',
                                                            left: '-50%',
                                                            width: '100%',
                                                            height: '3px',
                                                            backgroundColor: isStatusCompleted(statusFlow[index - 1]) ? statusColor : '#e9ecef'
                                                        }}></div>
                                                    )}
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        backgroundColor: completed || current ? statusColor : '#e9ecef',
                                                        border: current ? `3px solid ${statusColor}` : `2px solid ${statusColor}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#fff',
                                                        fontWeight: 'bold',
                                                        fontSize: '18px',
                                                        zIndex: 1,
                                                        boxShadow: current ? `0 0 0 4px rgba(${parseInt(statusColor.slice(1, 3), 16)}, ${parseInt(statusColor.slice(3, 5), 16)}, ${parseInt(statusColor.slice(5, 7), 16)}, 0.2)` : 'none'
                                                    }}>
                                                        {completed ? '✓' : (current ? '●' : '')}
                                                    </div>
                                                    
                                                    {/* <small style={{ marginTop: '8px', fontSize: '11px', fontWeight: '600', color: current ? statusColor : '#666', textAlign: 'center' }}>
                                                        {getStatusLabel(status)}
                                                    </small> */}

                                                    <small style={{ marginTop: '8px', fontSize: '11px', fontWeight: '600', color: current ? statusColor : '#666', textAlign: 'center' }}>
                                                        {getStatusLabel(status)}

                                                        {/* Show message + timestamp */}
                                                        {(() => {
                                                            const event = order?.order_timeline?.find(e => e.status === status);
                                                            if (event) {
                                                                return (
                                                                    <>
                                                                        <br />
                                                                        <span style={{ fontSize: '10px', color: '#444', fontWeight: '400' }}>
                                                                            {event.message}
                                                                        </span>
                                                                        <br />
                                                                        <span style={{ fontSize: '10px', color: '#777', fontWeight: '400' }}>
                                                                            {formatDateIndian(event.timestamp)}
                                                                        </span>
                                                                    </>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </small>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-lg-8">
                                    <div className="card mb-4">
                                        <div className="card-header pb-3">
                                            <h6 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                                                Order #{order.order_id}
                                            </h6>
                                            <small style={{ color: '#999' }}>
                                                Created on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                                            </small>
                                        </div>
                                        <div className="card-body">
                                            <div className="row mb-4">
                                                <div className="col-md-6">
                                                    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                                                        <h6 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: '#333', display: 'flex', alignItems: 'center' }}>
                                                            <i className="fas fa-user-circle" style={{ marginRight: '6px', color: '#0d6efd' }}></i>
                                                            Customer Information
                                                        </h6>
                                                        <p style={{ fontSize: '12px', margin: '6px 0' }}>
                                                            <strong>👤 Name:</strong> {order.user_name || 'N/A'}
                                                        </p>
                                                        <p style={{ fontSize: '12px', margin: '6px 0' }}>
                                                            <strong>✉️ Email:</strong> <a href={`mailto:${order.user_email}`} style={{ color: '#0d6efd', textDecoration: 'none' }}>{order.user_email}</a>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div style={{ backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                                                        <h6 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: '#333', display: 'flex', alignItems: 'center' }}>
                                                            <i className="fas fa-clipboard-check" style={{ marginRight: '6px', color: '#0d6efd' }}></i>
                                                            Current Status
                                                        </h6>
                                                        <p style={{ fontSize: '12px', margin: '6px 0' }}>
                                                            <strong>📊 Order:</strong>
                                                            <span style={{
                                                                backgroundColor: getStatusColor(order.order_status),
                                                                color: 'white',
                                                                padding: '4px 12px',
                                                                borderRadius: '20px',
                                                                marginLeft: '8px',
                                                                display: 'inline-block',
                                                                fontSize: '11px',
                                                                fontWeight: '600',
                                                                textTransform: 'capitalize'
                                                            }}>
                                                                {order.order_status.replace(/_/g, ' ')}
                                                            </span>
                                                        </p>
                                                        <p style={{ fontSize: '12px', margin: '6px 0' }}>
                                                            <strong>💳 Payment:</strong>
                                                            <span style={{
                                                                backgroundColor: getPaymentStatusColor(order.payment_status),
                                                                color: 'white',
                                                                padding: '4px 12px',
                                                                borderRadius: '20px',
                                                                marginLeft: '8px',
                                                                display: 'inline-block',
                                                                fontSize: '11px',
                                                                fontWeight: '600',
                                                                textTransform: 'capitalize'
                                                            }}>
                                                                {order.payment_status}
                                                            </span>
                                                        </p>
                                                        <p style={{ fontSize: '12px', margin: '6px 0' }}>
                                                            <strong>🔄 Method:</strong> <code style={{ backgroundColor: '#e9ecef', padding: '2px 6px', borderRadius: '3px', textTransform: 'uppercase', fontSize: '11px' }}>{order.payment_method}</code>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <hr style={{ margin: '20px 0' }} />

                                            <h6 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '15px' }}>Shipping Address</h6>
                                            <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                                                <p style={{ fontSize: '12px', margin: '4px 0' }}><strong>{order.shipping_address.full_name}</strong></p>
                                                <p style={{ fontSize: '12px', margin: '4px 0' }}>{order.shipping_address.street}</p>
                                                <p style={{ fontSize: '12px', margin: '4px 0' }}>{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}</p>
                                                <p style={{ fontSize: '12px', margin: '4px 0' }}>{order.shipping_address.country}</p>
                                                <p style={{ fontSize: '12px', margin: '4px 0' }}><strong>Phone:</strong> {order.shipping_address.phone}</p>
                                                <p style={{ fontSize: '12px', margin: '4px 0' }}><strong>Email:</strong> {order.shipping_address.email}</p>
                                            </div>

                                            <h6 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '15px' }}>Order Items</h6>
                                            <div style={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                                    <thead>
                                                        <tr style={{ borderBottom: '2px solid #e9ecef', backgroundColor: '#f8f9fa' }}>
                                                            <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Product</th>
                                                            <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600' }}>Qty</th>
                                                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: '600' }}>Price</th>
                                                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: '600' }}>GST</th>
                                                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: '600' }}>Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {order.cart_items && order.cart_items.map((item, index) => (
                                                            <tr key={index} style={{ borderBottom: '1px solid #e9ecef' }}>
                                                                <td style={{ padding: '10px' }}>{item.product_name}</td>
                                                                <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
                                                                <td style={{ padding: '10px', textAlign: 'right' }}>₹{item.product_price}</td>
                                                                <td style={{ padding: '10px', textAlign: 'right' }}>₹{((item.product_price * item.quantity * item.product_gst) / 100).toFixed(2)}</td>
                                                                <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600' }}>₹{(item.product_price * item.quantity + (item.product_price * item.quantity * item.product_gst) / 100).toFixed(2)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-lg-4">
                                    <div className="card mb-4">
                                        <div className="card-header pb-3">
                                            <h6 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Order Summary</h6>
                                        </div>
                                        <div className="card-body">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px', borderBottom: '1px solid #e9ecef', paddingBottom: '10px' }}>
                                                <span>Subtotal:</span>
                                                <span>₹{order.order_summary.total_price}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px', borderBottom: '1px solid #e9ecef', paddingBottom: '10px' }}>
                                                <span>GST (5-18%):</span>
                                                <span>₹{order.order_summary.total_gst.toFixed(2)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px', borderBottom: '1px solid #e9ecef', paddingBottom: '10px' }}>
                                                <span>Shipping:</span>
                                                <span>₹{order.order_summary.total_shipping_cost}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '14px', fontWeight: '700' }}>
                                                <span>Grand Total:</span>
                                                <span style={{ color: '#0d6efd' }}>₹{order.order_summary.grand_total}</span>
                                            </div>

                                            <button
                                                className="btn btn-primary w-100 mb-2"
                                                style={{ fontSize: '12px' }}
                                                onClick={() => setShowStatusModal(true)}
                                                disabled={updatingStatus || availableStatuses.length === 0}
                                            >
                                                <i className="fas fa-edit"></i> Update Status
                                            </button>

                                            {availableStatuses.length === 0 && (
                                                <div style={{ backgroundColor: '#d1ecf1', padding: '10px', borderRadius: '6px', borderLeft: '4px solid #17a2b8', marginTop: '10px' }}>
                                                    <p style={{ fontSize: '11px', color: '#0c5460', margin: '0' }}>Order is in final status</p>
                                                </div>
                                            )}

                                            {order.cancellation_reason && (
                                                <div style={{ backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px', borderLeft: '4px solid #dc3545', marginTop: '10px' }}>
                                                    <p style={{ fontSize: '11px', fontWeight: '600', color: '#dc3545', margin: '4px 0' }}>Cancellation Reason</p>
                                                    <p style={{ fontSize: '12px', margin: '4px 0' }}>{order.cancellation_reason}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="card">
                                        <div className="card-header pb-3">
                                            <h6 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Payment Information</h6>
                                        </div>
                                        <div className="card-body">
                                            <p style={{ fontSize: '12px', margin: '6px 0' }}>
                                                <strong>Method:</strong> {order.payment_method?.toUpperCase()}
                                            </p>
                                            <p style={{ fontSize: '12px', margin: '6px 0' }}>
                                                <strong>Status:</strong>
                                                <span style={{
                                                    backgroundColor: getPaymentStatusColor(order.payment_status),
                                                    color: 'white',
                                                    padding: '2px 8px',
                                                    borderRadius: '3px',
                                                    marginLeft: '4px',
                                                    display: 'inline-block',
                                                    fontSize: '10px'
                                                }}>
                                                    {order.payment_status}
                                                </span>
                                            </p>
                                            {order.razorpay_payment_id && (
                                                <p style={{ fontSize: '12px', margin: '6px 0', wordBreak: 'break-all' }}>
                                                    <strong>Payment ID:</strong> {order.razorpay_payment_id}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {showStatusModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        // backgroundColor: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            padding: '30px',
                            width: '90%',
                            maxWidth: '520px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                            animation: 'slideIn 0.3s ease-out'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '2px solid #f0f0f0' }}>
                                <h5 style={{ margin: 0, fontWeight: '700', fontSize: '18px', color: '#333' }}>
                                    <i className="fas fa-sync-alt" style={{ marginRight: '8px', color: '#0d6efd' }}></i>
                                    Update Order Status
                                </h5>
                                <button
                                    onClick={() => setShowStatusModal(false)}
                                    disabled={updatingStatus}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '24px',
                                        cursor: 'pointer',
                                        color: '#999'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="form-group mb-4">
                                <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', display: 'block', color: '#333' }}>
                                    <i className="fas fa-tag" style={{ marginRight: '6px', color: '#0d6efd' }}></i>
                                    Select New Status
                                </label>
                                <select
                                    className="form-control"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    style={{ padding: '12px 15px', fontSize: '13px', borderRadius: '8px', border: '2px solid #e9ecef', fontWeight: '500' }}
                                >
                                    <option value="">-- Choose a status --</option>
                                    {availableStatuses.map(status => (
                                        <option key={status} value={status}>
                                            {status === 'confirmed' ? '✓' : ''}
                                            {status === 'processing' ? '⚙️' : ''}
                                            {status === 'shipped' ? '📦' : ''}
                                            {status === 'out_for_delivery' ? '🚚' : ''}
                                            {status === 'delivered' ? '✅' : ''}
                                            {/* {status === 'cancelled' ? '❌' : ''} */}
                                            {' '}{getStatusLabel(status)}
                                        </option>
                                    ))}
                                </select>
                                {selectedStatus && (
                                    <small style={{ color: '#0d6efd', marginTop: '6px', display: 'block', fontWeight: '500' }}>
                                        Current Status: <strong>{getStatusLabel(order.order_status)}</strong> → New Status: <strong>{getStatusLabel(selectedStatus)}</strong>
                                    </small>
                                )}
                            </div>

                            <div className="form-group mb-4">
                                <label style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', display: 'block', color: '#333' }}>
                                    <i className="fas fa-comment" style={{ marginRight: '6px', color: '#0d6efd' }}></i>
                                    Update Message (Optional)
                                </label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    value={statusMessage}
                                    onChange={(e) => setStatusMessage(e.target.value)}
                                    placeholder="📝 Add a message for this status update (e.g., Item packaged and ready to ship)..."
                                    style={{ padding: '12px 15px', fontSize: '13px', borderRadius: '8px', border: '2px solid #e9ecef', fontFamily: 'inherit', resize: 'vertical' }}
                                ></textarea>
                                <small style={{ color: '#999', marginTop: '6px', display: 'block' }}>
                                    This message will be visible in the order timeline
                                </small>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '15px' }}>
                                <button
                                    className="btn btn-light"
                                    onClick={() => setShowStatusModal(false)}
                                    disabled={updatingStatus}
                                    style={{ fontSize: '13px', padding: '10px 20px', fontWeight: '600', border: '1px solid #dee2e6' }}
                                >
                                    <i className="fas fa-times" style={{ marginRight: '6px' }}></i>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleUpdateStatus}
                                    disabled={updatingStatus || !selectedStatus}
                                    style={{ fontSize: '13px', padding: '10px 24px', fontWeight: '600' }}
                                >
                                    <i className={`fas ${updatingStatus ? 'fa-spinner fa-spin' : 'fa-check-circle'}`} style={{ marginRight: '6px' }}></i>
                                    {updatingStatus ? 'Updating...' : 'Update Status'}
                                </button>
                            </div>
                        </div>
                        <style>{`
                            @keyframes slideIn {
                                from {
                                    opacity: 0;
                                    transform: translateY(-20px);
                                }
                                to {
                                    opacity: 1;
                                    transform: translateY(0);
                                }
                            }
                        `}</style>
                    </div>
                )}

                <Footer />
            </main>
        </div>
    );
};

export default ViewOrder;
