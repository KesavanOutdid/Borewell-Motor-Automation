import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Admin/Header';
import Sidebar from '../../components/Admin/Sidebar';
import Footer from '../../components/Admin/Footer';
import { formatDateToIST } from '../../utils/formatDateToIST';

const DeviceDetails = ({ userInfo, handleLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const deviceDetails = location.state?.deviceDetails;

    const handleBackClick = () => {
        navigate(-1);
    };

    if (!deviceDetails) {
        navigate(-1);
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
                                    {/* Device Information */}
                                    <div style={{ marginBottom: '20px' }}>
                                        <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#8f9297', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Device Information</h6>
                                        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                            <div className="row">
                                                <div className="col-md-3 col-6" style={{ marginBottom: '12px' }}>
                                                    <div style={{ fontSize: '11px', color: '#8f9297', marginBottom: '4px' }}>Serial Number</div>
                                                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#344767' }}>{deviceDetails.serial_number || '-'}</div>
                                                </div>
                                                <div className="col-md-3 col-6" style={{ marginBottom: '12px' }}>
                                                    <div style={{ fontSize: '11px', color: '#8f9297', marginBottom: '4px' }}>IMEI Number</div>
                                                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#344767' }}>{deviceDetails.imei_number || '-'}</div>
                                                </div>
                                                <div className="col-md-3 col-6" style={{ marginBottom: '12px' }}>
                                                    <div style={{ fontSize: '11px', color: '#8f9297', marginBottom: '4px' }}>Device Nickname</div>
                                                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#344767' }}>{deviceDetails.device_nickname || '-'}</div>
                                                </div>
                                                <div className="col-md-3 col-6" style={{ marginBottom: '12px' }}>
                                                    <div style={{ fontSize: '11px', color: '#8f9297', marginBottom: '4px' }}>Motor HP</div>
                                                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#344767' }}>{deviceDetails.motor_hp || '-'}</div>
                                                </div>
                                                <div className="col-md-3 col-6" style={{ marginBottom: '12px' }}>
                                                    <div style={{ fontSize: '11px', color: '#8f9297', marginBottom: '4px' }}>Latitude</div>
                                                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#344767' }}>{deviceDetails.latitude || '-'}</div>
                                                </div>
                                                <div className="col-md-3 col-6" style={{ marginBottom: '12px' }}>
                                                    <div style={{ fontSize: '11px', color: '#8f9297', marginBottom: '4px' }}>Longitude</div>
                                                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#344767' }}>{deviceDetails.longitude || '-'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Device Status */}
                                    <div style={{ marginBottom: '20px' }}>
                                        <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#8f9297', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Device Status</h6>
                                        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                            <div className="row">
                                                <div className="col-md-3 col-4" style={{ marginBottom: '12px' }}>
                                                    <div style={{ fontSize: '11px', color: '#8f9297', marginBottom: '4px' }}>Start Status</div>
                                                    <span className={`badge badge-sm ${deviceDetails.start_status ? 'bg-gradient-success' : 'bg-gradient-danger'}`} style={{ padding: '5px 10px' }}>
                                                        {deviceDetails.start_status ? 'Running' : 'Stopped'}
                                                    </span>
                                                </div>
                                                <div className="col-md-3 col-4" style={{ marginBottom: '12px' }}>
                                                    <div style={{ fontSize: '11px', color: '#8f9297', marginBottom: '4px' }}>Config Status</div>
                                                    <span className={`badge badge-sm ${deviceDetails.config_status ? 'bg-gradient-success' : 'bg-gradient-secondary'}`} style={{ padding: '5px 10px' }}>
                                                        {deviceDetails.config_status ? 'Configured' : 'Not Configured'}
                                                    </span>
                                                </div>
                                                <div className="col-md-3 col-4" style={{ marginBottom: '12px' }}>
                                                    <div style={{ fontSize: '11px', color: '#8f9297', marginBottom: '4px' }}>Status</div>
                                                    <span className={`badge badge-sm ${deviceDetails.status ? 'bg-gradient-success' : 'bg-gradient-secondary'}`} style={{ padding: '5px 10px' }}>
                                                        {deviceDetails.status ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timestamps */}
                                    <div style={{ marginBottom: '20px' }}>
                                        <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#8f9297', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Timestamps</h6>
                                        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                            <div className="row">
                                                <div className="col-md-3 col-6" style={{ marginBottom: '12px' }}>
                                                    <div style={{ fontSize: '11px', color: '#8f9297', marginBottom: '4px' }}>Started At</div>
                                                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#344767' }}>{deviceDetails.startedAt ? formatDateToIST(deviceDetails.startedAt) : '-'}</div>
                                                </div>
                                                <div className="col-md-3 col-6" style={{ marginBottom: '12px' }}>
                                                    <div style={{ fontSize: '11px', color: '#8f9297', marginBottom: '4px' }}>Stopped At</div>
                                                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#344767' }}>{deviceDetails.stoppedAt ? formatDateToIST(deviceDetails.stoppedAt) : '-'}</div>
                                                </div>
                                                <div className="col-md-3 col-6" style={{ marginBottom: '12px' }}>
                                                    <div style={{ fontSize: '11px', color: '#8f9297', marginBottom: '4px' }}>Created At</div>
                                                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#344767' }}>{deviceDetails.createdAt ? formatDateToIST(deviceDetails.createdAt) : '-'}</div>
                                                </div>
                                                <div className="col-md-3 col-6" style={{ marginBottom: '12px' }}>
                                                    <div style={{ fontSize: '11px', color: '#8f9297', marginBottom: '4px' }}>Updated At</div>
                                                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#344767' }}>{deviceDetails.updatedAt ? formatDateToIST(deviceDetails.updatedAt) : '-'}</div>
                                                </div>
                                            </div>
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

export default DeviceDetails;
