import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        if (!helpData && location.state?.helpId) {
            const loadHelp = async () => {
                const data = await fetchHelpById(location.state.helpId);
                if (data) {
                    setHelpDetails(data);
                    setSelectedStatus(data.status);
                    setAdminRemarks(data.admin_remarks || '');
                }
            };
            loadHelp();
        }
    }, [helpData, location.state, fetchHelpById]);

    const handleUpdateStatus = async () => {
        if (!helpDetails?._id) return;

        const success = await updateHelpStatus(helpDetails._id, selectedStatus, adminRemarks);
        if (success) {
            setHelpDetails(prev => ({ ...prev, status: selectedStatus, admin_remarks: adminRemarks }));
        }
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

    if (!helpDetails) {
        return (
            <div style={{ paddingTop: '15px' }}>
                <Sidebar />
                <main className="main-content position-relative h-100 mt-1 border-radius-lg">
                    <Header userInfo={userInfo} handleLogout={handleLogout} />
                    <div className="container-fluid py-4">
                        <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                            <p>Help request not found</p>
                            <button className="btn btn-primary" onClick={() => navigate('/manage-help')}>
                                Back to Manage Help
                            </button>
                        </div>
                    </div>
                    <Footer />
                </main>
            </div>
        );
    }

    return (
        <div style={{ paddingTop: '15px' }}>
            <Sidebar />
            <main className="main-content position-relative h-100 mt-1 border-radius-lg">
                <Header userInfo={userInfo} handleLogout={handleLogout} />
                <div className="container-fluid py-4">
                    <div className="row">
                        <div className="col-12">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => navigate('/manage-help')}
                                >
                                    <i className="fas fa-arrow-left me-2"></i> Back to Manage Help
                                </button>
                            </div>

                            <div className="card mb-4">
                                <div className="card-header pb-2">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h6 className="mb-0">Help Request Details</h6>
                                        <span style={{
                                            backgroundColor: getStatusColor(helpDetails.status),
                                            color: 'white',
                                            padding: '5px 15px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '600'
                                        }}>
                                            {getStatusLabel(helpDetails.status)}
                                        </span>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{ fontSize: '12px', color: '#7a8a99', fontWeight: '600', marginBottom: '4px', display: 'block' }}>User Name</label>
                                                <p style={{ fontSize: '15px', color: '#333', fontWeight: '500', margin: 0 }}>{helpDetails.user_name}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{ fontSize: '12px', color: '#7a8a99', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Mobile Number</label>
                                                <p style={{ fontSize: '15px', color: '#333', fontWeight: '500', margin: 0 }}>{helpDetails.user_mobile}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{ fontSize: '12px', color: '#7a8a99', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Created At</label>
                                                <p style={{ fontSize: '15px', color: '#333', fontWeight: '500', margin: 0 }}>{formatDateTime(helpDetails.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{ fontSize: '12px', color: '#7a8a99', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Last Updated</label>
                                                <p style={{ fontSize: '15px', color: '#333', fontWeight: '500', margin: 0 }}>
                                                    {helpDetails.updatedAt ? formatDateTime(helpDetails.updatedAt) : 'Not updated yet'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{ fontSize: '12px', color: '#7a8a99', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Subject</label>
                                                <p style={{ fontSize: '15px', color: '#333', fontWeight: '500', margin: 0 }}>{helpDetails.subject}</p>
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{ fontSize: '12px', color: '#7a8a99', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Description</label>
                                                <div style={{
                                                    backgroundColor: '#f8f9fa',
                                                    padding: '15px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #e9ecef',
                                                    fontSize: '14px',
                                                    color: '#333',
                                                    lineHeight: '1.6',
                                                    whiteSpace: 'pre-wrap'
                                                }}>
                                                    {helpDetails.description}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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
                                            disabled={loadingUpdate}
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
