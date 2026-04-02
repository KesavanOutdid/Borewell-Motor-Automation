import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../../components/Admin/Header';
import Sidebar from '../../../components/Admin/Sidebar';
import Footer from '../../../components/Admin/Footer';
import useManageHelp from '../../../hooks/Admin/ManageHelp/useManageHelp';

const ViewHelp = ({ userInfo, handleLogout }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const helpData = location.state?.help;

    const { fetchHelpById, updateHelpStatus, loadingUpdate, errorMessageUpdate, setErrorMessageUpdate } = useManageHelp(userInfo);

    const [helpDetails, setHelpDetails] = useState(helpData || null);
    const [selectedStatus, setSelectedStatus] = useState(helpData?.status || 'pending');
    const [adminRemarks, setAdminRemarks] = useState(helpData?.admin_remarks || '');
    const [loadingDetails, setLoadingDetails] = useState(false);

    const loadHelpDetails = useCallback(async (id) => {
        if (!id) return;
        setLoadingDetails(true);
        const data = await fetchHelpById(id);
        if (data) {
            setHelpDetails(data);
            setSelectedStatus(data.status);
            setAdminRemarks(data.admin_remarks || '');
        }
        setLoadingDetails(false);
    }, [fetchHelpById]);

    useEffect(() => {
        if (!helpData && location.state?.helpId) {
            loadHelpDetails(location.state.helpId);
        }
    }, [helpData, location.state, loadHelpDetails]);

    const handleUpdateStatus = async () => {
        if (!helpDetails?._id) return;

        const success = await updateHelpStatus(helpDetails._id, selectedStatus, adminRemarks);
        if (success) {
            // Re-fetch from API to get fresh data
            await loadHelpDetails(helpDetails._id);
        }
    };

    const formatDateTime = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getStatusBadgeStyle = (status) => {
        const styles = {
            pending: { backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffc107', icon: 'fas fa-clock' },
            solved: { backgroundColor: '#d4edda', color: '#155724', border: '1px solid #28a745', icon: 'fas fa-check-circle' },
            rejected: { backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #dc3545', icon: 'fas fa-times-circle' },
            're-solved': { backgroundColor: '#cce5ff', color: '#004085', border: '1px solid #007bff', icon: 'fas fa-redo' },
        };
        return styles[status] || { backgroundColor: '#e2e3e5', color: '#383d41', border: '1px solid #6c757d', icon: 'fas fa-question-circle' };
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

    if (!helpDetails) {
        return (
            <div style={{ paddingTop: '15px' }}>
                <Sidebar />
                <main className="main-content position-relative h-100 mt-1 border-radius-lg">
                    <Header userInfo={userInfo} handleLogout={handleLogout} />
                    <div className="container-fluid py-4">
                        <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                            <i className="fas fa-question-circle" style={{ fontSize: '48px', marginBottom: '15px', display: 'block' }}></i>
                            <p style={{ fontSize: '16px', marginBottom: '20px' }}>Help request not found</p>
                            <button className="btn btn-outline-secondary" onClick={() => navigate('/manage-help')}>
                                <i className="fas fa-arrow-left me-2"></i> Back
                            </button>
                        </div>
                    </div>
                    <Footer />
                </main>
            </div>
        );
    }

    const statusBadge = getStatusBadgeStyle(helpDetails.status);

    const isModified = selectedStatus !== helpDetails.status || 
                       (adminRemarks || '').trim() !== (helpDetails.admin_remarks || '').trim();
    
    const hasRequiredFields = selectedStatus && (adminRemarks || '').trim().length > 0;
    const canUpdate = isModified && hasRequiredFields;

    return (
        <div style={{ paddingTop: '15px' }}>
            <Sidebar />
            <main className="main-content position-relative h-100 mt-1 border-radius-lg">
                <Header userInfo={userInfo} handleLogout={handleLogout} />
                <div className="container-fluid py-4">
                    <div className="row">
                        <div className="col-12">
                            {/* Back Button */}
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => navigate('/manage-help')}
                                    style={{ borderRadius: '6px', padding: '8px 18px' }}
                                >
                                    <i className="fas fa-arrow-left me-2"></i> Back
                                </button>
                            </div>

                            {/* Help Request Details Card */}
                            <div className="card mb-4">
                                <div className="card-header pb-2">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h6 className="mb-0">Help Request Details</h6>
                                        <span style={{
                                            backgroundColor: statusBadge.backgroundColor,
                                            color: statusBadge.color,
                                            border: statusBadge.border,
                                            padding: '6px 16px',
                                            borderRadius: '20px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <i className={statusBadge.icon} style={{ fontSize: '12px' }}></i>
                                            {getStatusLabel(helpDetails.status)}
                                        </span>
                                    </div>
                                </div>
                                <div className="card-body">
                                    {loadingDetails ? (
                                        <div style={{ textAlign: 'center', padding: '40px' }}>
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
                                            {/* Row 1: 3 columns */}
                                            <div className="row">
                                                <div className="col-md-4" style={{ marginBottom: '20px' }}>
                                                    <div style={{ fontSize: '12px', color: '#8f9297', fontWeight: '600', marginBottom: '5px' }}>User Name</div>
                                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{helpDetails.user_name || '-'}</div>
                                                </div>
                                                <div className="col-md-4" style={{ marginBottom: '20px' }}>
                                                    <div style={{ fontSize: '12px', color: '#8f9297', fontWeight: '600', marginBottom: '5px' }}>Mobile Number</div>
                                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{helpDetails.user_mobile || '-'}</div>
                                                </div>
                                                <div className="col-md-4" style={{ marginBottom: '20px' }}>
                                                    <div style={{ fontSize: '12px', color: '#8f9297', fontWeight: '600', marginBottom: '5px' }}>Status</div>
                                                    <span style={{
                                                        backgroundColor: statusBadge.backgroundColor,
                                                        color: statusBadge.color,
                                                        border: statusBadge.border,
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '5px'
                                                    }}>
                                                        <i className={statusBadge.icon} style={{ fontSize: '11px' }}></i>
                                                        {getStatusLabel(helpDetails.status)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Row 1.5: 3 columns (Device Info) */}
                                            <div className="row">
                                                <div className="col-md-4" style={{ marginBottom: '20px' }}>
                                                    <div style={{ fontSize: '12px', color: '#8f9297', fontWeight: '600', marginBottom: '5px' }}>Serial Number</div>
                                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{helpDetails.serial_number || '-'}</div>
                                                </div>
                                                <div className="col-md-4" style={{ marginBottom: '20px' }}>
                                                    <div style={{ fontSize: '12px', color: '#8f9297', fontWeight: '600', marginBottom: '5px' }}>Device Nickname</div>
                                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{helpDetails.device_nickname || '-'}</div>
                                                </div>
                                            </div>

                                            {/* Row 2: 3 columns */}
                                            <div className="row">
                                                <div className="col-md-4" style={{ marginBottom: '20px' }}>
                                                    <div style={{ fontSize: '12px', color: '#8f9297', fontWeight: '600', marginBottom: '5px' }}>Subject</div>
                                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{helpDetails.subject || '-'}</div>
                                                </div>
                                                <div className="col-md-4" style={{ marginBottom: '20px' }}>
                                                    <div style={{ fontSize: '12px', color: '#8f9297', fontWeight: '600', marginBottom: '5px' }}>Created At</div>
                                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{formatDateTime(helpDetails.createdAt)}</div>
                                                </div>
                                                <div className="col-md-4" style={{ marginBottom: '20px' }}>
                                                    <div style={{ fontSize: '12px', color: '#8f9297', fontWeight: '600', marginBottom: '5px' }}>Last Updated</div>
                                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>
                                                        {helpDetails.updatedAt ? formatDateTime(helpDetails.updatedAt) : 'Not updated yet'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Row 3: Description full width */}
                                            <div className="row">
                                                <div className="col-12">
                                                    <div style={{ fontSize: '12px', color: '#8f9297', fontWeight: '600', marginBottom: '5px' }}>Description</div>
                                                    <div style={{
                                                        backgroundColor: '#fff',
                                                        padding: '15px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #e9ecef',
                                                        fontSize: '14px',
                                                        color: '#344767',
                                                        lineHeight: '1.6',
                                                        whiteSpace: 'pre-wrap',
                                                        minHeight: '50px'
                                                    }}>
                                                        {helpDetails.description || '-'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Row 4: Admin Remarks (if any) */}
                                            {helpDetails.admin_remarks && (
                                                <div className="row" style={{ marginTop: '15px' }}>
                                                    <div className="col-12">
                                                        <div style={{ fontSize: '12px', color: '#8f9297', fontWeight: '600', marginBottom: '5px' }}>Admin Remarks</div>
                                                        <div style={{
                                                            backgroundColor: '#fff',
                                                            padding: '15px',
                                                            borderRadius: '8px',
                                                            border: '1px solid #e9ecef',
                                                            fontSize: '14px',
                                                            color: '#344767',
                                                            lineHeight: '1.6',
                                                            whiteSpace: 'pre-wrap'
                                                        }}>
                                                            {helpDetails.admin_remarks}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Row 5: Updated By (if any) */}
                                            {helpDetails.updatedBy && (
                                                <div className="row" style={{ marginTop: '15px' }}>
                                                    <div className="col-md-4">
                                                        <div style={{ fontSize: '12px', color: '#8f9297', fontWeight: '600', marginBottom: '5px' }}>Updated By</div>
                                                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{helpDetails.updatedBy}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Update Status Card */}
                            <div className="card mb-4">
                                <div className="card-header pb-2">
                                    <h6 className="mb-0">Update Help Status</h6>
                                </div>
                                <div className="card-body">
                                    {errorMessageUpdate && (
                                        <div className="alert alert-danger py-2" role="alert">
                                            {errorMessageUpdate}
                                        </div>
                                    )}
                                    <div className="row">
                                        <div className="col-md-4">
                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Status</label>
                                                <select
                                                    className="form-select"
                                                    value={selectedStatus}
                                                    onChange={(e) => {
                                                        setSelectedStatus(e.target.value);
                                                        setErrorMessageUpdate('');
                                                    }}
                                                    style={{ borderRadius: '6px', padding: '10px' }}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="solved">Solved</option>
                                                    <option value="rejected">Rejected</option>
                                                    <option value="re-solved">Re-Solved</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-md-8">
                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Admin Remarks</label>
                                                <textarea
                                                    className="form-control"
                                                    rows="3"
                                                    value={adminRemarks}
                                                    onChange={(e) => {
                                                        setAdminRemarks(e.target.value);
                                                        setErrorMessageUpdate('');
                                                    }}
                                                    placeholder="Enter admin remarks..."
                                                    style={{ borderRadius: '6px', resize: 'vertical' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-end">
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleUpdateStatus}
                                            disabled={loadingUpdate || !canUpdate}
                                            style={{ padding: '10px 30px' }}
                                        >
                                            {loadingUpdate ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-save me-2"></i> Update Status
                                                </>
                                            )}
                                        </button>
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

export default ViewHelp;
