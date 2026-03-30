import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/Admin/Header';
import Sidebar from '../../../components/Admin/Sidebar';
import Footer from '../../../components/Admin/Footer';
import TableSkeleton from '../../../components/Common/TableSkeleton';
import useManageHelp from '../../../hooks/Admin/ManageHelp/useManageHelp';

const ManageHelp = ({ userInfo, handleLogout }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const searchTimeoutRef = useRef(null);
    const {
        helpRequests,
        errorHelp,
        loadingHelp,
        pagination,
        handlePageChange,
        handleLimitChange,
        fetchHelpData
    } = useManageHelp(userInfo);

    const fetchHelpDataCalled = useRef(false);

    useEffect(() => {
        if (!fetchHelpDataCalled.current) {
            fetchHelpData();
            fetchHelpDataCalled.current = true;
        }
    }, [fetchHelpData]);

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            fetchHelpData(1, pagination.limit, query, statusFilter);
        }, 500);
    };

    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        fetchHelpData(1, pagination.limit, searchQuery, status);
    };

    const handleViewHelp = (help) => {
        navigate('/view-help', { state: { help } });
    };

    const formatDateTime = (date) => {
        return new Date(date).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#d97706';
            case 'solved': return '#15803d';
            case 'rejected': return '#991b1b';
            case 're-solved': return '#1e40af';
            default: return '#6c757d';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'solved': return 'Solved';
            case 'rejected': return 'Rejected';
            case 're-solved': return 'Re-Solved';
            default: return status;
        }
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
                                            <div className="col-md-9 col-12 d-flex flex-wrap gap-1">
                                                <div
                                                    onClick={() => handleStatusFilter('all')}
                                                    style={{
                                                        flex: '1 0 110px', backgroundColor: statusFilter === 'all' ? '#dbeafe' : '#f0f9ff',
                                                        padding: '12px', borderRadius: '8px',
                                                        border: statusFilter === 'all' ? '2px solid #3b82f6' : '1px solid #bfdbfe',
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        cursor: 'pointer', transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Total</p>
                                                    <p style={{ fontSize: '18px', color: '#1e40af', fontWeight: '700', margin: 0 }}>{pagination?.totalHelp || 0}</p>
                                                </div>
                                                <div
                                                    onClick={() => handleStatusFilter('pending')}
                                                    style={{
                                                        flex: '1 0 110px', backgroundColor: statusFilter === 'pending' ? '#fef3c7' : '#fffbeb',
                                                        padding: '12px', borderRadius: '8px',
                                                        border: statusFilter === 'pending' ? '2px solid #f59e0b' : '1px solid #fef3c7',
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        cursor: 'pointer', transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Pending</p>
                                                    <p style={{ fontSize: '18px', color: '#d97706', fontWeight: '700', margin: 0 }}>{pagination?.totalPending || 0}</p>
                                                </div>
                                                <div
                                                    onClick={() => handleStatusFilter('solved')}
                                                    style={{
                                                        flex: '1 0 110px', backgroundColor: statusFilter === 'solved' ? '#dcfce7' : '#f0fdf4',
                                                        padding: '12px', borderRadius: '8px',
                                                        border: statusFilter === 'solved' ? '2px solid #22c55e' : '1px solid #bbf7d0',
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        cursor: 'pointer', transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Solved</p>
                                                    <p style={{ fontSize: '18px', color: '#15803d', fontWeight: '700', margin: 0 }}>{pagination?.totalSolved || 0}</p>
                                                </div>
                                                <div
                                                    onClick={() => handleStatusFilter('rejected')}
                                                    style={{
                                                        flex: '1 0 110px', backgroundColor: statusFilter === 'rejected' ? '#fecaca' : '#fef2f2',
                                                        padding: '12px', borderRadius: '8px',
                                                        border: statusFilter === 'rejected' ? '2px solid #ef4444' : '1px solid #fecaca',
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        cursor: 'pointer', transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Rejected</p>
                                                    <p style={{ fontSize: '18px', color: '#991b1b', fontWeight: '700', margin: 0 }}>{pagination?.totalRejected || 0}</p>
                                                </div>
                                                <div
                                                    onClick={() => handleStatusFilter('re-solved')}
                                                    style={{
                                                        flex: '1 0 110px', backgroundColor: statusFilter === 're-solved' ? '#dbeafe' : '#f0f9ff',
                                                        padding: '12px', borderRadius: '8px',
                                                        border: statusFilter === 're-solved' ? '2px solid #3b82f6' : '1px solid #bfdbfe',
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        cursor: 'pointer', transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Re-Solved</p>
                                                    <p style={{ fontSize: '18px', color: '#1e40af', fontWeight: '700', margin: 0 }}>{pagination?.totalReSolved || 0}</p>
                                                </div>
                                            </div>
                                            <div className="col-md-3 col-12">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="🔍 Search help requests..."
                                                    value={searchQuery}
                                                    onChange={(e) => handleSearch(e.target.value)}
                                                    style={{ borderRadius: '6px', padding: '10px 15px', fontSize: '14px' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-body">
                                    {loadingHelp ? (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#f5f7fa', borderBottom: '2px solid #e0e0e0' }}>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>S.No</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>User Name</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Mobile</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Subject</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Serial No.</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Nickname</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Date/Time</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Status</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Options</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <TableSkeleton rows={8} columns={9} />
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : errorHelp ? (
                                        <div style={{ textAlign: 'center', color: 'red', padding: '40px' }}>
                                            <p>{errorHelp}</p>
                                        </div>
                                    ) : helpRequests && helpRequests.length > 0 ? (
                                        <>
                                            <div style={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ backgroundColor: '#f5f7fa', borderBottom: '2px solid #e0e0e0' }}>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>S.No</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>User Name</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Mobile</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Subject</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Serial No.</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Nickname</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Date/Time</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Status</th>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#4a5a6a' }}>Options</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {helpRequests.map((help, index) => (
                                                            <tr key={`help-${index}`} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                                                <td style={{ padding: '12px', color: '#333' }}>
                                                                    {((pagination.currentPage - 1) * pagination.limit) + index + 1}
                                                                </td>
                                                                <td style={{ padding: '12px', fontWeight: '600', color: '#333' }}>{help.user_name}</td>
                                                                <td style={{ padding: '12px', color: '#666' }}>{help.user_mobile}</td>
                                                                <td style={{ padding: '12px', color: '#666', maxWidth: '200px' }}>
                                                                    <div style={{
                                                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                                        fontSize: '13px'
                                                                    }}>
                                                                        {help.subject}
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '12px', color: '#666', fontSize: '12px' }}>{help.serial_number || '-'}</td>
                                                                <td style={{ padding: '12px', color: '#666', fontSize: '12px' }}>{help.device_nickname || '-'}</td>
                                                                <td style={{ padding: '12px', color: '#666', fontSize: '11px' }}>
                                                                    {formatDateTime(help.createdAt)}
                                                                </td>
                                                                <td style={{ padding: '12px' }}>
                                                                    <span style={{
                                                                        backgroundColor: getStatusColor(help.status),
                                                                        color: 'white',
                                                                        padding: '4px 0',
                                                                        borderRadius: '4px',
                                                                        fontSize: '11px',
                                                                        fontWeight: '600',
                                                                        display: 'inline-block',
                                                                        width: '80px',
                                                                        textAlign: 'center'
                                                                    }}>
                                                                        {getStatusLabel(help.status)}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                                                                    <button
                                                                        className="btn btn-sm btn-success mb-0"
                                                                        onClick={() => handleViewHelp(help)}
                                                                        style={{ width: '75px', padding: '6px 0', fontSize: '11px' }}
                                                                    >
                                                                        <i className="fas fa-eye" style={{ fontSize: '10px', marginRight: '4px' }}></i> View
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
                                                        Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalHelp)} of {pagination.totalHelp} Help Requests
                                                    </span>
                                                </div>

                                                <div className="d-flex flex-column flex-sm-row align-items-center gap-2">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="text-sm">Show:</span>
                                                        <select
                                                            className="form-select form-select-sm"
                                                            style={{ width: 'auto', minWidth: '70px' }}
                                                            value={pagination.limit}
                                                            onChange={(e) => handleLimitChange(parseInt(e.target.value), searchQuery, statusFilter)}
                                                        >
                                                            <option value={5}>5</option>
                                                            <option value={10}>10</option>
                                                            <option value={25}>25</option>
                                                            <option value={50}>50</option>
                                                        </select>
                                                        <span className="text-sm">per page</span>
                                                    </div>

                                                    <nav aria-label="Help pagination">
                                                        <ul className="pagination pagination-sm mb-0">
                                                            <li className={`page-item ${!pagination.hasPrevPage ? 'disabled' : ''}`}>
                                                                <button
                                                                    className="page-link"
                                                                    onClick={() => handlePageChange(pagination.currentPage - 1, searchQuery, statusFilter)}
                                                                    disabled={!pagination.hasPrevPage}
                                                                    aria-label="Previous"
                                                                >
                                                                    <i className="fas fa-chevron-left"></i>
                                                                </button>
                                                            </li>

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
                                                                            onClick={() => handlePageChange(pageNum, searchQuery, statusFilter)}
                                                                        >
                                                                            {pageNum}
                                                                        </button>
                                                                    </li>
                                                                );
                                                            })}

                                                            <li className={`page-item ${!pagination.hasNextPage ? 'disabled' : ''}`}>
                                                                <button
                                                                    className="page-link"
                                                                    onClick={() => handlePageChange(pagination.currentPage + 1, searchQuery, statusFilter)}
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
                                            <p>No help requests found</p>
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

export default ManageHelp;
