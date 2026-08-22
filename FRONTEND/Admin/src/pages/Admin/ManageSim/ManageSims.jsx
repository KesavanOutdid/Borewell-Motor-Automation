import React, { useState, useEffect, useRef } from 'react';
import Header from '../../../components/Admin/Header';
import Sidebar from '../../../components/Admin/Sidebar';
import TableSkeleton from '../../../components/Common/TableSkeleton';
import { showAlertSuccess } from '../../../utils/alert';
import { formatDateToIST } from '../../../utils/formatDateToIST';
import { sanitizeMobile, sanitizeSimNumber, sanitizeImeiNumber } from '../../../utils/validation';

const ManageSims = ({ userInfo, handleLogout }) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;

    const [sims, setSims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isModalCreate, setIsModalCreate] = useState(false);
    const [isModalEdit, setIsModalEdit] = useState(false);
    const [isModalView, setIsModalView] = useState(false);
    
    // Form States
    const [simNumber, setSimNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [imeiNumber, setImeiNumber] = useState('');
    const [provider, setProvider] = useState('');
    const [customProvider, setCustomProvider] = useState('');
    const [currentSimDetails, setCurrentSimDetails] = useState(null);

    const [summary, setSummary] = useState({
        total: 0, active: 0, inactive: 0, assigned: 0, unassigned: 0, expired: 0, expiringSoon: 0
    });

    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [pagination, setPagination] = useState({
        currentPage: 1,
        limit: 10,
        totalSims: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('Total');
    const searchTimeoutRef = useRef(null);

    const fetchSims = async (page = 1, limit = 10, search = '', filter = 'Total') => {
        setLoading(true);
        setError(null);
        try {
            const url = `${API_BASE}/admin/getSims?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&filter=${encodeURIComponent(filter)}`;
            const response = await fetch(url);
            const data = await response.json();

            if (response.ok && data.success) {
                setSims(data.sims);
                setPagination(data.pagination);
                if (data.summary) {
                    setSummary(data.summary);
                }
            } else {
                setError(data.message || 'Failed to fetch SIM data');
            }
        } catch (err) {
            setError('Error connecting to the server');
            console.error('Fetch Sims Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSims(1, pagination.limit, searchQuery, filterStatus);
    }, [filterStatus]);

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            fetchSims(1, pagination.limit, query, filterStatus);
        }, 500);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchSims(newPage, pagination.limit, searchQuery, filterStatus);
        }
    };

    const handleLimitChange = (e) => {
        fetchSims(1, parseInt(e.target.value), searchQuery, filterStatus);
    };

    const closeModal = () => {
        setIsModalCreate(false);
        setIsModalEdit(false);
        setIsModalView(false);
        setSimNumber('');
        setPhoneNumber('');
        setImeiNumber('');
        setProvider('');
        setCustomProvider('');
        setCurrentSimDetails(null);
        setErrorMessage('');
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        
        const cleanSim = sanitizeSimNumber(simNumber);
        const cleanPhone = sanitizeMobile(phoneNumber);
        const cleanImei = sanitizeImeiNumber(imeiNumber);

        if (!cleanSim) {
            setErrorMessage("SIM Number (ICCID) is required.");
            return;
        }

        if (!/^\d{19,20}$/.test(cleanSim)) {
            setErrorMessage("SIM Number (ICCID) must be 19 to 20 digits.");
            return;
        }

        if (!cleanPhone) {
            setErrorMessage("Phone Number is required.");
            return;
        }

        if (!/^\d{10}$/.test(cleanPhone)) {
            setErrorMessage("Phone Number must be exactly 10 digits.");
            return;
        }

        if (cleanImei && !/^\d{15}$/.test(cleanImei)) {
            setErrorMessage("IMEI Number must be exactly 15 digits.");
            return;
        }

        const finalProvider = provider === 'Others' ? customProvider : provider;

        setLoadingSubmit(true);
        try {
            const response = await fetch(`${API_BASE}/admin/createSim`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sim_number: cleanSim,
                    phone_number: cleanPhone,
                    imei_number: cleanImei,
                    provider: finalProvider,
                    createdBy: userInfo?.user?.user_email
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showAlertSuccess('SIM created successfully!');
                closeModal();
                fetchSims(1, pagination.limit, searchQuery, filterStatus);
            } else {
                setErrorMessage(data.message || "Failed to create SIM");
            }
        } catch (err) {
            setErrorMessage("Server error while creating SIM.");
        } finally {
            setLoadingSubmit(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        
        const cleanSim = sanitizeSimNumber(currentSimDetails.sim_number || '');
        const cleanPhone = sanitizeMobile(currentSimDetails.phone_number || '');
        const cleanImei = sanitizeImeiNumber(currentSimDetails.imei_number || '');

        if (!cleanSim) {
            setErrorMessage("SIM Number (ICCID) is required.");
            return;
        }

        if (!/^\d{19,20}$/.test(cleanSim)) {
            setErrorMessage("SIM Number (ICCID) must be 19 to 20 digits.");
            return;
        }

        if (!cleanPhone) {
            setErrorMessage("Phone Number is required.");
            return;
        }

        if (!/^\d{10}$/.test(cleanPhone)) {
            setErrorMessage("Phone Number must be exactly 10 digits.");
            return;
        }

        if (cleanImei && !/^\d{15}$/.test(cleanImei)) {
            setErrorMessage("IMEI Number must be exactly 15 digits.");
            return;
        }

        const finalProvider = currentSimDetails.provider === 'Others' ? currentSimDetails.customProvider : currentSimDetails.provider;

        setLoadingSubmit(true);
        try {
            const response = await fetch(`${API_BASE}/admin/updateSim`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: currentSimDetails._id,
                    sim_number: cleanSim,
                    phone_number: cleanPhone,
                    imei_number: cleanImei,
                    provider: finalProvider,
                    status: currentSimDetails.status,
                    updatedBy: userInfo?.user?.user_email
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showAlertSuccess('SIM updated successfully!');
                closeModal();
                fetchSims(pagination.currentPage, pagination.limit, searchQuery, filterStatus);
            } else {
                setErrorMessage(data.message || "Failed to update SIM");
            }
        } catch (err) {
            setErrorMessage("Server error while updating SIM.");
        } finally {
            setLoadingSubmit(false);
        }
    };

    return (
        <div className='' style={{ paddingTop: '15px' }}>
            <Sidebar />
            <main className="main-content position-relative h-100 mt-1 border-radius-lg ">
                <Header userInfo={userInfo} handleLogout={handleLogout} />
                <div className="container-fluid py-4">
                    <div className="row">
                        <div className="col-12">
                            <div className="card mb-4">
                                <div className="card-header pb-3">
                                    <div className="row g-2 align-items-center">
                                        <div className="col-md-2 col-6 d-flex align-items-center">
                                            <button
                                                className="btn btn-primary mb-0 flex-fill w-100"
                                                style={{ padding: '10px' }}
                                                onClick={() => setIsModalCreate(true)}
                                            >
                                                <i className="fas fa-plus" aria-hidden="true" style={{ color: 'white' }}></i> Create SIM
                                            </button>
                                        </div>
                                        <div className="col-md-7 col-12 d-flex flex-wrap gap-1">
                                            <div 
                                                onClick={() => setFilterStatus('Total')}
                                                style={{ flex: '1 0 100px', backgroundColor: filterStatus === 'Total' ? '#bfdbfe' : '#dbeafe', padding: '12px', borderRadius: '8px', border: `1px solid ${filterStatus === 'Total' ? '#3b82f6' : '#bfdbfe'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s' }}>
                                                <p style={{ fontSize: '11px', color: filterStatus === 'Total' ? '#1d4ed8' : '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Total</p>
                                                <p style={{ fontSize: '18px', color: '#1e40af', fontWeight: '700', margin: 0 }}>{summary.total}</p>
                                            </div>
                                            <div 
                                                onClick={() => setFilterStatus('Active')}
                                                style={{ flex: '1 0 100px', backgroundColor: filterStatus === 'Active' ? '#bbf7d0' : '#dcfce7', padding: '12px', borderRadius: '8px', border: `1px solid ${filterStatus === 'Active' ? '#22c55e' : '#bbf7d0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s' }}>
                                                <p style={{ fontSize: '11px', color: filterStatus === 'Active' ? '#15803d' : '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Active</p>
                                                <p style={{ fontSize: '18px', color: '#15803d', fontWeight: '700', margin: 0 }}>{summary.active}</p>
                                            </div>
                                            <div 
                                                onClick={() => setFilterStatus('Assigned')}
                                                style={{ flex: '1 0 100px', backgroundColor: filterStatus === 'Assigned' ? '#fde68a' : '#fffbeb', padding: '12px', borderRadius: '8px', border: `1px solid ${filterStatus === 'Assigned' ? '#f59e0b' : '#fef3c7'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s' }}>
                                                <p style={{ fontSize: '11px', color: filterStatus === 'Assigned' ? '#b45309' : '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Assigned</p>
                                                <p style={{ fontSize: '18px', color: '#d97706', fontWeight: '700', margin: 0 }}>{summary.assigned}</p>
                                            </div>
                                            <div 
                                                onClick={() => setFilterStatus('Expired')}
                                                style={{ flex: '1 0 100px', backgroundColor: filterStatus === 'Expired' ? '#fecaca' : '#fef2f2', padding: '12px', borderRadius: '8px', border: `1px solid ${filterStatus === 'Expired' ? '#ef4444' : '#fecaca'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s' }}>
                                                <p style={{ fontSize: '11px', color: filterStatus === 'Expired' ? '#b91c1c' : '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Expired</p>
                                                <p style={{ fontSize: '18px', color: '#991b1b', fontWeight: '700', margin: 0 }}>{summary.expired}</p>
                                            </div>
                                            <div 
                                                onClick={() => setFilterStatus('Inactive')}
                                                style={{ flex: '1 0 100px', backgroundColor: filterStatus === 'Inactive' ? '#e5e7eb' : '#f9fafb', padding: '12px', borderRadius: '8px', border: `1px solid ${filterStatus === 'Inactive' ? '#6b7280' : '#e5e7eb'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s' }}>
                                                <p style={{ fontSize: '11px', color: filterStatus === 'Inactive' ? '#374151' : '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Inactive</p>
                                                <p style={{ fontSize: '18px', color: '#4b5563', fontWeight: '700', margin: 0 }}>{summary.inactive}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-3 col-12">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="🔍 Search SIM Number or Provider..."
                                                value={searchQuery}
                                                onChange={(e) => handleSearch(e.target.value)}
                                                style={{ borderRadius: '6px', padding: '10px 15px', fontSize: '13px' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Create Modal */}
                                {isModalCreate && (
                                    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1020 }}>
                                        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "10px", width: "400px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
                                            <form onSubmit={handleCreateSubmit}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <h5 style={{ margin: 0 }}>Add New SIM</h5>
                                                    <button type="button" onClick={closeModal} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}> &times; </button>
                                                </div>
                                                <div style={{ marginTop: "15px" }}>
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label>SIM Number (ICCID) *</label>
                                                        <input type="text" className="form-control" style={{ width: "100%", padding: "8px", margin: "5px 0" }} placeholder="Enter 19-20 digit ICCID"
                                                            maxLength={20}
                                                            value={simNumber} onChange={(e) => setSimNumber(sanitizeSimNumber(e.target.value))} required />
                                                    </div>
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label>Phone Number *</label>
                                                        <input type="text" className="form-control" style={{ width: "100%", padding: "8px", margin: "5px 0" }} placeholder="Enter 10 digit Phone Number"
                                                            maxLength={10}
                                                            value={phoneNumber} onChange={(e) => setPhoneNumber(sanitizeMobile(e.target.value))} required />
                                                    </div>
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label>IMEI Number</label>
                                                        <input type="text" className="form-control" style={{ width: "100%", padding: "8px", margin: "5px 0" }} placeholder="Enter 15 digit IMEI (Optional)"
                                                            maxLength={15}
                                                            value={imeiNumber} onChange={(e) => setImeiNumber(sanitizeImeiNumber(e.target.value))} />
                                                    </div>
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label>Provider</label>
                                                        <select className="form-control" style={{ width: "100%", padding: "8px", margin: "5px 0" }} 
                                                            value={provider} onChange={(e) => setProvider(e.target.value)}>
                                                            <option value="">Select Provider</option>
                                                            <option value="Jio">Jio</option>
                                                            <option value="Airtel">Airtel</option>
                                                            <option value="Vi">Vi (Vodafone Idea)</option>
                                                            <option value="BSNL">BSNL</option>
                                                            <option value="Others">Others</option>
                                                        </select>
                                                    </div>
                                                    {provider === 'Others' && (
                                                        <div style={{ marginBottom: "10px" }}>
                                                            <label>Custom Provider Name *</label>
                                                            <input type="text" className="form-control" style={{ width: "100%", padding: "8px", margin: "5px 0" }} placeholder="Enter Provider Name"
                                                                value={customProvider} onChange={(e) => setCustomProvider(e.target.value)} required />
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                                    <button type="button" className="btn btn-secondary mb-0" style={{ padding: '10px' }} onClick={closeModal}>Close</button>
                                                    <button type="submit" className="btn btn-primary mb-0" style={{ padding: '10px' }} disabled={loadingSubmit}>{loadingSubmit ? "Creating..." : "Create"}</button>
                                                </div>
                                            </form>
                                            {errorMessage && <p className="text-danger text-center mt-3 mb-0">{errorMessage}</p>}
                                        </div>
                                    </div>
                                )}

                                {/* Edit Modal */}
                                {isModalEdit && currentSimDetails && (
                                    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1020 }}>
                                        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "10px", width: "400px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
                                            <form onSubmit={handleEditSubmit}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <h5 style={{ margin: 0 }}>Edit SIM</h5>
                                                    <button type="button" onClick={closeModal} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}> &times; </button>
                                                </div>
                                                <div style={{ marginTop: "15px" }}>
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label>SIM Number (ICCID) *</label>
                                                        <input type="text" className="form-control" style={{ width: "100%", padding: "8px", margin: "5px 0" }}
                                                            maxLength={20}
                                                            value={currentSimDetails.sim_number || ''} onChange={(e) => setCurrentSimDetails({...currentSimDetails, sim_number: sanitizeSimNumber(e.target.value)})} required />
                                                    </div>
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label>Phone Number *</label>
                                                        <input type="text" className="form-control" style={{ width: "100%", padding: "8px", margin: "5px 0" }}
                                                            maxLength={10}
                                                            value={currentSimDetails.phone_number || ''} onChange={(e) => setCurrentSimDetails({...currentSimDetails, phone_number: sanitizeMobile(e.target.value)})} required />
                                                    </div>
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label>IMEI Number</label>
                                                        <input type="text" className="form-control" style={{ width: "100%", padding: "8px", margin: "5px 0" }}
                                                            maxLength={15}
                                                            value={currentSimDetails.imei_number || ''} onChange={(e) => setCurrentSimDetails({...currentSimDetails, imei_number: sanitizeImeiNumber(e.target.value)})} />
                                                    </div>
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label>Provider</label>
                                                        <select className="form-control" style={{ width: "100%", padding: "8px", margin: "5px 0" }} 
                                                            value={['Jio', 'Airtel', 'Vi', 'BSNL'].includes(currentSimDetails.provider) ? currentSimDetails.provider : (currentSimDetails.provider ? 'Others' : '')} 
                                                            onChange={(e) => setCurrentSimDetails({...currentSimDetails, provider: e.target.value, customProvider: e.target.value === 'Others' ? currentSimDetails.provider : ''})}>
                                                            <option value="">Select Provider</option>
                                                            <option value="Jio">Jio</option>
                                                            <option value="Airtel">Airtel</option>
                                                            <option value="Vi">Vi (Vodafone Idea)</option>
                                                            <option value="BSNL">BSNL</option>
                                                            <option value="Others">Others</option>
                                                        </select>
                                                    </div>
                                                    {(!['Jio', 'Airtel', 'Vi', 'BSNL', ''].includes(currentSimDetails.provider) || currentSimDetails.provider === 'Others') && (
                                                        <div style={{ marginBottom: "10px" }}>
                                                            <label>Custom Provider Name *</label>
                                                            <input type="text" className="form-control" style={{ width: "100%", padding: "8px", margin: "5px 0" }}
                                                                value={currentSimDetails.customProvider !== undefined ? currentSimDetails.customProvider : currentSimDetails.provider} 
                                                                onChange={(e) => setCurrentSimDetails({...currentSimDetails, customProvider: e.target.value})} required />
                                                        </div>
                                                    )}
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label>Status</label>
                                                        <select className="form-control" style={{ width: "100%", padding: "8px", margin: "5px 0" }} 
                                                            value={currentSimDetails.status} onChange={(e) => setCurrentSimDetails({...currentSimDetails, status: e.target.value === 'true'})}>
                                                            <option value="true">Active</option>
                                                            <option value="false">De-Active</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                                    <button type="button" className="btn btn-secondary mb-0" style={{ padding: '10px' }} onClick={closeModal}>Close</button>
                                                    <button type="submit" className="btn btn-primary mb-0" style={{ padding: '10px' }} disabled={loadingSubmit}>{loadingSubmit ? "Updating..." : "Update"}</button>
                                                </div>
                                            </form>
                                            {errorMessage && <p className="text-danger text-center mt-3 mb-0">{errorMessage}</p>}
                                        </div>
                                    </div>
                                )}

                                {/* View Modal */}
                                {isModalView && currentSimDetails && (
                                    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1020 }}>
                                        <div style={{ backgroundColor: "#fff", padding: "25px", borderRadius: "10px", width: "500px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "15px" }}>
                                                <h5 style={{ margin: 0 }}>View SIM Details</h5>
                                                <button type="button" onClick={closeModal} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}> &times; </button>
                                            </div>
                                            
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label className="text-xs text-secondary font-weight-bolder mb-0">SIM Number (ICCID)</label>
                                                    <p className="text-sm font-weight-bold mb-0">{currentSimDetails.sim_number}</p>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="text-xs text-secondary font-weight-bolder mb-0">Phone Number</label>
                                                    <p className="text-sm font-weight-bold mb-0">{currentSimDetails.phone_number}</p>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="text-xs text-secondary font-weight-bolder mb-0">IMEI Number</label>
                                                    <p className="text-sm font-weight-bold mb-0">{currentSimDetails.imei_number || '-'}</p>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="text-xs text-secondary font-weight-bolder mb-0">Provider</label>
                                                    <p className="text-sm font-weight-bold mb-0">{currentSimDetails.provider || '-'}</p>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="text-xs text-secondary font-weight-bolder mb-0">Status</label>
                                                    <p className="text-sm font-weight-bold mb-0">
                                                        {currentSimDetails.status ? <span className="badge bg-gradient-success">Active</span> : <span className="badge bg-gradient-danger">De-Active</span>}
                                                    </p>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="text-xs text-secondary font-weight-bolder mb-0">Assign Status</label>
                                                    <p className="text-sm font-weight-bold mb-0">
                                                        {currentSimDetails.assign_status ? <span className="badge bg-gradient-info">{currentSimDetails.assigned_device_serial}</span> : <span className="badge bg-gradient-secondary">Unassigned</span>}
                                                    </p>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="text-xs text-secondary font-weight-bolder mb-0">Expiry Date</label>
                                                    <p className="text-sm font-weight-bold mb-0">{currentSimDetails.sim_expiry_date ? formatDateToIST(currentSimDetails.sim_expiry_date) : '-'}</p>
                                                </div>
                                            </div>

                                            <hr className="my-2" />
                                            <h6 className="text-xs text-uppercase text-secondary mb-3 mt-2">Tracking Information</h6>
                                            
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label className="text-xs text-secondary font-weight-bolder mb-0">Created By</label>
                                                    <p className="text-sm font-weight-bold mb-0">{currentSimDetails.createdBy}</p>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="text-xs text-secondary font-weight-bolder mb-0">Created At</label>
                                                    <p className="text-sm font-weight-bold mb-0">{currentSimDetails.createdAt ? formatDateToIST(currentSimDetails.createdAt) : '-'}</p>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="text-xs text-secondary font-weight-bolder mb-0">Updated By</label>
                                                    <p className="text-sm font-weight-bold mb-0">{currentSimDetails.updatedBy || '-'}</p>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="text-xs text-secondary font-weight-bolder mb-0">Updated At</label>
                                                    <p className="text-sm font-weight-bold mb-0">{currentSimDetails.updatedAt ? formatDateToIST(currentSimDetails.updatedAt) : '-'}</p>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                                <button type="button" className="btn btn-secondary mb-0" style={{ padding: '10px' }} onClick={closeModal}>Close</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="card-body px-0 pt-0 pb-2">
                                    <div className="table-responsive p-0" style={{ maxHeight: '500px', overflowY: 'scroll' }}>
                                        <table className="table align-items-center mb-0">
                                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa' }}>
                                                <tr>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">S.No</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">ICCID</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Phone Number</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Provider</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Assigned Device</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Expiry Date</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Status</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading ? (
                                                    <TableSkeleton rows={5} columns={7} />
                                                ) : error ? (
                                                    <tr><td colSpan="7" className="text-center text-danger"><p>{error}</p></td></tr>
                                                ) : sims.length > 0 ? (
                                                    sims.map((sim, index) => (
                                                        <tr key={sim._id}>
                                                            <td className="align-middle text-center"><span className="text-secondary text-xs font-weight-bold">{(pagination.currentPage - 1) * pagination.limit + index + 1}</span></td>
                                                            <td className="align-middle text-center"><span className="text-secondary text-xs font-weight-bold">{sim.sim_number}</span></td>
                                                            <td className="align-middle text-center"><span className="text-secondary text-xs font-weight-bold">{sim.phone_number || '-'}</span></td>
                                                            <td className="align-middle text-center"><span className="text-secondary text-xs font-weight-bold">{sim.provider || '-'}</span></td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {sim.assign_status ? <span className="badge bg-gradient-info">{sim.assigned_device_serial}</span> : <span className="badge bg-gradient-secondary">Unassigned</span>}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {sim.sim_expiry_date ? new Date(sim.sim_expiry_date).toLocaleDateString() : '-'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {sim.status ? <span className="badge bg-gradient-success">Active</span> : <span className="badge bg-gradient-danger">De-Active</span>}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <button className="btn btn-info mb-0 btn-sm me-2" onClick={() => { setCurrentSimDetails(sim); setIsModalView(true); }}>
                                                                    <i className="fas fa-eye" aria-hidden="true" style={{ color: 'white' }}></i> View
                                                                </button>
                                                                <button className="btn btn-primary mb-0 btn-sm" onClick={() => { setCurrentSimDetails(sim); setIsModalEdit(true); }}>
                                                                    <i className="fas fa-pen" aria-hidden="true" style={{ color: 'white' }}></i> Edit
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr><td colSpan="7" className="text-center"><p>No SIMs found.</p></td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {sims.length > 0 && (
                                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-4 px-3">
                                            <div className="mb-2 mb-md-0">
                                                <span className="text-sm text-muted">
                                                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalSims)} of {pagination.totalSims} SIMs
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
                                                        onChange={handleLimitChange}
                                                    >
                                                        <option value={5}>5</option>
                                                        <option value={10}>10</option>
                                                        <option value={25}>25</option>
                                                        <option value={50}>50</option>
                                                    </select>
                                                    <span className="text-sm">per page</span>
                                                </div>

                                                {/* Page navigation */}
                                                <nav aria-label="SIM pagination">
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
            </main>
        </div>
    );
};

export default ManageSims;
