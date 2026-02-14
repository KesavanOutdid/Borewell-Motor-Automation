import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Admin/Header';
import Sidebar from '../../components/Admin/Sidebar';
import Footer from '../../components/Admin/Footer';
import TableSkeleton from '../../components/Common/TableSkeleton';

const DeviceHistory = ({ userInfo, handleLogout }) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;
    const navigate = useNavigate();
    const location = useLocation();
    const { device, user_id, deviceDetails } = location.state || {};
    
    const [deviceHistoryData, setDeviceHistoryData] = useState([]);
    const [loadingDeviceHistory, setLoadingDeviceHistory] = useState(false);

    useEffect(() => {
        if (!device || !user_id) {
            navigate(-1);
            return;
        }

        fetchDeviceHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [device, user_id]);

    const fetchDeviceHistory = async () => {
        try {
            setLoadingDeviceHistory(true);

            const response = await fetch(`${API_BASE}/app/userDeviceHistory`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id }),
            });

            if (response.ok) {
                const data = await response.json();
                const deviceHistoryRecords = data.data.find(
                    item => item.serial_number === device.serial_number
                );
                setDeviceHistoryData(deviceHistoryRecords?.records || []);
            } else {
                alert('Failed to fetch device history');
            }
        } catch (error) {
            console.error('Error fetching device history:', error);
            alert('Error fetching device history');
        } finally {
            setLoadingDeviceHistory(false);
        }
    };

    const handleBackClick = () => {
        navigate(-1);
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
                                        <h6 style={{ margin: 0 }}>Device History - {device?.serial_number}</h6>
                                        <button 
                                            className="btn btn-secondary mb-0" 
                                            style={{ padding: '8px 15px' }}
                                            onClick={handleBackClick}
                                        >
                                            <i className="fas fa-arrow-left"></i> Back
                                        </button>
                                    </div>
                                </div>

                                <div className="card-body px-0 pt-0 pb-2">
                                    <div className="table-responsive p-0" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                                        <table className="table align-items-center mb-0">
                                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 10 }}>
                                                <tr>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>S.No</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Started At</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Started By</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Stopped At</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Stopped By</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Duration (min)</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Energy (kWh)</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Max Current</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Min Current</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loadingDeviceHistory ? (
                                                    <TableSkeleton rows={8} columns={9} />
                                                ) : deviceHistoryData.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
                                                            <p>No history data available</p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    deviceHistoryData.slice(0, 20).map((record, index) => (
                                                        <tr key={index}>
                                                            <td className="text-center">
                                                                <p className="text-xs font-weight-bold mb-0">{index + 1}</p>
                                                            </td>
                                                            <td className="text-center">
                                                                <p className="text-xs font-weight-bold mb-0">
                                                                    {record.startAt ? new Date(record.startAt).toLocaleString() : '-'}
                                                                </p>
                                                            </td>
                                                            <td className="text-center">
                                                                <p className="text-xs font-weight-bold mb-0">{record.started_by || '-'}</p>
                                                            </td>
                                                            <td className="text-center">
                                                                <p className="text-xs font-weight-bold mb-0">
                                                                    {record.stopAt ? new Date(record.stopAt).toLocaleString() : '-'}
                                                                </p>
                                                            </td>
                                                            <td className="text-center">
                                                                <p className="text-xs font-weight-bold mb-0">{record.stopped_by || '-'}</p>
                                                            </td>
                                                            <td className="text-center">
                                                                <p className="text-xs font-weight-bold mb-0">{record.duration_minutes || '-'}</p>
                                                            </td>
                                                            <td className="text-center">
                                                                <p className="text-xs font-weight-bold mb-0">{record.energy_kwh ? record.energy_kwh.toFixed(3) : '-'}</p>
                                                            </td>
                                                            <td className="text-center">
                                                                <p className="text-xs font-weight-bold mb-0">{record.maxCurrent ? record.maxCurrent.toFixed(3) : '-'}</p>
                                                            </td>
                                                            <td className="text-center">
                                                                <p className="text-xs font-weight-bold mb-0">{record.minCurrent ? record.minCurrent.toFixed(3) : '-'}</p>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Device Details Section */}
                    {deviceDetails && (
                        <div className="row mt-4">
                            <div className="col-12">
                                <div className="card mb-4">
                                    <div className="card-header pb-2">
                                        <h6>Device Details</h6>
                                    </div>
                                    <div className="card-body p-4">
                                        {/* Device Information */}
                                        <div style={{ marginBottom: '20px' }}>
                                            <h6 style={{ fontSize: '12px', fontWeight: '600', color: '#8f9297', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Device Information</h6>
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
                                            <h6 style={{ fontSize: '12px', fontWeight: '600', color: '#8f9297', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Device Status</h6>
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
                                        <div style={{ marginBottom: '10px' }}>
                                            <h6 style={{ fontSize: '12px', fontWeight: '600', color: '#8f9297', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Timestamps</h6>
                                            <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                                <div className="row">
                                                    <div className="col-md-3 col-6" style={{ marginBottom: '12px' }}>
                                                        <div style={{ fontSize: '11px', color: '#8f9297', marginBottom: '4px' }}>Started At</div>
                                                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#344767' }}>{deviceDetails.startAt ? new Date(deviceDetails.startAt).toLocaleString() : '-'}</div>
                                                    </div>
                                                    <div className="col-md-3 col-6" style={{ marginBottom: '12px' }}>
                                                        <div style={{ fontSize: '11px', color: '#8f9297', marginBottom: '4px' }}>Started By</div>
                                                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#344767' }}>{deviceDetails.last_started_by || '-'}</div>
                                                    </div>
                                                    <div className="col-md-3 col-6" style={{ marginBottom: '12px' }}>
                                                        <div style={{ fontSize: '11px', color: '#8f9297', marginBottom: '4px' }}>Stopped At</div>
                                                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#344767' }}>{deviceDetails.stopAt ? new Date(deviceDetails.stopAt).toLocaleString() : '-'}</div>
                                                    </div>
                                                    <div className="col-md-3 col-6" style={{ marginBottom: '12px' }}>
                                                        <div style={{ fontSize: '11px', color: '#8f9297', marginBottom: '4px' }}>Stopped By</div>
                                                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#344767' }}>{deviceDetails.last_stopped_by || '-'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <Footer />
            </main>
        </div>
    );
};

export default DeviceHistory;
