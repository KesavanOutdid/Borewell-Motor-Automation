import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../../components/Admin/Header';
import Sidebar from '../../../components/Admin/Sidebar';
import Footer from '../../../components/Admin/Footer';
import { formatDateToIST } from '../../../utils/formatDateToIST';
import TableSkeleton from '../../../components/Common/TableSkeleton';

const ManageDevicesView = ({ userInfo, handleLogout }) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;
    const navigate = useNavigate();
    const location = useLocation();
    const deviceDetails = location.state?.device;

    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [schedules, setSchedules] = useState([]);
    const [loadingSchedules, setLoadingSchedules] = useState(false);
    
    // Pagination state for Device History
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    });

    const fetchHistory = async (page = 1, limit = 10) => {
        if (deviceDetails?.serial_number) {
            setLoadingHistory(true);
            try {
                // Using POST /admin/userDeviceHistory as seen in DeviceHistory.jsx
                const response = await fetch(`${API_BASE}/admin/userDeviceHistory`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        user_id: deviceDetails.assigned_user_id || deviceDetails.user_details?.user_id, 
                        serial_number: deviceDetails.serial_number,
                        page: page,
                        limit: limit
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setHistory(data.data || []);
                    setPagination({
                        currentPage: data.currentPage || page,
                        totalPages: data.totalPages || 1,
                        totalRecords: data.total || 0,
                        limit: limit,
                        hasNextPage: (data.currentPage || page) < (data.totalPages || 1),
                        hasPrevPage: (data.currentPage || page) > 1
                    });
                }
            } catch (error) {
                console.error("Error fetching device history:", error);
            } finally {
                setLoadingHistory(false);
            }
        }
    };

    const fetchSchedules = async () => {
        if (deviceDetails?.serial_number) {
            setLoadingSchedules(true);
            try {
                const response = await fetch(`${API_BASE}/app/getSchedules?serial_number=${deviceDetails.serial_number}`, {
                    headers: {
                        'Authorization': `Bearer ${userInfo?.token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setSchedules(data.data || []);
                    }
                }
            } catch (error) {
                console.error("Error fetching device schedules:", error);
            } finally {
                setLoadingSchedules(false);
            }
        }
    };

    useEffect(() => {
        fetchHistory(1, pagination.limit);
        fetchSchedules();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deviceDetails, API_BASE, userInfo?.token]);

    const handleBackClick = () => {
        navigate('/manage-devices');
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchHistory(newPage, pagination.limit);
        }
    };

    const handleLimitChange = (newLimit) => {
        fetchHistory(1, newLimit);
    };

    if (!deviceDetails) {
        navigate('/manage-devices');
        return null;
    }

    const formatHistoryDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        
        const pad = (num) => num.toString().padStart(2, '0');
        
        const day = pad(date.getDate());
        const month = pad(date.getMonth() + 1);
        const year = date.getFullYear();
        
        let hours = date.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
        
        return `${day}/${month}/${year}, ${pad(hours)}:${minutes}:${seconds} ${ampm}`;
    };

    const calculateDuration = (startAt, stopAt) => {
        if (!startAt || !stopAt) return '-';
        const start = new Date(startAt);
        const stop = new Date(stopAt);
        if (isNaN(start.getTime()) || isNaN(stop.getTime())) return '-';
        
        const diffMs = Math.max(0, stop.getTime() - start.getTime());
        const diffMins = diffMs / (1000 * 60);
        return `${diffMins.toFixed(1)} minutes`;
    };

    return (
        <div className='' style={{ paddingTop: '15px' }}>
            <Sidebar />
            <main className="main-content position-relative h-100 mt-1 border-radius-lg">
                <Header userInfo={userInfo} handleLogout={handleLogout} />
                <div className="container-fluid py-4">
                    <div className="row">
                        <div className="col-12">
                            <div className="card mb-4">
                                <div className="card-header pb-2">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h6 style={{ margin: 0 }}>Device Details</h6>
                                        <button 
                                            className="btn btn-secondary mb-0" 
                                            style={{ padding: '8px 15px' }}
                                            onClick={handleBackClick}
                                        >
                                            <i className="fas fa-arrow-left"></i> Back
                                        </button>
                                    </div>
                                </div>

                                <div style={{ padding: '20px' }}>
                                    {/* Device Information Section */}
                                    <div style={{ marginBottom: '30px' }}>
                                        <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#8f9297', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '15px' }}>Device Information</h6>
                                        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
                                            <div className="row">
                                                <div className="col-md-4" style={{ marginBottom: '15px' }}>
                                                    <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>Serial Number</div>
                                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{deviceDetails.serial_number || '-'}</div>
                                                </div>
                                                <div className="col-md-4" style={{ marginBottom: '15px' }}>
                                                    <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>IMEI Number</div>
                                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{deviceDetails.imei_number || '-'}</div>
                                                </div>
                                                <div className="col-md-4" style={{ marginBottom: '15px' }}>
                                                    <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>Device Nickname</div>
                                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{deviceDetails.device_nickname || '-'}</div>
                                                </div>
                                                <div className="col-md-4" style={{ marginBottom: '15px' }}>
                                                    <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>Status</div>
                                                    <span className={`badge badge-sm ${deviceDetails.status ? 'bg-gradient-success' : 'bg-gradient-secondary'}`} style={{ padding: '6px 12px' }}>
                                                        {deviceDetails.status ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Assigned User Details */}
                                            {deviceDetails.user_details && (
                                                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e9ecef' }}>
                                                    <h6 style={{ fontSize: '11px', fontWeight: '600', color: '#8f9297', textTransform: 'uppercase', marginBottom: '15px' }}>Assigned User Details</h6>
                                                    <div className="row">
                                                        <div className="col-md-4" style={{ marginBottom: '15px' }}>
                                                            <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>User Name</div>
                                                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{deviceDetails.user_details.user_name || '-'}</div>
                                                        </div>
                                                        <div className="col-md-4" style={{ marginBottom: '15px' }}>
                                                            <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>User Email</div>
                                                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{deviceDetails.user_details.user_email || '-'}</div>
                                                        </div>
                                                        <div className="col-md-4" style={{ marginBottom: '15px' }}>
                                                            <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>User Phone</div>
                                                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{deviceDetails.user_details.user_phone || '-'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Device Schedules Section */}
                                    <div style={{ marginBottom: '30px' }}>
                                        <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#8f9297', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '15px' }}>Device Schedules</h6>
                                        <div className="table-responsive p-0" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e9ecef', borderRadius: '12px' }}>
                                            {loadingSchedules ? (
                                                <div className="text-center py-4">
                                                    <div className="spinner-border text-primary" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                </div>
                                            ) : schedules.length > 0 ? (
                                                <table className="table align-items-center mb-0">
                                                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 10 }}>
                                                        <tr>
                                                            <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 py-3">S.No</th>
                                                            <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Status</th>
                                                            <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Created At</th>
                                                            <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">User</th>
                                                            <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Start Time</th>
                                                            <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Stop Time</th>
                                                            <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Cancelled By</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {schedules.map((schedule, index) => (
                                                            <tr key={index}>
                                                                <td className="text-center">
                                                                    <p className="text-xs font-weight-bold mb-0">{index + 1}</p>
                                                                </td>
                                                                <td>
                                                                    <span className={`badge badge-sm ${
                                                                        schedule.status === 'completed' ? 'bg-gradient-success' : 
                                                                        schedule.status === 'pending' ? 'bg-gradient-warning' : 
                                                                        schedule.status === 'started' ? 'bg-gradient-info' : 
                                                                        schedule.status === 'cancelled' ? 'bg-gradient-danger' : 
                                                                        'bg-gradient-secondary'
                                                                    }`} style={{ padding: '6px 12px', textTransform: 'uppercase' }}>
                                                                        {schedule.status || 'pending'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <p className="text-xs font-weight-bold mb-0">{schedule.created_at ? formatDateToIST(schedule.created_at) : '-'}</p>
                                                                </td>
                                                                <td>
                                                                    <p className="text-xs font-weight-bold mb-0">{schedule.user_name || '-'}</p>
                                                                </td>
                                                                <td>
                                                                    <p className="text-xs font-weight-bold mb-0">{schedule.start_time ? formatDateToIST(schedule.start_time) : '-'}</p>
                                                                </td>
                                                                <td>
                                                                    <p className="text-xs font-weight-bold mb-0">{schedule.stop_time ? formatDateToIST(schedule.stop_time) : '-'}</p>
                                                                </td>
                                                                <td>
                                                                    <p className="text-xs font-weight-bold mb-0">{schedule.cancelled_by || '-'}</p>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p className="text-sm mb-0">No schedules found for this device.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Device History Section */}
                                    <div style={{ marginBottom: '30px' }}>
                                        <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#8f9297', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '15px' }}>Device History</h6>
                                        <div style={{ border: '1px solid #e9ecef', borderRadius: '12px', overflow: 'hidden' }}>
                                            <div className="table-responsive p-0" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                                {loadingHistory ? (
                                                    <TableSkeleton rows={8} columns={9} />
                                                ) : history.length > 0 ? (
                                                    <table className="table align-items-center mb-0">
                                                        <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 10 }}>
                                                            <tr>
                                                                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 py-3" style={{ borderBottom: '1px solid #e9ecef' }}>S.No</th>
                                                                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2" style={{ borderBottom: '1px solid #e9ecef' }}>Started At</th>
                                                                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2" style={{ borderBottom: '1px solid #e9ecef' }}>Started By</th>
                                                                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2" style={{ borderBottom: '1px solid #e9ecef' }}>Stopped At</th>
                                                                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2" style={{ borderBottom: '1px solid #e9ecef' }}>Stopped By</th>
                                                                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2" style={{ borderBottom: '1px solid #e9ecef' }}>Duration (min)</th>
                                                                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2" style={{ borderBottom: '1px solid #e9ecef' }}>Energy (kWh)</th>
                                                                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2" style={{ borderBottom: '1px solid #e9ecef' }}>Max Current</th>
                                                                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2" style={{ borderBottom: '1px solid #e9ecef' }}>Min Current</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {history.map((record, index) => (
                                                                <tr key={index}>
                                                                    <td className="text-center">
                                                                        <p className="text-xs font-weight-bold mb-0">
                                                                            {((pagination.currentPage - 1) * pagination.limit) + index + 1}
                                                                        </p>
                                                                    </td>
                                                                    <td>
                                                                        <p className="text-xs font-weight-bold mb-0">{formatHistoryDate(record.startAt)}</p>
                                                                    </td>
                                                                    <td>
                                                                        <p className="text-xs font-weight-bold mb-0">{record.started_by || '-'}</p>
                                                                    </td>
                                                                    <td>
                                                                        <p className="text-xs font-weight-bold mb-0">{formatHistoryDate(record.stopAt)}</p>
                                                                    </td>
                                                                    <td>
                                                                        <p className="text-xs font-weight-bold mb-0">{record.stopped_by || '-'}</p>
                                                                    </td>
                                                                    <td>
                                                                        <p className="text-xs font-weight-bold mb-0">{calculateDuration(record.startAt, record.stopAt)}</p>
                                                                    </td>
                                                                    <td>
                                                                        <p className="text-xs font-weight-bold mb-0">{record.energy_kwh != null ? record.energy_kwh.toFixed(3) : '-'}</p>
                                                                    </td>
                                                                    <td>
                                                                        <p className="text-xs font-weight-bold mb-0">{record.maxCurrent != null ? record.maxCurrent.toFixed(3) : '-'}</p>
                                                                    </td>
                                                                    <td>
                                                                        <p className="text-xs font-weight-bold mb-0">{record.minCurrent != null ? record.minCurrent.toFixed(3) : '-'}</p>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <div className="text-center py-4">
                                                        <p className="text-sm mb-0">No history records found for this device.</p>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Pagination Controls */}
                                            {history.length > 0 && pagination && (
                                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 px-3 pb-3">
                                                    {/* Results info */}
                                                    <div className="mb-2 mb-md-0">
                                                        <span className="text-sm text-muted">
                                                            Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)} of {pagination.totalRecords} records
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
                                                                onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                                                            >
                                                                <option value={5}>5</option>
                                                                <option value={10}>10</option>
                                                                <option value={25}>25</option>
                                                                <option value={50}>50</option>
                                                            </select>
                                                            <span className="text-sm">per page</span>
                                                        </div>

                                                        {/* Page navigation */}
                                                        <nav aria-label="Device history pagination">
                                                            <ul className="pagination pagination-sm mb-0">
                                                                {/* Previous button */}
                                                                <li className={`page-item ${!pagination.hasPrevPage ? 'disabled' : ''}`}>
                                                                    <button
                                                                        className="page-link"
                                                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
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
                                                                                onClick={() => handlePageChange(pageNum)}
                                                                                style={pageNum === pagination.currentPage ? { backgroundColor: '#2dce89', borderColor: '#2dce89', color: '#fff' } : {}}
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
                                                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
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
                                        </div>
                                    </div>
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

export default ManageDevicesView;