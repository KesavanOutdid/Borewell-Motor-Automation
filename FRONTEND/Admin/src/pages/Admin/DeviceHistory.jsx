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
    const { device, user_id } = location.state || {};
    
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
                                    <div className="table-responsive p-0" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                        <table className="table align-items-center mb-0">
                                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa' }}>
                                                <tr>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>S.No</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Started At</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Stopped At</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Duration (min)</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Energy (kWh)</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Max Current</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7" style={{ color: '#8f9297 !important' }}>Min Current</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loadingDeviceHistory ? (
                                                    <TableSkeleton rows={8} columns={7} />
                                                ) : deviceHistoryData.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                                                            <p>No history data available</p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    deviceHistoryData.map((record, index) => (
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
                                                                <p className="text-xs font-weight-bold mb-0">
                                                                    {record.stopAt ? new Date(record.stopAt).toLocaleString() : '-'}
                                                                </p>
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
                </div>
                <Footer />
            </main>
        </div>
    );
};

export default DeviceHistory;
