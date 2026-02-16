import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Admin/Header';
import Sidebar from '../../components/Admin/Sidebar';
import Footer from '../../components/Admin/Footer';
import { formatDateToIST } from '../../utils/formatDateToIST';

const ManageDevicesView = ({ userInfo, handleLogout }) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;
    const navigate = useNavigate();
    const location = useLocation();
    const deviceDetails = location.state?.device;

    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            if (deviceDetails?.serial_number) {
                setLoadingHistory(true);
                try {
                    const response = await fetch(`${API_BASE}/getDeviceSmartHistory?serial_number=${deviceDetails.serial_number}`);
                    if (response.ok) {
                        const data = await response.json();
                        setHistory(data.data || []);
                    }
                } catch (error) {
                    console.error("Error fetching device history:", error);
                } finally {
                    setLoadingHistory(false);
                }
            }
        };

        fetchHistory();
    }, [deviceDetails, API_BASE]);

    const handleBackClick = () => {
        navigate('/manage-devices');
    };

    if (!deviceDetails) {
        navigate('/manage-devices');
        return null;
    }

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
                                    <div style={{ marginBottom: '30px' }}>
                                        <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#8f9297', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '15px' }}>Device Information</h6>
                                        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
                                            <div className="row">
                                                <div className="col-md-6" style={{ marginBottom: '15px' }}>
                                                    <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>Serial Number</div>
                                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{deviceDetails.serial_number || '-'}</div>
                                                </div>
                                                <div className="col-md-6" style={{ marginBottom: '15px' }}>
                                                    <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>Device Nickname</div>
                                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{deviceDetails.device_nickname || '-'}</div>
                                                </div>
                                                <div className="col-md-6" style={{ marginBottom: '15px' }}>
                                                    <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>Status</div>
                                                    <span className={`badge badge-sm ${deviceDetails.status ? 'bg-gradient-success' : 'bg-gradient-secondary'}`} style={{ padding: '6px 12px' }}>
                                                        {deviceDetails.status ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '30px' }}>
                                        <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#8f9297', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '15px' }}>System Information</h6>
                                        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
                                            <div className="row">
                                                <div className="col-md-6" style={{ marginBottom: '15px' }}>
                                                    <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>Created By</div>
                                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{deviceDetails.createdBy || '-'}</div>
                                                </div>
                                                <div className="col-md-6" style={{ marginBottom: '15px' }}>
                                                    <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>Created At</div>
                                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{formatDateToIST(deviceDetails.createdAt) || '-'}</div>
                                                </div>
                                                <div className="col-md-6" style={{ marginBottom: '15px' }}>
                                                    <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>Updated By</div>
                                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{deviceDetails.updatedBy || '-'}</div>
                                                </div>
                                                <div className="col-md-6" style={{ marginBottom: '15px' }}>
                                                    <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>Updated At</div>
                                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{formatDateToIST(deviceDetails.updatedAt) || '-'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {deviceDetails.assign_status && (
                                        <>
                                            <div style={{ marginBottom: '30px' }}>
                                                <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#8f9297', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '15px' }}>Assignment Information</h6>
                                                <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
                                                    <div className="row">
                                                        <div className="col-md-6" style={{ marginBottom: '15px' }}>
                                                            <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>Assigned By</div>
                                                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{deviceDetails.assignedBy || '-'}</div>
                                                        </div>
                                                        <div className="col-md-6" style={{ marginBottom: '15px' }}>
                                                            <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>Assigned At</div>
                                                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{formatDateToIST(deviceDetails.assignedAt) || '-'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: '30px' }}>
                                                <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#8f9297', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '15px' }}>User Information</h6>
                                                <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
                                                    <div className="row">
                                                        <div className="col-md-4" style={{ marginBottom: '15px' }}>
                                                            <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>User Name</div>
                                                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{deviceDetails.user_details?.user_name || '-'}</div>
                                                        </div>
                                                        <div className="col-md-4" style={{ marginBottom: '15px' }}>
                                                            <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>Phone</div>
                                                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{deviceDetails.user_details?.user_phone || '-'}</div>
                                                        </div>
                                                        <div className="col-md-4" style={{ marginBottom: '15px' }}>
                                                            <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>Email</div>
                                                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{deviceDetails.user_details?.user_email || '-'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {deviceDetails.shared_users && deviceDetails.shared_users.length > 0 && (
                                        <div style={{ marginBottom: '30px' }}>
                                            <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#8f9297', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '15px' }}>Shared Users ({deviceDetails.shared_users.length})</h6>
                                            <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
                                                {deviceDetails.shared_users.map((sharedUser, index) => (
                                                    <div key={sharedUser._id || index} style={{ 
                                                        padding: '20px', 
                                                        marginBottom: index < deviceDetails.shared_users.length - 1 ? '15px' : '0',
                                                        backgroundColor: '#fff', 
                                                        borderRadius: '8px',
                                                        border: '1px solid #e0e0e0'
                                                    }}>
                                                        <div className="row" style={{ marginBottom: '15px' }}>
                                                            <div className="col-md-4" style={{ marginBottom: '15px' }}>
                                                                <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>Shared To</div>
                                                                <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{sharedUser.shared_to_user_name || '-'}</div>
                                                            </div>
                                                            <div className="col-md-4" style={{ marginBottom: '15px' }}>
                                                                <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>Phone</div>
                                                                <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{sharedUser.shared_to_user_phone || '-'}</div>
                                                            </div>
                                                            <div className="col-md-4" style={{ marginBottom: '15px' }}>
                                                                <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>Email</div>
                                                                <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{sharedUser.shared_to_user_email || '-'}</div>
                                                            </div>
                                                        </div>
                                                        <div className="row">
                                                            <div className="col-md-4" style={{ marginBottom: '15px' }}>
                                                                <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>Status</div>
                                                                <span className={`badge badge-sm ${
                                                                    sharedUser.acceptance_status === 'accepted' ? 'bg-gradient-success' : 
                                                                    sharedUser.acceptance_status === 'rejected' ? 'bg-gradient-danger' : 
                                                                    'bg-gradient-warning'
                                                                }`} style={{ padding: '6px 12px', textTransform: 'capitalize' }}>
                                                                    {sharedUser.acceptance_status || 'pending'}
                                                                </span>
                                                            </div>
                                                            <div className="col-md-4" style={{ marginBottom: '15px' }}>
                                                                <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>Master User</div>
                                                                <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{sharedUser.master_user_name || '-'}</div>
                                                            </div>
                                                            <div className="col-md-4" style={{ marginBottom: '15px' }}>
                                                                <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>Assigned At</div>
                                                                <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{formatDateToIST(sharedUser.assignedAt) || '-'}</div>
                                                            </div>
                                                        </div>
                                                        <div className="row">
                                                            <div className="col-md-4">
                                                                <div style={{ fontSize: '12px', color: '#8f9297', marginBottom: '5px' }}>Master User Email</div>
                                                                <div style={{ fontSize: '14px', fontWeight: '500', color: '#344767' }}>{sharedUser.master_user_email || '-'}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ marginBottom: '30px' }}>
                                        <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#8f9297', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '15px' }}>Device History</h6>
                                        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', overflowX: 'auto' }}>
                                            {loadingHistory ? (
                                                <div className="text-center py-4">
                                                    <div className="spinner-border text-primary" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                </div>
                                            ) : history.length > 0 ? (
                                                <table className="table align-items-center mb-0">
                                                    <thead>
                                                        <tr>
                                                            <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Date</th>
                                                            <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Start Time</th>
                                                            <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Stop Time</th>
                                                            <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Duration (Min)</th>
                                                            <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Energy (kWh)</th>
                                                            <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Started By</th>
                                                            <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Stopped By</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {history.map((record, index) => (
                                                            <tr key={index}>
                                                                <td>
                                                                    <div className="d-flex px-2 py-1">
                                                                        <div className="d-flex flex-column justify-content-center">
                                                                            <h6 className="mb-0 text-sm">{record.date || '-'}</h6>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <p className="text-xs font-weight-bold mb-0">{record.startAt ? formatDateToIST(record.startAt) : '-'}</p>
                                                                </td>
                                                                <td>
                                                                    <p className="text-xs font-weight-bold mb-0">{record.stopAt ? formatDateToIST(record.stopAt) : '-'}</p>
                                                                </td>
                                                                <td>
                                                                    <p className="text-xs font-weight-bold mb-0">{record.duration_minutes || '-'}</p>
                                                                </td>
                                                                <td>
                                                                    <p className="text-xs font-weight-bold mb-0">{record.energy_kwh || '-'}</p>
                                                                </td>
                                                                <td>
                                                                    <p className="text-xs font-weight-bold mb-0">{record.started_by || '-'}</p>
                                                                </td>
                                                                <td>
                                                                    <p className="text-xs font-weight-bold mb-0">{record.stopped_by || '-'}</p>
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
