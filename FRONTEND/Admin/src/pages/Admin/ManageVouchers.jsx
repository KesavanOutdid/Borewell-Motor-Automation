import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Admin/Header';
import Sidebar from '../../components/Admin/Sidebar';
import Footer from '../../components/Admin/Footer';
import TableSkeleton from '../../components/Common/TableSkeleton';
import useManageVouchers from '../../hooks/Admin/useManageVouchers';
import { showDeleteConfirmation } from '../../utils/alert';

const ManageVouchers = ({ userInfo, handleLogout }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const searchTimeoutRef = useRef(null);
    const {
        vouchers,
        errorVouchers,
        loadingVouchers,
        pagination,
        handlePageChange,
        handleLimitChange,
        handleVoucherDelete,
        fetchVoucherData
    } = useManageVouchers(userInfo);

    const fetchVoucherDataCalled = useRef(false);

    useEffect(() => {
        if (!fetchVoucherDataCalled.current) {
            fetchVoucherData();
            fetchVoucherDataCalled.current = true;
        }
    }, [fetchVoucherData]);

    // Handle search with debounce
    const handleSearch = (query) => {
        setSearchQuery(query);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            fetchVoucherData(1, pagination.limit, query);
        }, 500);
    };

    const handleEditVoucher = (voucher) => {
        navigate('/edit-voucher', { state: { voucher } });
    };

    const handleDeleteVoucher = async (e, id, code) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        await handleVoucherDelete(id, code);
        fetchVoucherData();
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const isVoucherValid = (voucher) => {
        const now = new Date();
        const start = new Date(voucher.start_date);
        const end = new Date(voucher.end_date);
        return voucher.status && now >= start && now <= end;
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
                                        <div className="row g-2 align-items-center">
                                            <div className="col-md-2 col-6 d-flex align-items-center">
                                                <button className="btn btn-primary mb-0" style={{ padding: '10px', width: '50%' }} onClick={() => navigate('/add-voucher')}>
                                                    <i className="fas fa-plus" aria-hidden="true" style={{ color: 'white' }}></i> Create
                                                </button>
                                            </div>
                                            <div className="col-md-2 col-6">
                                                <div style={{ backgroundColor: '#f0f9ff', padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Total</p>
                                                    <p style={{ fontSize: '18px', color: '#1e40af', fontWeight: '700', margin: 0 }}>{pagination?.totalVouchers || 0}</p>
                                                </div>
                                            </div>
                                            <div className="col-md-2 col-6">
                                                <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Active</p>
                                                    <p style={{ fontSize: '18px', color: '#15803d', fontWeight: '700', margin: 0 }}>{pagination?.totalActiveVouchers || 0}</p>
                                                </div>
                                            </div>
                                            <div className="col-md-2 col-6">
                                                <div style={{ backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Inactive</p>
                                                    <p style={{ fontSize: '18px', color: '#991b1b', fontWeight: '700', margin: 0 }}>{pagination?.totalInactiveVouchers || 0}</p>
                                                </div>
                                            </div>
                                            <div className="col-md-2 col-6">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="🔍 Search vouchers..."
                                                    value={searchQuery}
                                                    onChange={(e) => handleSearch(e.target.value)}
                                                    style={{ borderRadius: '6px', padding: '10px 15px', fontSize: '14px' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-body">
                                    {loadingVouchers ? (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#f5f7fa', borderBottom: '2px solid #e0e0e0' }}>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Code</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Discount %</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Valid From</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Valid Until</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Usage</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Description</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Status</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <TableSkeleton rows={8} columns={8} />
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : errorVouchers ? (
                                        <div style={{ textAlign: 'center', color: 'red', padding: '40px' }}>
                                            <p>{errorVouchers}</p>
                                        </div>
                                    ) : vouchers && vouchers.length > 0 ? (
                                        <>
                                            <div style={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ backgroundColor: '#f5f7fa', borderBottom: '2px solid #e0e0e0' }}>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Code</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Discount %</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Valid From</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Valid Until</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Usage</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Description</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Status</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {vouchers.map((voucher, index) => (
                                                            <tr key={`voucher-${index}`} style={{ borderBottom: '1px solid #e0e0e0', hover: { backgroundColor: '#f9f9f9' } }}>
                                                                <td style={{ padding: '12px', fontWeight: '600', color: '#1e40af' }}>{voucher.voucher_code}</td>
                                                                <td style={{ padding: '12px', color: '#333' }}>{voucher.discount_percentage}%</td>
                                                                <td style={{ padding: '12px', color: '#666' }}>{formatDate(voucher.start_date)}</td>
                                                                <td style={{ padding: '12px', color: '#666' }}>{formatDate(voucher.end_date)}</td>
                                                                <td style={{ padding: '12px', color: '#666' }}>{voucher.used_count}{voucher.max_usage ? `/${voucher.max_usage}` : ''}</td>
                                                                <td style={{ padding: '12px', color: '#666', minWidth: '150px', maxWidth: '250px' }}>
                                                                    <div style={{ 
                                                                        maxHeight: '100px', 
                                                                        overflowY: 'auto', 
                                                                        whiteSpace: 'normal', 
                                                                        wordBreak: 'break-word',
                                                                        fontSize: '12px',
                                                                        lineHeight: '1.5',
                                                                        paddingRight: '5px'
                                                                    }}>
                                                                        {voucher.description || 'N/A'}
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '12px' }}>
                                                                    <span style={{
                                                                        backgroundColor: isVoucherValid(voucher) ? '#15803d' : (voucher.status ? '#f97316' : '#6c757d'),
                                                                        color: 'white',
                                                                        padding: '4px 10px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '11px',
                                                                        fontWeight: '600'
                                                                    }}>
                                                                        {isVoucherValid(voucher) ? 'Valid' : (voucher.status ? 'Pending' : 'Inactive')}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '12px' }}>
                                                                    <button
                                                                        className="btn btn-sm btn-info mb-0"
                                                                        onClick={() => handleEditVoucher(voucher)}
                                                                        style={{ marginRight: '5px' }}
                                                                    >
                                                                        <i className="fas fa-pen"></i> Edit
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-sm btn-danger mb-0"
                                                                        onClick={(e) => handleDeleteVoucher(e, voucher._id, voucher.voucher_code)}
                                                                    >
                                                                        <i className="fas fa-trash"></i> Delete
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-4 px-3">
                                                <div className="mb-2 mb-md-0">
                                                    <span className="text-sm text-muted">
                                                                Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalVouchers)} of {pagination.totalVouchers} Vouchers
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
                                                            onChange={(e) => handleLimitChange(parseInt(e.target.value), searchQuery)}
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
                                                                    onClick={() => handlePageChange(pagination.currentPage - 1, searchQuery)}
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
                                                                            onClick={() => handlePageChange(pageNum, searchQuery)}
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
                                                                    onClick={() => handlePageChange(pagination.currentPage + 1, searchQuery)}
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
                                        </>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                            <p>No vouchers found</p>
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

export default ManageVouchers;
