import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/Admin/Header';
import Sidebar from '../../components/Admin/Sidebar';
import Footer from '../../components/Admin/Footer';
import useManageUserRole from '../../hooks/Admin/useManageUserRole';
import { sanitizeName } from '../../utils/validation';
import { formatDateToIST } from '../../utils/formatDateToIST';
import { showAlertSuccess } from '../../utils/alert';

const ManageUserRoles = ({ userInfo, handleLogout }) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;

    const {
        setIsModalCreate,
        isModalCreate, handleUserRoleCreate, isModalEdit, setIsModalEdit, setUserRole, userRole, closeModal, errorMessage,
        errorUserRole, userRolesData, loading, fetchUserRoleData, errorMessageEdit, setErrorMessageEdit, loadingUpdate, setLoadingUpdate,
        pagination, handleLimitChange
    } = useManageUserRole(userInfo);

    const fetchUserRoleDataCalled = useRef(false); // Ref to track if fetch user role has been called
    const [currentUserRoleDetails, setUserRoleEditDetails] = useState(null);
    const [originalUserRoleDetails, setOriginalUserRoleDetails] = useState(null);
    const [isFormDirty, setIsFormDirty] = useState(false);

    // Auto-fetch device data
    useEffect(() => {
        if (!fetchUserRoleDataCalled.current) {
            fetchUserRoleData();
            fetchUserRoleDataCalled.current = true;
        }
    }, [fetchUserRoleData]);



    // Handle input changes
    const handleInputChange = (key, value) => {
        setUserRoleEditDetails((prev) => ({ ...prev, [key]: value }));
    };

    // Check if form is dirty
    useEffect(() => {
        if (originalUserRoleDetails && currentUserRoleDetails) {
            const isDirty = Object.keys(originalUserRoleDetails).some(key => originalUserRoleDetails[key] !== currentUserRoleDetails[key]);
            setIsFormDirty(isDirty);
        }
    }, [currentUserRoleDetails, originalUserRoleDetails]);

    // Handle update submission
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (loadingUpdate) return;
        setLoadingUpdate(true);

        try {
            const response = await fetch(`${API_BASE}/admin/editRole`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role_id: currentUserRoleDetails.role_id,
                    status: currentUserRoleDetails.status,
                    updatedBy: userInfo?.user?.user_email
                })
            });

            const res = await response.json();

            if (!response.ok) {
                setErrorMessageEdit(res.message || "Error updating role");
                setLoadingUpdate(false);
                return;
            }

            showAlertSuccess("Role updated successfully!");
            closeModal();
            fetchUserRoleData(pagination.currentPage);
        } catch (error) {
            console.error("EDIT ROLE ERROR:", error);
            setErrorMessageEdit("Unexpected error updating role");
        }
        setLoadingUpdate(false);
    };

    // Handle page change
    const handlePageChange = (page) => {
        fetchUserRoleData(page);
    };

    const predefinedRoles = [
        { role_id: 1, role_name: "Super Admin" },
        { role_id: 2, role_name: "Customer" },
    ];
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
                                    <div className="w-40 text-end d-flex gap-2">
                                        <button className="btn btn-primary mb-0 text-end" style={{ padding: '10px' }} onClick={() => setIsModalCreate(true)}>
                                            <i className="fas fa-file" aria-hidden="true" style={{ color: 'white' }}></i> Create
                                        </button>
                                    </div>
                                </div>
                                <div className="card-body px-0 pt-0 pb-2">
                                    <div className="table-responsive p-0" style={{ maxHeight: '500px', overflowY: 'scroll' }}>
                                        <table className="table align-items-center mb-0" >
                                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa' }}>
                                                <tr>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">S.No</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Role Name</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Created By</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Created Date</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Updated By</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Updated Date</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Status</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Option</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan="8" style={{ textAlign: 'center' }}>
                                                            <p>Loading...</p>
                                                        </td>
                                                    </tr>
                                                ) : errorUserRole ? (
                                                    <tr>
                                                        <td colSpan="8" style={{ textAlign: 'center', color: 'red' }}>
                                                            <p>{errorUserRole}</p>
                                                        </td>
                                                    </tr>
                                                ) : userRolesData && userRolesData.length > 0 ? (
                                                    userRolesData.map((userRoles, index) => (
                                                        <tr key={userRoles.role_id}>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {index + 1 || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {userRoles.role_name || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {userRoles.createdBy || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {formatDateToIST(userRoles.createdAt) || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {userRoles.updatedBy || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {formatDateToIST(userRoles.updatedAt) || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {userRoles.status ? (
                                                                        <span className="badge badge-sm bg-gradient-success" style={{ width: '60px', textAlign: 'center' }}>Active</span>
                                                                    ) : (
                                                                        <span className="badge badge-sm bg-gradient-secondary" style={{ width: '60px', textAlign: 'center' }}>De-Active</span>
                                                                    )}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <div className="d-flex justify-content-center align-items-center gap-2">
                                                                    <button className="btn btn-primary mb-0" style={{ padding: '10px' }}
                                                                        onClick={() => {
                                                                            setIsModalEdit(true); // Show the modal
                                                                            setUserRoleEditDetails(userRoles); // Set the selected userRoles's details
                                                                            setOriginalUserRoleDetails(userRoles);
                                                                            setIsFormDirty(false);
                                                                        }}>
                                                                        <i className="fas fa-pen" aria-hidden="true" style={{ color: 'white' }}></i> Edit
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="8" style={{ textAlign: 'center' }}>
                                                            <p>No user role data available.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Pagination */}
                                    {userRolesData && userRolesData.length > 0 && pagination && (
                                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 px-3">
                                            {/* Results info */}
                                            <div className="mb-2 mb-md-0">
                                                <span className="text-sm text-muted">
                                                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalRoles)} of {pagination.totalRoles} roles
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

                    {/* Create Modal */}
                    {isModalCreate && (
                        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1020, }}>
                            <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "10px", width: "400px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", }}>
                                <form className="form" onSubmit={handleUserRoleCreate}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", }}>
                                        <h5 style={{ margin: 0 }}>Create User Role</h5>
                                        <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", }}> &times; </button>
                                    </div>
                                    <div style={{ marginTop: "15px" }}>
                                        <div style={{ marginBottom: "10px" }}>
                                            <select
                                                className="form-control"
                                                value={userRole?.role_name || ""}
                                                onChange={(e) => {
                                                    const selected = predefinedRoles.find(r => r.role_name === e.target.value);
                                                    setUserRole(selected);
                                                }}
                                                required
                                            >
                                                <option value="">-- Select Role --</option>
                                                {predefinedRoles.map((r) => (
                                                    <option key={r.role_id} value={r.role_name}>
                                                        {r.role_name}
                                                    </option>
                                                ))}
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
                                        <button type="submit" className="btn btn-primary mb-0" style={{ padding: '10px' }} >Create</button>
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
                    {isModalEdit && (
                        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1020, }}>
                            <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "10px", width: "400px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", }}>
                                <form className="form" onSubmit={handleEditSubmit}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", }}>
                                        <h5 style={{ margin: 0 }}>Edit User Role</h5>
                                        <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", }}> &times; </button>
                                    </div>
                                    <div style={{ marginTop: "15px" }}>
                                        <div style={{ marginBottom: "10px" }}>
                                            <label>Role Name</label>
                                            <input type="text" name="name" className="form-control" style={{ width: "100%", padding: "8px", margin: "5px 0" }}
                                                value={currentUserRoleDetails.role_name} onChange={(e) => handleInputChange("role_name", sanitizeName(e.target.value))} readOnly required />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: "25px" }}>
                                        <label>Status</label>
                                        <select
                                            className="form-control"
                                            value={currentUserRoleDetails.status}
                                            onChange={(e) => handleInputChange("status", e.target.value === "true")}
                                            required
                                        >
                                            <option value="true">Active</option>
                                            <option value="false">De-Active</option>
                                        </select>
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
                    {/* Footer */}
                    <Footer />
                </div>
            </main>
        </div>
    );
};

export default ManageUserRoles;
