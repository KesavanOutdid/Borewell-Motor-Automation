import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/Admin/Header';
import Sidebar from '../../../components/Admin/Sidebar';
import Footer from '../../../components/Admin/Footer';
import TableSkeleton from '../../../components/Common/TableSkeleton';
import useManageOrders from '../../../hooks/Admin/ManageOrders/useManageOrders';

const ManageOrders = ({ userInfo, handleLogout }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const searchTimeoutRef = useRef(null);
    
    const {
        orders,
        errorOrders,
        loadingOrders,
        pagination,
        handlePageChange,
        handleLimitChange,
        fetchOrders
    } = useManageOrders();

    const fetchOrdersCalled = useRef(false);

    useEffect(() => {
        if (!fetchOrdersCalled.current) {
            fetchOrders(1, 10, '', '');
            fetchOrdersCalled.current = true;
        }
    }, [fetchOrders]);

    // Debounced search handler
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            fetchOrders(1, pagination.limit, query, filterStatus);
        }, 500);
    }, [pagination.limit, filterStatus, fetchOrders]);

    // Handle status filter change
    const handleStatusChange = useCallback((status) => {
        setFilterStatus(status);
        fetchOrders(1, pagination.limit, searchQuery, status);
    }, [searchQuery, pagination.limit, fetchOrders]);

    const handleViewOrder = (order) => {
        navigate('/view-order', { state: { order } });
    };

    const getStatusLabel = (status) => {
        const labels = {
            created: 'Created',
            confirmed: 'Confirmed',
            processing: 'Processing',
            shipped: 'Shipped',
            out_for_delivery: 'Out for Delivery',
            delivered: 'Delivered',
            cancelled: 'Cancelled'
        };
        return labels[status] || status;
    };

    const getPaymentStatusLabel = (status) => {
        const labels = {
            pending: 'Pending',
            completed: 'Completed',
            failed: 'Failed',
            cancelled: 'Cancelled'
        };
        return labels[status] || status;
    };

    const getStatusBadgeColor = (status) => {
        const colors = {
            created: '#6c757d',
            confirmed: '#0dcaf0',
            processing: '#ffc107',
            shipped: '#0d6efd',
            out_for_delivery: '#fd7e14',
            delivered: '#198754',
            cancelled: '#dc3545'
        };
        return colors[status] || '#999';
    };

    const getPaymentStatusBadgeColor = (status) => {
        const colors = {
            pending: '#ffc107',
            completed: '#198754',
            failed: '#dc3545',
            cancelled: '#6c757d'
        };
        return colors[status] || '#999';
    };

    return (
        <div style={{ paddingTop: '15px' }}>
            <Sidebar />
            <main className="main-content position-relative h-100 mt-1 border-radius-lg">
                <Header userInfo={userInfo} handleLogout={handleLogout} />
                <div className="container-fluid py-4">
                    <div className="row">
                        <div className="col-12">
                            <div className="card mb-4">
                                <div className="card-header pb-3">
                                    <div className="row g-2 align-items-center mb-3">
                                        <div className="col-md-12 col-12 d-flex flex-wrap gap-1">
                                            <div style={{ flex: '1', minWidth: '120px', backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Total</p>
                                                <p style={{ fontSize: '18px', color: '#1e40af', fontWeight: '700', margin: 0 }}>{pagination?.totalOrders || 0}</p>
                                            </div>
                                            <div style={{ flex: '1', minWidth: '120px', backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Created</p>
                                                <p style={{ fontSize: '18px', color: '#374151', fontWeight: '700', margin: 0 }}>{pagination?.totalCreatedOrders || 0}</p>
                                            </div>
                                            <div style={{ flex: '1', minWidth: '120px', backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Delivered</p>
                                                <p style={{ fontSize: '18px', color: '#15803d', fontWeight: '700', margin: 0 }}>{pagination?.totalDeliveredOrders || 0}</p>
                                            </div>
                                            <div style={{ flex: '1', minWidth: '120px', backgroundColor: '#fef9e7', padding: '12px', borderRadius: '8px', border: '1px solid #fde047', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Processing</p>
                                                <p style={{ fontSize: '18px', color: '#b45309', fontWeight: '700', margin: 0 }}>{pagination?.totalProcessingOrders || 0}</p>
                                            </div>
                                            <div style={{ flex: '1', minWidth: '120px', backgroundColor: '#fef3c7', padding: '12px', borderRadius: '8px', border: '1px solid #fcd34d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Confirmed</p>
                                                <p style={{ fontSize: '18px', color: '#d97706', fontWeight: '700', margin: 0 }}>{pagination?.totalConfirmedOrders || 0}</p>
                                            </div>
                                            <div style={{ flex: '1', minWidth: '120px', backgroundColor: '#e0f2fe', padding: '12px', borderRadius: '8px', border: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Shipped</p>
                                                <p style={{ fontSize: '18px', color: '#0369a1', fontWeight: '700', margin: 0 }}>{pagination?.totalShippedOrders || 0}</p>
                                            </div>
                                            <div style={{ flex: '1', minWidth: '120px', backgroundColor: '#fff7ed', padding: '12px', borderRadius: '8px', border: '1px solid #ffedd5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Out for Delivery</p>
                                                <p style={{ fontSize: '18px', color: '#9a3412', fontWeight: '700', margin: 0 }}>{pagination?.totalOutForDeliveryOrders || 0}</p>
                                            </div>
                                            {/* <div style={{ flex: '1', minWidth: '120px', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Cancelled</p>
                                                <p style={{ fontSize: '18px', color: '#991b1b', fontWeight: '700', margin: 0 }}>{pagination?.totalCancelledOrders || 0}</p>
                                            </div> */}
                                        </div>
                                    </div>

                                    <div className="row g-2 align-items-center">
                                        <div className="col-md-3 col-12 d-flex align-items-center">
                                            <div style={{ position: 'relative', width: '100%' }}>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="🔍 Search by Order ID, Email, or Name..."
                                                    value={searchQuery}
                                                    onChange={(e) => handleSearch(e.target.value)}
                                                    style={{ borderRadius: '6px', padding: '10px 15px', fontSize: '13px' }}
                                                />
                                                {loadingOrders && <small style={{ color: '#999', marginTop: '4px' }}>Searching...</small>}
                                            </div>
                                        </div>
                                        <div className="col-md-3 col-12 d-flex align-items-center">
                                            <select
                                                className="form-control"
                                                value={filterStatus}
                                                onChange={(e) => handleStatusChange(e.target.value)}
                                                style={{ borderRadius: '6px', padding: '10px 15px', fontSize: '13px' }}
                                            >
                                                <option value="">📊 All Status</option>
                                                <option value="created">📝 Created</option>
                                                <option value="confirmed">✓ Confirmed</option>
                                                <option value="processing">⚙️ Processing</option>
                                                <option value="shipped">📦 Shipped</option>
                                                <option value="out_for_delivery">🚚 Out for Delivery</option>
                                                <option value="delivered">✅ Delivered</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-body">
                                    {loadingOrders ? (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '2px solid #e9ecef', backgroundColor: '#f8f9fa' }}>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#333' }}>Order ID</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#333' }}>Customer</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#333' }}>Total</th>
                                                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#333' }}>Order Status</th>
                                                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#333' }}>Payment</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#333' }}>Method</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#333' }}>Date</th>
                                                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#333' }}>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <TableSkeleton rows={8} columns={8} />
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : errorOrders ? (
                                        <div style={{ textAlign: 'center', color: 'red', padding: '40px' }}>
                                            <p>{errorOrders}</p>
                                        </div>
                                    ) : orders && orders.length > 0 ? (
                                        <>
                                            <div style={{ overflowX: 'auto', maxHeight: '700px', overflowY: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8f9fa' }}>
                                                        <tr style={{ borderBottom: '2px solid #e9ecef' }}>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#333' }}>Order ID</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#333' }}>Customer</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#333' }}>Total</th>
                                                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#333' }}>Order Status</th>
                                                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#333' }}>Payment</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#333' }}>Method</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#333' }}>Date</th>
                                                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#333' }}>Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {orders.map((order, index) => (
                                                            <tr key={`order-${index}`} style={{ borderBottom: '1px solid #e9ecef', backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                                                                <td style={{ padding: '12px', fontSize: '12px', fontWeight: '600' }}>
                                                                    <span style={{ color: '#0d6efd', cursor: 'pointer' }} onClick={() => handleViewOrder(order)}>
                                                                        {order.order_id}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '12px', fontSize: '12px' }}>
                                                                    <div>{order.user_name || 'N/A'}</div>
                                                                    <small style={{ color: '#999' }}>{order.user_email}</small>
                                                                </td>
                                                                <td style={{ padding: '12px', fontSize: '12px', fontWeight: '600' }}>
                                                                    ₹{Number(order.order_summary?.grand_total || 0).toFixed(2)}
                                                                </td>
                                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                    <span style={{
                                                                        backgroundColor: getStatusBadgeColor(order.order_status),
                                                                        color: 'white',
                                                                        padding: '6px 12px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '11px',
                                                                        fontWeight: '600',
                                                                        display: 'inline-block',
                                                                        textAlign: 'center',
                                                                        minWidth: '100px'
                                                                    }}>
                                                                        {getStatusLabel(order.order_status)}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                    <span style={{
                                                                        backgroundColor: getPaymentStatusBadgeColor(order.payment_status),
                                                                        color: 'white',
                                                                        padding: '6px 12px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '11px',
                                                                        fontWeight: '600',
                                                                        display: 'inline-block',
                                                                        textAlign: 'center',
                                                                        minWidth: '100px'
                                                                    }}>
                                                                        {getPaymentStatusLabel(order.payment_status)}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '12px', fontSize: '12px', textTransform: 'uppercase' }}>
                                                                    {order.payment_method}
                                                                </td>
                                                                <td style={{ padding: '12px', fontSize: '12px' }}>
                                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                                </td>
                                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                    <button
                                                                        className="btn btn-sm btn-primary mb-0"
                                                                        style={{ padding: '6px 12px', fontSize: '11px' }}
                                                                        onClick={() => handleViewOrder(order)}
                                                                        title="View Order Details"
                                                                    >
                                                                        <i className="fas fa-eye"></i> View
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {orders.length > 0 && pagination && (
                                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-4 px-3">
                                                    <div className="mb-2 mb-md-0">
                                                        <span className="text-sm text-muted">
                                                            Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalFilteredOrders)} of {pagination.totalFilteredOrders} Orders
                                                        </span>
                                                    </div>

                                                    {/* Pagination controls */}
                                                    <div className="d-flex flex-column flex-sm-row align-items-center gap-2">
                                                        {/* Items per page selector */}
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className="text-sm">Show:</span>
                                                            <select
                                                                className="form-select form-select-sm"
                                                                style={{ width: 'auto', minWidth: '70px' }}
                                                                value={pagination.limit}
                                                                onChange={(e) => handleLimitChange(parseInt(e.target.value), searchQuery, filterStatus)}
                                                            >
                                                                <option value={5}>5</option>
                                                                <option value={10}>10</option>
                                                                <option value={25}>25</option>
                                                                <option value={50}>50</option>
                                                            </select>
                                                            <span className="text-sm">per page</span>
                                                        </div>

                                                        {/* Page navigation */}
                                                        <nav aria-label="Order pagination">
                                                            <ul className="pagination pagination-sm mb-0">
                                                                {/* Previous button */}
                                                                <li className={`page-item ${!pagination.hasPrevPage ? 'disabled' : ''}`}>
                                                                    <button
                                                                        className="page-link"
                                                                        onClick={() => handlePageChange(pagination.currentPage - 1, searchQuery, filterStatus)}
                                                                        disabled={!pagination.hasPrevPage}
                                                                        aria-label="Previous"
                                                                    >
                                                                        <i className="fas fa-chevron-left"></i>
                                                                    </button>
                                                                </li>

                                                                {/* Page numbers */}
                                                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                                                    let pageNum;
                                                                    if (pagination.totalPages <= 5) {
                                                                        pageNum = i + 1;
                                                                    } else if (pagination.currentPage <= 3) {
                                                                        pageNum = i + 1;
                                                                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                                                                        pageNum = pagination.totalPages - 4 + i;
                                                                    } else {
                                                                        pageNum = pagination.currentPage - 2 + i;
                                                                    }

                                                                    return (
                                                                        <li key={`page-${pageNum}`} className={`page-item ${pageNum === pagination.currentPage ? 'active' : ''}`}>
                                                                            <button
                                                                                className="page-link"
                                                                                onClick={() => handlePageChange(pageNum, searchQuery, filterStatus)}
                                                                            >
                                                                                {pageNum}
                                                                            </button>
                                                                        </li>
                                                                    );
                                                                })}

                                                                {/* Next button */}
                                                                <li className={`page-item ${!pagination.hasNextPage ? 'disabled' : ''}`}>
                                                                    <button
                                                                        className="page-link"
                                                                        onClick={() => handlePageChange(pagination.currentPage + 1, searchQuery, filterStatus)}
                                                                        disabled={!pagination.hasNextPage}
                                                                        aria-label="Next"
                                                                    >
                                                                        <i className="fas fa-chevron-right"></i>
                                                                    </button>
                                                                </li>
                                                            </ul>
                                                        </nav>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '40px' }}>
                                            <i className="fas fa-inbox" style={{ fontSize: '48px', color: '#ccc', marginBottom: '15px', display: 'block' }}></i>
                                            <p style={{ fontSize: '14px', color: '#999' }}>
                                                {searchQuery || filterStatus ? `No orders found matching your search criteria` : 'No orders available.'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </main>
        </div>
    );
};

export default ManageOrders;
