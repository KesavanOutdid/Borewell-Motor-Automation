import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../../components/Admin/Header';
import Sidebar from '../../../components/Admin/Sidebar';
import Footer from '../../../components/Admin/Footer';
import TableSkeleton from '../../../components/Common/TableSkeleton';
import useManageUsersView from '../../../hooks/Admin/ManageUser/useManageUsersView';
import { formatDateToIST } from '../../../utils/formatDateToIST';

const ManageUsersView = ({ userInfo, handleLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const selectedUser = location.state?.user;

    const {
        assignedDevices,
        sharedDevices,
        loadingDevices,
        errorDevices,
        fetchUserAssignedDevices,
        pagination
    } = useManageUsersView();

    const fetchDeviceDataCalled = useRef(false);
    const [deviceHistoryMap, setDeviceHistoryMap] = useState({});
    const [checkingHistory, setCheckingHistory] = useState(false);

    useEffect(() => {
        if (!selectedUser) {
            navigate('/manage-users');
            return;
        }

        if (!fetchDeviceDataCalled.current) {
            fetchUserAssignedDevices(selectedUser.user_id);
            fetchDeviceDataCalled.current = true;
        }
    }, [selectedUser, navigate, fetchUserAssignedDevices]);

    // Check device history availability for assigned and shared devices
    useEffect(() => {
        const checkDevicesHistory = async () => {
            if ((!assignedDevices || assignedDevices.length === 0) && (!sharedDevices || sharedDevices.length === 0)) return;
            
            setCheckingHistory(true);
            const API_BASE = process.env.REACT_APP_SERVER_URL;
            const historyMap = {};

            try {
                // Check history for assigned devices (current user)
                if (assignedDevices && assignedDevices.length > 0 && selectedUser) {
                    const response = await fetch(`${API_BASE}/admin/userDeviceHistory`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ user_id: selectedUser.user_id }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.data) {
                            data.data.forEach(deviceData => {
                                historyMap[deviceData.serial_number] = deviceData.count > 0;
                            });
                        }
                    }
                }

                // Check history for shared devices (each unique master user)
                if (sharedDevices && sharedDevices.length > 0) {
                    const masterUserIds = [...new Set(sharedDevices.map(d => d.master_user_id))];
                    
                    for (const masterId of masterUserIds) {
                        const response = await fetch(`${API_BASE}/admin/userDeviceHistory`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ user_id: masterId }),
                        });

                        if (response.ok) {
                            const data = await response.json();
                            if (data.success && data.data) {
                                data.data.forEach(deviceData => {
                                    historyMap[deviceData.serial_number] = deviceData.count > 0;
                                });
                            }
                        }
                    }
                }

                setDeviceHistoryMap(historyMap);
            } catch (error) {
                console.error('Error checking device history:', error);
            } finally {
                setCheckingHistory(false);
            }
        };

        checkDevicesHistory();
    }, [assignedDevices, sharedDevices, selectedUser]);

    const handleViewDeviceHistory = async (device, isMasterDevice = true) => {
        // For shared devices, find the device in assignedDevices to get more details like imei_number
        const fullDevice = assignedDevices.find(d => d.serial_number === device.serial_number) || device;
        
        // For shared devices, use master_user_id; for assigned devices, use selectedUser.user_id
        const userId = isMasterDevice ? selectedUser.user_id : (device.master_user_id || fullDevice.assigned_user_id);

        try {
            const storedUser = JSON.parse(sessionStorage.getItem('adminUser'));
            const token = storedUser?.token;
            const API_BASE = process.env.REACT_APP_SERVER_URL;

            // Fetch device details first to pass to history page
            const response = await fetch(`${API_BASE}/admin/userDeviceDetails`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    serial_number: fullDevice.serial_number, 
                    imei_number: fullDevice.imei_number 
                }),
            });

            let deviceDetails = null;
            if (response.ok) {
                const data = await response.json();
                deviceDetails = data.data;
            }
            
            navigate('/device-history', { 
                state: { 
                    device: {
                        serial_number: fullDevice.serial_number,
                        imei_number: fullDevice.imei_number,
                        device_nickname: fullDevice.device_nickname || fullDevice.device_name || device.shared_to_user_name
                    }, 
                    user_id: userId,
                    from: 'manage-users',
                    deviceDetails: deviceDetails // Pass the fetched details
                } 
            });
        } catch (error) {
            console.error('Error preparing device history:', error);
            // Fallback navigate without details if fetch fails
            navigate('/device-history', { 
                state: { 
                    device: {
                        serial_number: fullDevice.serial_number,
                        imei_number: fullDevice.imei_number,
                        device_nickname: fullDevice.device_nickname || fullDevice.device_name || device.shared_to_user_name
                    }, 
                    user_id: userId,
                    from: 'manage-users'
                } 
            });
        }
    };

    const handleBackClick = () => {
        navigate('/manage-users');
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
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Device Nickname</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Devices Role</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Status</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loadingDevices ? (
                                                    <TableSkeleton rows={5} columns={7} />
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
                                                    assignedDevices.map((device, index) => {
                                                        // const hasHistory = deviceHistoryMap[device.serial_number] === true;
                                                        const isCheckingThisDevice = checkingHistory && !(device.serial_number in deviceHistoryMap);
                                                        
                                                        return (
                                                            <tr key={`${device.serial_number}-${device.imei_number}`}>
                                                                <td className="text-center">{index + 1}</td>
                                                                <td className="text-center">{device.serial_number || '-'}</td>
                                                                <td className="text-center">{device.imei_number || '-'}</td>
                                                                <td className="text-center">{device.device_nickname || '-'}</td>
                                                                <td className="text-center">
                                                                    <span className={`badge badge-sm ${device.role === 'master' ? 'bg-gradient-primary' : 'bg-gradient-info'}`} style={{ width: '70px', textAlign: 'center', textTransform: 'capitalize' }}>
                                                                        {device.role || 'master'}
                                                                    </span>
                                                                </td>
                                                                <td className="text-center">
                                                                    <span className={`badge badge-sm ${device.status ? 'bg-gradient-success' : 'bg-gradient-secondary'}`} style={{ width: '70px', textAlign: 'center' }}>
                                                                        {device.status ? 'Active' : 'Inactive'}
                                                                    </span>
                                                                </td>
                                                                <td className="text-center">
                                                                    <button
                                                                        className="btn btn-sm mb-0"
                                                                        style={{ 
                                                                            padding: '6px 12px', 
                                                                            fontSize: '11px',
                                                                            backgroundColor: '#fdc858',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            fontWeight: '500',
                                                                            cursor: 'pointer',
                                                                        }}
                                                                        onClick={() => handleViewDeviceHistory(device, true)}
                                                                        disabled={isCheckingThisDevice}
                                                                        title={
                                                                            isCheckingThisDevice ? 'Checking history...' :
                                                                            'View Device History'
                                                                        }
                                                                    >
                                                                        <i className="fas fa-history"></i> {isCheckingThisDevice ? 'Checking...' : 'History'}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shared Devices Section */}
                    {sharedDevices && sharedDevices.length > 0 && (
                        <div className="row mt-4">
                            <div className="col-12">
                                <div className="card mb-4">
                                    <div className="card-header pb-2">
                                        <h6>Shared Devices ({sharedDevices.length})</h6>
                                    </div>
                                    <div className="card-body px-0 pt-0 pb-2">
                                        <div className="table-responsive p-0">
                                            <table className="table align-items-center mb-0">
                                                <thead>
                                                    <tr>
                                                        <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">S.No</th>
                                                        <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Serial Number</th>
                                                        <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Master User</th>
                                                        <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Shared To</th>
                                                        <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Status</th>
                                                        <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Assigned At</th>
                                                        <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sharedDevices.map((share, index) => {
                                                        // const hasHistory = deviceHistoryMap[share.serial_number] === true;
                                                        const isCheckingThisDevice = checkingHistory && !(share.serial_number in deviceHistoryMap);
                                                        
                                                        return (
                                                            <tr key={share._id || index}>
                                                                <td className="text-center">{index + 1}</td>
                                                                <td className="text-center">{share.serial_number || '-'}</td>
                                                                <td className="text-center">
                                                                    <div style={{ fontSize: '12px', fontWeight: '500' }}>{share.master_user_name || '-'}</div>
                                                                    <div style={{ fontSize: '11px', color: '#8f9297' }}>{share.master_user_email || '-'}</div>
                                                                </td>
                                                                <td className="text-center">
                                                                    <div style={{ fontSize: '12px', fontWeight: '500' }}>{share.shared_to_user_name || '-'}</div>
                                                                    <div style={{ fontSize: '11px', color: '#8f9297' }}>{share.shared_to_user_email || '-'}</div>
                                                                    <div style={{ fontSize: '11px', color: '#8f9297' }}>{share.shared_to_user_phone || '-'}</div>
                                                                </td>
                                                                <td className="text-center">
                                                                    <span className={`badge badge-sm ${
                                                                        share.acceptance_status === 'accepted' ? 'bg-gradient-success' : 
                                                                        share.acceptance_status === 'rejected' ? 'bg-gradient-danger' : 
                                                                        'bg-gradient-warning'
                                                                    }`} style={{ width: '80px', textAlign: 'center', textTransform: 'capitalize' }}>
                                                                        {share.acceptance_status || 'pending'}
                                                                    </span>
                                                                </td>
                                                                <td className="text-center">
                                                                    <p className="text-xs font-weight-bold mb-0">
                                                                        {share.assignedAt ? formatDateToIST(share.assignedAt) : '-'}
                                                                    </p>
                                                                </td>
                                                                <td className="text-center">
                                                                    <button
                                                                        className="btn btn-sm mb-0"
                                                                        style={{ 
                                                                            padding: '6px 12px', 
                                                                            fontSize: '11px',
                                                                            backgroundColor: '#fdc858',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            fontWeight: '500',
                                                                            cursor: 'pointer',
                                                                        }}
                                                                        onClick={() => handleViewDeviceHistory(share, false)}
                                                                        disabled={isCheckingThisDevice}
                                                                        title={
                                                                            isCheckingThisDevice ? 'Checking history...' :
                                                                            'View Device History'
                                                                        }
                                                                    >
                                                                        <i className="fas fa-history"></i> {isCheckingThisDevice ? 'Checking...' : 'History'}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
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

export default ManageUsersView;
