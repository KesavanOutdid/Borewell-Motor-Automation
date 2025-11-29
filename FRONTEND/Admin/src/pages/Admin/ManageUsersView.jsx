import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Admin/Header';
import Sidebar from '../../components/Admin/Sidebar';
import Footer from '../../components/Admin/Footer';
import useManageUsersView from '../../hooks/Admin/useManageUsersView';
import { formatDateToIST } from '../../utils/formatDateToIST';

const ManageUsersView = ({ userInfo, handleLogout }) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;
    const navigate = useNavigate();
    const location = useLocation();
    const selectedUser = location.state?.user;

    const {
        assignedDevices,
        loadingDevices,
        errorDevices,
        fetchUserAssignedDevices,
        fetchDeviceDetails,
        isModalDeviceDetails,
        isModalDeviceHistory,
        setIsModalDeviceHistory,
        selectedDeviceDetails,
        selectedDeviceForHistory,
        setSelectedDeviceForHistory,
        pagination,
        closeModal
    } = useManageUsersView();

    const fetchDeviceDataCalled = useRef(false);
    const [deviceHistoryData, setDeviceHistoryData] = useState([]);
    const [loadingDeviceHistory, setLoadingDeviceHistory] = useState(false);

    useEffect(() => {
        if (!selectedUser) {
            navigate('/admin/manage-users');
            return;
        }

        if (!fetchDeviceDataCalled.current) {
            fetchUserAssignedDevices(selectedUser.user_id);
            fetchDeviceDataCalled.current = true;
        }
    }, [selectedUser, navigate, fetchUserAssignedDevices]);

    const handleViewDeviceDetails = (device) => {
        fetchDeviceDetails(device.serial_number, device.imei_number);
    };

    const handleViewDeviceHistory = async (device) => {
        try {
            setSelectedDeviceForHistory(device);
            setLoadingDeviceHistory(true);

            const response = await fetch(`${API_BASE}/app/userDeviceHistory`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: selectedUser.user_id }),
            });

            if (response.ok) {
                const data = await response.json();
                const deviceHistoryRecords = data.data.find(
                    item => item.serial_number === device.serial_number
                );
                setDeviceHistoryData(deviceHistoryRecords?.records || []);
                setIsModalDeviceHistory(true);
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
        navigate('/admin/manage-users');
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
                                        <h6 style={{ margin: 0 }}>User Details</h6>
                                        <button 
                                            className="btn btn-secondary mb-0" 
                                            style={{ padding: '8px 15px' }}
                                            onClick={handleBackClick}
                                        >
                                            <i className="fas fa-arrow-left"></i> Back
                                        </button>
                                    </div>
                                </div>

                                {selectedUser && (
                                    <div style={{ padding: '20px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f8f9fa' }}>
                                        <div className="row" style={{ marginBottom: '15px' }}>
                                            <div className="col-md-3" style={{ marginBottom: '15px' }}>
                                                <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                                                    Role Name:
                                                </div>
                                                <div style={{ fontSize: '14px', color: '#344767', fontWeight: '500', marginTop: '5px' }}>
                                                    {selectedUser.role_name}
                                                </div>
                                            </div>
                                            <div className="col-md-3" style={{ marginBottom: '15px' }}>
                                                <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                                                    User Name
                                                </div>
                                                <div style={{ fontSize: '14px', color: '#344767', fontWeight: '500', marginTop: '5px' }}>
                                                    {selectedUser.user_name}
                                                </div>
                                            </div>
                                            <div className="col-md-3" style={{ marginBottom: '15px' }}>
                                                <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                                                    Phone
                                                </div>
                                                <div style={{ fontSize: '14px', color: '#344767', fontWeight: '500', marginTop: '5px' }}>
                                                    {selectedUser.user_phone}
                                                </div>
                                            </div>
                                            <div className="col-md-3" style={{ marginBottom: '15px' }}>
                                                <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                                                    Email ID
                                                </div>
                                                <div style={{ fontSize: '14px', color: '#344767', fontWeight: '500', marginTop: '5px' }}>
                                                    {selectedUser.user_email || '-'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-3" style={{ marginBottom: '15px' }}>
                                                <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                                                    Password
                                                </div>
                                                <div style={{ fontSize: '14px', color: '#344767', fontWeight: '500', marginTop: '5px' }}>
                                                    {selectedUser.password || '-'}
                                                </div>
                                            </div>
                                            <div className="col-md-3" style={{ marginBottom: '15px' }}>
                                                <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                                                    Created By
                                                </div>
                                                <div style={{ fontSize: '14px', color: '#344767', fontWeight: '500', marginTop: '5px' }}>
                                                    {selectedUser.createdBy || '-'}
                                                </div>
                                            </div>
                                            <div className="col-md-3" style={{ marginBottom: '15px' }}>
                                                <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                                                    Created At
                                                </div>
                                                <div style={{ fontSize: '14px', color: '#344767', fontWeight: '500', marginTop: '5px' }}>
                                                    {formatDateToIST(selectedUser.createdAt || '-')}
                                                </div>
                                            </div>
                                            <div className="col-md-3" style={{ marginBottom: '15px' }}>
                                                <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                                                    Updated By
                                                </div>
                                                <div style={{ fontSize: '14px', color: '#344767', fontWeight: '500', marginTop: '5px' }}>
                                                    {selectedUser.updatedBy || '-'}
                                                </div>
                                            </div>
                                            <div className="col-md-3" style={{ marginBottom: '15px' }}>
                                                <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                                                    Updated At
                                                </div>
                                                <div style={{ fontSize: '14px', color: '#344767', fontWeight: '500', marginTop: '5px' }}>
                                                    {formatDateToIST(selectedUser.updatedAt || '-')}
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
                                                    Status
                                                </div>
                                                <div style={{ marginTop: '5px' }}>
                                                    <span className={`badge badge-sm ${selectedUser.status ? 'bg-gradient-success' : 'bg-gradient-secondary'}`} style={{ width: '70px', textAlign: 'center', padding: '6px 0' }}>
                                                        {selectedUser.status ? 'Active' : 'De-Active'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="card-body px-0 pt-0 pb-2">
                                    <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
                                        <h6 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#344767' }}>Assigned Devices ({pagination.totalDevices})</h6>
                                    </div>
                                    <div className="table-responsive p-0" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                        <table className="table align-items-center mb-0">
                                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa' }}>
                                                <tr>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>S.No</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Serial Number</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>IMEI Number</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Latitude</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Longitude</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Status</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loadingDevices ? (
                                                    <tr>
                                                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                                                            <p>Loading devices...</p>
                                                        </td>
                                                    </tr>
                                                ) : errorDevices ? (
                                                    <tr>
                                                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                                                            <p>{errorDevices}</p>
                                                        </td>
                                                    </tr>
                                                ) : assignedDevices.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                                                            <p>No devices assigned</p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    assignedDevices.map((device, index) => (
                                                        <tr key={`${device.serial_number}-${device.imei_number}`}>
                                                            <td className="text-center">{index + 1}</td>
                                                            <td className="text-center">{device.serial_number || '-'}</td>
                                                            <td className="text-center">{device.imei_number || '-'}</td>
                                                            <td className="text-center">{device.latitude || '-'}</td>
                                                            <td className="text-center">{device.longitude || '-'}</td>
                                                            <td className="text-center">
                                                                <span className={`badge badge-sm ${device.status ? 'bg-gradient-success' : 'bg-gradient-secondary'}`} style={{ width: '70px', textAlign: 'center' }}>
                                                                    {device.status ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </td>
                                                            <td className="text-center">
                                                                <button
                                                                    className="btn btn-sm mb-0"
                                                                    style={{ 
                                                                        marginRight: '5px', 
                                                                        padding: '6px 12px', 
                                                                        fontSize: '11px',
                                                                        backgroundColor: '#66c2ff',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        fontWeight: '500'
                                                                    }}
                                                                    onClick={() => handleViewDeviceDetails(device)}
                                                                    title="View Device Details"
                                                                >
                                                                    <i className="fas fa-eye"></i> Details
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm mb-0"
                                                                    style={{ 
                                                                        padding: '6px 12px', 
                                                                        fontSize: '11px',
                                                                        backgroundColor: '#fdc858',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        fontWeight: '500'
                                                                    }}
                                                                    onClick={() => handleViewDeviceHistory(device)}
                                                                    title="View Device History"
                                                                >
                                                                    <i className="fas fa-history"></i> History
                                                                </button>
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
                </div>

                {isModalDeviceDetails && selectedDeviceDetails && (
                    <div style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1020
                    }}>
                        <div style={{
                            backgroundColor: "#fff",
                            padding: "20px",
                            borderRadius: "10px",
                            width: "600px",
                            maxHeight: "80vh",
                            overflowY: "auto",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                                <div>
                                    <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#344767' }}>Device Details</h5>
                                </div>
                                <button
                                    onClick={closeModal}
                                    style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}
                                >
                                    &times;
                                </button>
                            </div>
                            <hr />
                            <div style={{ padding: "15px 0" }}>
                                <div className="row" style={{ marginBottom: '15px' }}>
                                    <div className="col-md-6" style={{ marginBottom: '15px' }}>
                                        <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Serial Number</div>
                                        <div style={{ fontSize: '14px', color: '#344767', fontWeight: '500', marginTop: '5px' }}>{selectedDeviceDetails.serial_number || '-'}</div>
                                    </div>
                                    <div className="col-md-6" style={{ marginBottom: '15px' }}>
                                        <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>IMEI Number</div>
                                        <div style={{ fontSize: '14px', color: '#344767', fontWeight: '500', marginTop: '5px' }}>{selectedDeviceDetails.imei_number || '-'}</div>
                                    </div>
                                </div>
                                <div className="row" style={{ marginBottom: '15px' }}>
                                    <div className="col-md-6" style={{ marginBottom: '15px' }}>
                                        <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Latitude</div>
                                        <div style={{ fontSize: '14px', color: '#344767', fontWeight: '500', marginTop: '5px' }}>{selectedDeviceDetails.latitude || '-'}</div>
                                    </div>
                                    <div className="col-md-6" style={{ marginBottom: '15px' }}>
                                        <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Longitude</div>
                                        <div style={{ fontSize: '14px', color: '#344767', fontWeight: '500', marginTop: '5px' }}>{selectedDeviceDetails.longitude || '-'}</div>
                                    </div>
                                </div>
                                <div className="row" style={{ marginBottom: '15px' }}>
                                    <div className="col-md-6" style={{ marginBottom: '15px' }}>
                                        <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Motor HP</div>
                                        <div style={{ fontSize: '14px', color: '#344767', fontWeight: '500', marginTop: '5px' }}>{selectedDeviceDetails.motor_hp || '-'}</div>
                                    </div>
                                    <div className="col-md-6" style={{ marginBottom: '15px' }}>
                                        <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Start Status</div>
                                        <div style={{ marginTop: '5px' }}>
                                            <span className={`badge badge-sm ${selectedDeviceDetails.start_status ? 'bg-gradient-success' : 'bg-gradient-secondary'}`} style={{ width: '70px', textAlign: 'center' }}>
                                                {selectedDeviceDetails.start_status ? 'Running' : 'Stopped'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="row" style={{ marginBottom: '15px' }}>
                                    <div className="col-md-6" style={{ marginBottom: '15px' }}>
                                        <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Started At</div>
                                        <div style={{ fontSize: '14px', color: '#344767', fontWeight: '500', marginTop: '5px' }}>{selectedDeviceDetails.startAt ? formatDateToIST(selectedDeviceDetails.startAt) : '-'}</div>
                                    </div>
                                    <div className="col-md-6" style={{ marginBottom: '15px' }}>
                                        <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Stopped At</div>
                                        <div style={{ fontSize: '14px', color: '#344767', fontWeight: '500', marginTop: '5px' }}>{selectedDeviceDetails.stopAt ? formatDateToIST(selectedDeviceDetails.stopAt) : '-'}</div>
                                    </div>
                                </div>
                                <div className="row" style={{ marginBottom: '15px' }}>
                                    <div className="col-md-6" style={{ marginBottom: '15px' }}>
                                        <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Config Status</div>
                                        <div style={{ marginTop: '5px' }}>
                                            <span className={`badge badge-sm ${selectedDeviceDetails.config_status ? 'bg-gradient-success' : 'bg-gradient-secondary'}`} style={{ width: '90px', textAlign: 'center' }}>
                                                {selectedDeviceDetails.config_status ? 'Configured' : 'Not Configured'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-md-6" style={{ marginBottom: '15px' }}>
                                        <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Status</div>
                                        <div style={{ marginTop: '5px' }}>
                                            <span className={`badge badge-sm ${selectedDeviceDetails.status ? 'bg-gradient-success' : 'bg-gradient-secondary'}`} style={{ width: '70px', textAlign: 'center' }}>
                                                {selectedDeviceDetails.status ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Created At</div>
                                        <div style={{ fontSize: '14px', color: '#344767', fontWeight: '500', marginTop: '5px' }}>{selectedDeviceDetails.createdAt ? formatDateToIST(selectedDeviceDetails.createdAt) : '-'}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Updated At</div>
                                        <div style={{ fontSize: '14px', color: '#344767', fontWeight: '500', marginTop: '5px' }}>{selectedDeviceDetails.updatedAt ? formatDateToIST(selectedDeviceDetails.updatedAt) : '-'}</div>
                                    </div>
                                </div>
                            </div>
                            <hr />
                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <button
                                    className="btn btn-secondary mb-0"
                                    style={{ padding: '10px' }}
                                    onClick={closeModal}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isModalDeviceHistory && selectedDeviceForHistory && (
                    <div style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1020
                    }}>
                        <div style={{
                            backgroundColor: "#fff",
                            padding: "20px",
                            borderRadius: "10px",
                            width: "900px",
                            maxHeight: "80vh",
                            overflowY: "auto",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                                <div>
                                    <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#344767' }}>Device History ({deviceHistoryData.length})</h5>
                                    <div style={{ fontSize: '13px', color: '#8f9297', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px', marginTop: '5px' }}>
                                        Serial Number: {selectedDeviceForHistory.serial_number}
                                    </div>
                                </div>
                                <button
                                    onClick={closeModal}
                                    style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}
                                >
                                    &times;
                                </button>
                            </div>
                            <hr />
                            
                            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                {loadingDeviceHistory ? (
                                    <p style={{ textAlign: 'center', padding: '20px' }}>Loading history...</p>
                                ) : deviceHistoryData.length === 0 ? (
                                    <p style={{ textAlign: 'center', padding: '20px' }}>No history records found</p>
                                ) : (
                                    <table className="table align-items-center mb-0">
                                        <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa' }}>
                                            <tr>
                                                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder" style={{ color: '#8f9297 !important' }}>Started At</th>
                                                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder" style={{ color: '#8f9297 !important' }}>Stopped At</th>
                                                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder" style={{ color: '#8f9297 !important' }}>Duration</th>
                                                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder" style={{ color: '#8f9297 !important' }}>Energy</th>
                                                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder" style={{ color: '#8f9297 !important' }}>Max Current</th>
                                                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder" style={{ color: '#8f9297 !important' }}>Min Current</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {deviceHistoryData.map((record, index) => (
                                                <tr key={index}>
                                                    <td className="text-center" style={{ fontSize: '12px' }}>{record.startAt ? formatDateToIST(record.startAt) : '-'}</td>
                                                    <td className="text-center" style={{ fontSize: '12px' }}>{record.stopAt ? formatDateToIST(record.stopAt) : '-'}</td>
                                                    <td className="text-center" style={{ fontSize: '12px' }}>{record.duration_minutes || '-'}</td>
                                                    <td className="text-center" style={{ fontSize: '12px' }}>{record.energy_kwh.toFixed(2) || '-'} kWh</td>
                                                    <td className="text-center" style={{ fontSize: '12px' }}>{record.maxCurrent.toFixed(2) || '-'}</td>
                                                    <td className="text-center" style={{ fontSize: '12px' }}>{record.minCurrent.toFixed(2) || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            <hr />
                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <button
                                    className="btn btn-secondary mb-0"
                                    style={{ padding: '10px' }}
                                    onClick={closeModal}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <Footer />
            </main>
        </div>
    );
};

export default ManageUsersView;
