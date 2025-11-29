import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Admin/Header';
import Sidebar from '../../components/Admin/Sidebar';
import Footer from '../../components/Admin/Footer';
import { sanitizeName, sanitizeMobile, sanitizeEmail, sanitizePassword } from '../../utils/validation';
import useManageUsers from '../../hooks/Admin/useManageUsers';
import { showAlertSuccess } from '../../utils/alert';

const ManageUsers = ({ userInfo, handleLogout }) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;
    const navigate = useNavigate();

    const { setIsModalCreate, isModalCreate, userName,
        setUserName, userMobile, setUserMobile, userEmail, setUserEmail, userPassword, setUserPassword, errorMessage,
        handleUserCreate, closeModal, fetchUserData, users, errorUsers, loadingUsers, isModalEdit, setIsModalEdit,
        fetchClientData, errorClients, errorMessageEdit, setErrorMessageEdit, fetchUserRoleData,
        errorUserRole, userRolesData, loadingUserRole, selectedUserRoleId, setSelectedUserRoleId, selectedUserRoleName, setSelectedUserRoleName,
        loadingSubmit, loadingUpdate, setLoadingUpdate, pagination, handlePageChange, handleLimitChange,
    } = useManageUsers(userInfo);

    const fetchClientDataCalled = useRef(false);
    const fetchUserDataCalled = useRef(false);
    const [currentUserDetails, setUserEditDetails] = useState(null);
    const fetchUserRoleDataCalled = useRef(false); // Ref to track if fetch user role has been called
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [originalDetails, setOriginalDetails] = useState(null);

    // Auto-fetch device data
    useEffect(() => {
        if (!fetchUserRoleDataCalled.current) {
            fetchUserRoleData();
            fetchUserRoleDataCalled.current = true;
        }
    }, [fetchUserRoleData]);

    // Fetch clients when roleName is "Client Admin", "End User", or "Installation and Service"
    useEffect(() => {
        if (
            ['Client Admin', 'End User', 'Installation and Service'].includes(selectedUserRoleName) &&
            !fetchClientDataCalled.current
        ) {
            fetchClientData()
                .then(() => {
                    fetchClientDataCalled.current = true;
                })
                .catch((error) => console.error('Error fetching clients:', error));
        }
    }, [selectedUserRoleName, fetchClientData]);

    const handleRoleChange = (e) => {
        const roleId = e.target.value;
        const selectedRole = userRolesData.find((role) => role.role_id === roleId);

        // Set the selected role name exactly as it appears in userRolesData
        setSelectedUserRoleId(roleId);
        setSelectedUserRoleName(selectedRole?.role_name || '');
    };

    // Auto-fetch user data
    useEffect(() => {
        if (!fetchUserDataCalled.current) {
            fetchUserData();
            fetchUserDataCalled.current = true;
        }
    }, [fetchUserData]);

    // Handle input changes
    const handleInputChange = (key, value) => {
        setUserEditDetails((prev) => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        if (isModalEdit && currentUserDetails) {
            setOriginalDetails(JSON.parse(JSON.stringify(currentUserDetails)));
            setIsFormDirty(false);
        }
    }, [isModalEdit, currentUserDetails]); 

    useEffect(() => {
        if (originalDetails && currentUserDetails) {
            const isDirty = JSON.stringify(originalDetails) !== JSON.stringify(currentUserDetails);
            setIsFormDirty(isDirty);
        }
    }, [currentUserDetails, originalDetails]);

    // Handle update submission
    const handleEditSubmit = async (e) => {
        e.preventDefault();

        // Apply sanitization before validation
        const sanitizedMobile = currentUserDetails.user_phone
            ? sanitizeMobile(String(currentUserDetails.user_phone))
            : '';

        const sanitizedPassword = currentUserDetails.password
            ? sanitizePassword(String(currentUserDetails.password))
            : '';

        // Mobile validation (only allowing 10 digits from sanitized input)
        if (!sanitizedMobile || sanitizedMobile.length !== 10) {
            setErrorMessageEdit('Mobile must be a 10-digit number.');
            setTimeout(() => setErrorMessageEdit(''), 5000);
            return;
        }

        // Password validation
        if (!sanitizedPassword || sanitizedPassword.length !== 6) {
            setErrorMessageEdit('Password must be a 6-digit number.');
            setTimeout(() => setErrorMessageEdit(''), 5000);
            return;
        }

        if (loadingUpdate) return; // Prevent multiple submissions
        setLoadingUpdate(true); // Disable button

        try {
            const response = await fetch(`${API_BASE}/admin/manageUserUpdated`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...currentUserDetails,
                    updatedBy: userInfo?.user?.user_email
                }),
            });

            if (response.ok) {
                showAlertSuccess('User updated successfully!');
                closeModal();
                fetchUserData(pagination.currentPage); // Stay on current page after update
                setLoadingUpdate(false);
            } else {
                const responseData = await response.json();
                setErrorMessageEdit(`${responseData.message}`);
                setTimeout(() => setErrorMessageEdit(''), 5000);
                setLoadingUpdate(false);
            }
        } catch (error) {
            setErrorMessageEdit('An error occurred during user update. Please try again later.');
            setTimeout(() => setErrorMessageEdit(''), 5000);
            setLoadingUpdate(false);
        }
    };

    return (
        <div className='' style={{ paddingTop: '15px' }}>
            {/* Sidebar */}
            <Sidebar />
            <main className="main-content position-relative h-100 mt-1 border-radius-lg ">
                {/* Header */}
                <Header userInfo={userInfo} handleLogout={handleLogout} />
                <div className="container-fluid py-4">
                    <div className="row">
                        <div className="col-12">
                            <div className="card mb-4">
                                <div className="card-header pb-2">
                                    <div className="row g-2 align-items-center">
                                        <div className="col-md-2 col-6 d-flex align-items-center">
                                            <button className="btn btn-primary mb-0" style={{ padding: '10px', width: '50%' }} onClick={() => setIsModalCreate(true)}>
                                                <i className="fas fa-file" aria-hidden="true" style={{ color: 'white' }}></i> Create
                                            </button>
                                        </div>
                                        <div className="col-md-2 col-6">
                                            <div style={{ backgroundColor: '#f0f9ff', padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Total Users</p>
                                                <p style={{ fontSize: '20px', color: '#1e40af', fontWeight: '700', margin: 0 }}>{pagination?.totalUsers || 0}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-2 col-6">
                                            <div style={{ backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Active Users</p>
                                                <p style={{ fontSize: '20px', color: '#15803d', fontWeight: '700', margin: 0 }}>{pagination?.totalActiveUsers || 0}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-2 col-6">
                                            <div style={{ backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Inactive Users</p>
                                                <p style={{ fontSize: '20px', color: '#991b1b', fontWeight: '700', margin: 0 }}>{pagination?.totalDeactiveUsers || 0}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-2 col-6">
                                            <div style={{ backgroundColor: '#fefce8', padding: '10px', borderRadius: '8px', border: '1px solid #fcd34d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Admin Count</p>
                                                <p style={{ fontSize: '20px', color: '#a16207', fontWeight: '700', margin: 0 }}>{pagination?.totalAdminUsers || 0}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-2 col-6">
                                            <div style={{ backgroundColor: '#f3e8ff', padding: '10px', borderRadius: '8px', border: '1px solid #e9d5ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Customer Count</p>
                                                <p style={{ fontSize: '20px', color: '#7e22ce', fontWeight: '700', margin: 0 }}>{pagination?.totalCustomerUsers || 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Create Modal */}
                                {isModalCreate && (
                                    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1020 }}>
                                        <div style={{
                                            backgroundColor: "#fff", padding: "20px", borderRadius: "10px", width: "430px", maxHeight: "650px",
                                            overflowY: "auto", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                                        }}>
                                            <form className="form" onSubmit={handleUserCreate} style={{ overflowY: "auto" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <h5 style={{ margin: 0 }}>Create User</h5>
                                                    <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}>
                                                        &times;
                                                    </button>
                                                </div>
                                                <div style={{ marginTop: "15px", padding: "0 10px 0 10px" }}>
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label>Role Name</label>
                                                        {loadingUserRole ? (
                                                            <p>Loading roles...</p>
                                                        ) : errorUserRole ? (
                                                            <p className="text-danger">Error fetching roles: {errorUserRole}</p>
                                                        ) : (
                                                            <select
                                                                name="status"
                                                                className="form-control"
                                                                style={{ width: "100%", padding: "8px", margin: "5px 0" }}
                                                                value={selectedUserRoleId || selectedUserRoleName || ''}
                                                                onChange={(e) => {
                                                                    const selectedUserRole = userRolesData.find(role => role.id === e.target.value);
                                                                    setSelectedUserRoleId(selectedUserRole?.role_id || null);
                                                                    setSelectedUserRoleName(selectedUserRole?.role_name || '');
                                                                    handleRoleChange(e); // Function to handle role selection and fetch clients
                                                                }}
                                                                required
                                                            >
                                                                <option value="" disabled>Select Role</option>
                                                                {userRolesData.filter(role => role.status === true).length === 0 ? (
                                                                    <option disabled>No data found</option>
                                                                ) : (
                                                                    userRolesData
                                                                        .filter(role => role.status === true)
                                                                        .map(role => (
                                                                            <option key={`role-${role.role_id}`} value={role.role_id}>
                                                                                {role.role_name}
                                                                            </option>
                                                                        ))
                                                                )}
                                                            </select>
                                                        )}
                                                    </div>
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label>User Name</label>
                                                        <input
                                                            type="text"
                                                            name="name"
                                                            className="form-control"
                                                            style={{ width: "100%", padding: "8px", margin: "5px 0" }}
                                                            value={userName}
                                                            onChange={(e) => setUserName(sanitizeName(e.target.value))}
                                                            required
                                                        />
                                                    </div>
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label>Phone</label>
                                                        <input
                                                            type="text"
                                                            name="mobile"
                                                            className="form-control"
                                                            style={{ width: "100%", padding: "8px", margin: "5px 0" }}
                                                            value={userMobile}
                                                            onChange={(e) => setUserMobile(sanitizeMobile(e.target.value))}
                                                            required
                                                        />
                                                    </div>
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label>E-mail</label>
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            className="form-control"
                                                            style={{ width: "100%", padding: "8px", margin: "5px 0" }}
                                                            value={userEmail}
                                                            onChange={(e) => setUserEmail(sanitizeEmail(e.target.value))}
                                                            required
                                                        />
                                                    </div>
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label>Password</label>
                                                        <input
                                                            type="text"
                                                            name="password"
                                                            className="form-control"
                                                            style={{ width: "100%", padding: "8px", margin: "5px 0" }}
                                                            value={userPassword}
                                                            onChange={(e) => setUserPassword(sanitizePassword(e.target.value))}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div style={{
                                                    marginTop: "20px",
                                                    display: "flex",
                                                    justifyContent: "flex-end",
                                                    gap: "10px"
                                                }}>
                                                    <button
                                                        className="btn btn-secondary mb-0"
                                                        style={{ padding: '10px' }}
                                                        onClick={closeModal}
                                                    >
                                                        Close
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="btn btn-primary mb-0"
                                                        style={{ padding: '10px' }}
                                                        disabled={loadingSubmit}>{loadingSubmit ? "Creating..." : "Create"}</button>
                                                </div>
                                            </form>
                                            {errorMessage && (
                                                <div className="card-header pb-0 text-left bg-transparent">
                                                    <p className="text-danger text-center">{errorMessage}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {/* Edit Modal */}
                                <>
                                    {isModalEdit && currentUserDetails && (
                                        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1020, }}>
                                            <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "10px", width: "400px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", }}>
                                                <form className="form" onSubmit={handleEditSubmit}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", }}>
                                                        <h5 style={{ margin: 0 }}>Edit User</h5>
                                                        <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", }}> &times; </button>
                                                    </div>
                                                    <div style={{ marginTop: "15px" }}>
                                                        <div style={{ marginBottom: "10px" }}>
                                                            <label>User Name</label>
                                                            <input type="text" name="name" className="form-control" style={{ width: "100%", padding: "8px", margin: "5px 0" }}
                                                                value={currentUserDetails.user_name} onChange={(e) => handleInputChange("user_name", sanitizeName(e.target.value))} required />
                                                        </div>
                                                        <div style={{ marginBottom: "10px" }}>
                                                            <label>Mobile</label>
                                                            <input type="text" name="mobile" className="form-control" style={{ width: "100%", padding: "8px", margin: "5px 0" }}
                                                                value={currentUserDetails.user_phone} onChange={(e) => handleInputChange("user_phone", sanitizeMobile(e.target.value))} required />
                                                        </div>
                                                        <div style={{ marginBottom: "10px" }}>
                                                            <label>E-mail</label>
                                                            <input type="email" name="email" className="form-control" style={{ width: "100%", padding: "8px", margin: "5px 0" }}
                                                                value={currentUserDetails.user_email} onChange={(e) => handleInputChange("user_email", sanitizeEmail(e.target.value))} readOnly required />
                                                        </div>
                                                        <div style={{ marginBottom: "10px" }}>
                                                            <label>Password</label>
                                                            <input type="text" name="text" className="form-control" style={{ width: "100%", padding: "8px", margin: "5px 0" }}
                                                                value={currentUserDetails.password} onChange={(e) => handleInputChange("password", sanitizePassword(e.target.value))} required />
                                                        </div>
                                                        <div style={{ marginBottom: "10px" }}>
                                                            <label>Status</label>
                                                            <select
                                                                name="status"
                                                                className="form-control"
                                                                style={{ width: "100%", padding: "8px", margin: "5px 0" }}
                                                                value={currentUserDetails.status ? "true" : "false"}
                                                                onChange={(e) => handleInputChange("status", e.target.value === "true")}
                                                                required
                                                            >
                                                                <option value="true">Active</option>
                                                                <option value="false">De-Active</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        marginTop: "20px",
                                                        display: "flex",
                                                        justifyContent: "flex-end",
                                                        gap: "10px"
                                                    }}>
                                                        <button className="btn btn-secondary mb-0" style={{ padding: '10px' }} onClick={closeModal}>Close</button>
                                                        <button type="submit" className="btn btn-primary mb-0" style={{ padding: '10px' }} disabled={!isFormDirty || loadingUpdate}>{loadingUpdate ? "Updating..." : "Update"}</button>
                                                    </div>
                                                </form>
                                                {errorMessageEdit && (
                                                    <div className="card-header pb-0 text-left bg-transparent">
                                                        <p className="text-danger text-center">{errorMessageEdit}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                               
                                <div className="card-body px-0 pt-0 pb-2">
                                    <div className="table-responsive p-0" style={{ maxHeight: '680px', overflowY: 'scroll' }}>
                                        <table className="table align-items-center mb-0" >
                                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa' }}>
                                                <tr>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">S.No</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Role Name</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">User Name</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Mobile</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">E-mail</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Status</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Option</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loadingUsers ? (
                                                    <tr>
                                                        <td colSpan="8" style={{ textAlign: 'center' }}>
                                                            <p>Loading...</p>
                                                        </td>
                                                    </tr>
                                                ) : errorUsers ? (
                                                    <tr>
                                                        <td colSpan="8" style={{ textAlign: 'center', color: 'red' }}>
                                                            <p>{errorClients}</p>
                                                        </td>
                                                    </tr>
                                                ) : users && users.length > 0 ? (
                                                    users.slice().map((user, index) => (
                                                        <tr key={`user-${index}`}>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {index + 1 || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {user.role_name || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {user.user_name || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {user.user_phone || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {user.user_email || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {user.status ? (
                                                                        <span className="badge badge-sm bg-gradient-success" style={{ width: '60px', textAlign: 'center' }}>Active</span>
                                                                    ) : (
                                                                        <span className="badge badge-sm bg-gradient-secondary" style={{ width: '60px', textAlign: 'center' }}>De-Active</span>
                                                                    )}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <div className="d-flex justify-content-center align-items-center gap-2" style={{ flexWrap: 'wrap' }}>
                                                                    <button className="btn btn-primary mb-0" style={{ padding: '10px', fontSize: '12px' }}
                                                                        onClick={() => {
                                                                            setIsModalEdit(true); // Show the modal
                                                                            setUserEditDetails(user); // Set the selected user's details
                                                                        }}
                                                                    >
                                                                        <i className="fas fa-pen" aria-hidden="true" style={{ color: 'white' }}></i> Edit
                                                                    </button>
                                                                    <button className="btn btn-success mb-0" style={{ padding: '10px', fontSize: '12px' }}
                                                                        onClick={() => {
                                                                            navigate('/admin/manage-users-view', { state: { user } });
                                                                        }}
                                                                    >
                                                                        <i className="fas fa-eye" aria-hidden="true" style={{ color: 'white' }}></i> View
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="8" style={{ textAlign: 'center' }}>
                                                            <p>No device data available.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {users && users.length > 0 && pagination && (
                                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 px-3">
                                            {/* Results info */}
                                            <div className="mb-2 mb-md-0">
                                                <span className="text-sm text-muted">
                                                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalUsers)} of {pagination.totalUsers} users
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
                                                <nav aria-label="User pagination">
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
                    {/* Footer */}
                    <Footer />
                </div>
            </main>
        </div>
    );
};

export default ManageUsers;
