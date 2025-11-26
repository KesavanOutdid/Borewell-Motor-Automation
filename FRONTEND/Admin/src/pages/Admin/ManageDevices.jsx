import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/Admin/Header';
import Sidebar from '../../components/Admin/Sidebar';
import Footer from '../../components/Admin/Footer';
import { sanitizeSerialNumber } from '../../utils/validation';
import useManageDevices from '../../hooks/Admin/useManageDevices';
import { formatDateToIST } from '../../utils/formatDateToIST';
import { showAlertSuccess } from '../../utils/alert';

const ManageDevices = ({ userInfo, handleLogout }) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;

    const { setIsModalCreate, isModalCreate, setIsModalAssign, isModalAssign, serialNumber, setSerialNumber, errorMessage, successMessage, handleDeviceCreate, closeModal,
        isModalEdit, setIsModalEdit, setIsModalView, isModalView, fetchDeviceData, devices, loading, errorDevice, serialNumberUpdate, deviceStatusUpdate, errorMessageEdit, setErrorMessageEdit,
        users, selecteduser, handleuserSelection, selectedDevices, handleDeviceSelection, handleAssign, assignErrorMessage, loadingSubmit, loadingUpdate, setLoadingUpdate,
        pagination, handlePageChange, handleLimitChange
    } = useManageDevices(userInfo);

    console.log(successMessage);
    const fetchDeviceDataCalled = useRef(false);
    const [deviceDetails, setDeviceDetails] = useState(null);
    const [currentDeviceDetails, setDeviceEditDetails] = useState(null);
    const [originalDeviceDetails, setOriginalDeviceDetails] = useState(null);
    const [isFormDirty, setIsFormDirty] = useState(false);

    // Auto-fetch device data
    useEffect(() => {
        if (!fetchDeviceDataCalled.current) {
            fetchDeviceData();
            fetchDeviceDataCalled.current = true;
        }
    }, [fetchDeviceData]);

    // Populate currentDeviceDetails when editing
    useEffect(() => {
        if (isModalEdit && serialNumberUpdate && deviceStatusUpdate !== undefined) {
            const details = {
                serial_number: serialNumberUpdate,
                status: deviceStatusUpdate ? "true" : "false",
            };
            setDeviceEditDetails(details);
            setOriginalDeviceDetails(details);
            setIsFormDirty(false);
        }
    }, [isModalEdit, serialNumberUpdate, deviceStatusUpdate]); 

    // Handle input changes
    const handleInputChange = (key, value) => {
        setDeviceEditDetails(prev => {
            const updated = { ...prev, [key]: value };
            setIsFormDirty(JSON.stringify(updated) !== JSON.stringify(originalDeviceDetails));
            return updated;
        });
    };

    // Check if form is dirty
    useEffect(() => {
        if (originalDeviceDetails && currentDeviceDetails) {
            const isDirty = Object.keys(originalDeviceDetails).some(key => originalDeviceDetails[key] !== currentDeviceDetails[key]);
            setIsFormDirty(isDirty);
        }
    }, [currentDeviceDetails, originalDeviceDetails]);

    // Handle update submission
    const handleEditSubmit = async (e) => {
        e.preventDefault();

        const sanitizedSerialNumber = sanitizeSerialNumber(currentDeviceDetails.serial_number || "");

        if (!sanitizedSerialNumber.trim()) {
            setErrorMessageEdit('Serial Number is required.');
            setTimeout(() => setErrorMessageEdit(''), 5000);
            return;
        }

        if (sanitizedSerialNumber.length < 17 || sanitizedSerialNumber.length > 20) {
            setErrorMessageEdit('Serial Number must be between 17 to 20 characters.');
            setTimeout(() => setErrorMessageEdit(''), 5000);
            return;
        }

        if (loadingUpdate) return;
        setLoadingUpdate(true);

        try {
            const response = await fetch(`${API_BASE}/admin/updatedDevice`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: currentDeviceDetails._id,
                    serial_number: sanitizedSerialNumber,
                    status: currentDeviceDetails.status === "true",
                    updatedBy: userInfo?.user?.user_email
                }),
            });

            const data = await response.json();  

            if (response.ok) {
                showAlertSuccess('Device updated successfully!');
                closeModal();
                fetchDeviceData();
            } else {
                setErrorMessageEdit(data.message || "Update failed.");
                setTimeout(() => setErrorMessageEdit(''), 5000);
            }

        } catch (error) {
            setErrorMessageEdit('An error occurred during device update. Please try again later.');
            setTimeout(() => setErrorMessageEdit(''), 5000);
        }

        setLoadingUpdate(false);
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
                                    <div className="w-40 text-end d-flex gap-2">
                                        <button className="btn btn-primary mb-0 text-end" style={{ padding: '10px' }} onClick={() => setIsModalCreate(true)}>
                                            <i className="fas fa-file" aria-hidden="true" style={{ color: 'white' }}></i> Create
                                        </button>
                                        <button className="btn bg-gradient-secondary mb-0 text-end" style={{ padding: '10px' }} onClick={() => setIsModalAssign(true)}>
                                            <i className="fas fa-file" aria-hidden="true" style={{ color: 'white' }}></i> Assign Device
                                        </button>
                                    </div>
                                </div>
                                {/* Create Modal */}
                                {isModalCreate && (
                                    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1020, }}>
                                        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "10px", width: "400px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", }}>
                                            <form className="form" onSubmit={handleDeviceCreate}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", }}>
                                                    <h5 style={{ margin: 0 }}>Create Device</h5>
                                                    <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", }}> &times; </button>
                                                </div>
                                                <div style={{ marginTop: "15px" }}>
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <label>Serial Number</label>
                                                        <input type="text" name="name" className="form-control" style={{ width: "100%", padding: "8px", margin: "5px 0" }} placeholder='Eg:SN09875423456789'
                                                            value={serialNumber} onChange={(e) => setSerialNumber(sanitizeSerialNumber(e.target.value))} required />
                                                    </div>
                                                </div>
                                                <div style={{
                                                    marginTop: "20px",
                                                    display: "flex",
                                                    justifyContent: "flex-end",
                                                    gap: "10px"
                                                }}>
                                                    <button className="btn btn-secondary mb-0" style={{ padding: '10px' }} onClick={closeModal}>Close</button>
                                                    <button type="submit" className="btn btn-primary mb-0" style={{ padding: '10px' }} disabled={loadingSubmit}>{loadingSubmit ? "Creating..." : "Create"}</button>
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
                                    {isModalEdit && currentDeviceDetails && (
                                        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1020, }}>
                                            <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "10px", width: "400px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", }}>
                                                <form className="form" onSubmit={handleEditSubmit}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", }}>
                                                        <h5 style={{ margin: 0 }}>Edit Device</h5>
                                                        <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", }}> &times; </button>
                                                    </div>
                                                    <div style={{ marginTop: "15px" }}>
                                                        <div style={{ marginBottom: "10px" }}>
                                                            <label>Serial Number</label>
                                                            <input type="text" name="name" className="form-control" style={{ width: "100%", padding: "8px", margin: "5px 0" }}
                                                                value={currentDeviceDetails.serial_number}
                                                                onChange={(e) => handleInputChange("serial_number", sanitizeSerialNumber(e.target.value))} readOnly={currentDeviceDetails.assign_status === true} required />
                                                        </div>
                                                        <div style={{ marginBottom: "10px" }}>
                                                            <label>Status</label>
                                                            <select name="status" className="form-control" style={{ width: "100%", padding: "8px", margin: "5px 0" }} value={currentDeviceDetails.status}  // ensures value reflects the state correctly
                                                                onChange={(e) => handleInputChange("status", e.target.value)}  // handle change with string values "true" or "false"
                                                                required
                                                            >
                                                                <option value="true">Active</option>
                                                                <option value="false">De-Active</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
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
                                {/* View Modal */}
                                {isModalView && (
                                    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1020 }}>
                                        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "10px", width: "1000px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <h5 style={{ margin: 0 }}>Device Details</h5>
                                                <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", }}> &times; </button>
                                            </div><hr />
                                            <div className="row col-12 col-xl-12 viewDataCss">
                                                {/* Row 1: user Information */}
                                                <div className="col-md-4">
                                                    <div className="form-group row">
                                                        <div className="col-sm-12" style={{ fontWeight: "bold" }}>
                                                            Serial Number: <span style={{ fontWeight: "normal" }}>{deviceDetails.serial_number || '-'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="form-group row">
                                                        <div className="col-sm-12" style={{ fontWeight: "bold" }}>
                                                            Created By: <span style={{ fontWeight: "normal" }}>{deviceDetails.createdBy || '-'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="form-group row">
                                                        <div className="col-sm-12" style={{ fontWeight: "bold" }}>
                                                            Created At: <span style={{ fontWeight: "normal" }}>{formatDateToIST(deviceDetails.createdAt) || '-'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row col-12 col-xl-12 viewDataCss">
                                                {/* Row 2:  Created Info */}
                                                <div className="col-md-4">
                                                    <div className="form-group row">
                                                        <div className="col-sm-12" style={{ fontWeight: "bold" }}>
                                                            Updated By: <span style={{ fontWeight: "normal" }}>{deviceDetails.updatedBy || '-'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="form-group row">
                                                        <div className="col-sm-12" style={{ fontWeight: "bold" }}>
                                                            Updated At: <span style={{ fontWeight: "normal" }}>{formatDateToIST(deviceDetails.updatedAt) || '-'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="form-group row">
                                                        <div className="col-sm-12" style={{ fontWeight: "bold" }}>
                                                            Status: <span
                                                                style={{
                                                                    fontWeight: "normal",
                                                                    color: deviceDetails.status ? 'green' : 'red'
                                                                }}
                                                            >
                                                                {deviceDetails.status ? 'Active' : 'De-Active'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <hr />
                                            <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
                                                <button className="btn btn-secondary mb-0" style={{ padding: '10px' }} onClick={closeModal}>Close</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {/* Assign Modal */}
                                {isModalAssign && (
                                    <div
                                        style={{
                                            position: "fixed",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: "100%",
                                            backgroundColor: "rgba(0,0,0,0.5)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            zIndex: 1020,
                                        }}
                                    >
                                        <div
                                            style={{
                                                backgroundColor: "#fff",
                                                padding: "20px",
                                                borderRadius: "10px",
                                                width: "700px",
                                                maxWidth: "95%",
                                                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                                            }}
                                        >
                                            <form className="form" onSubmit={handleAssign}>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <h5 style={{ margin: 0 }}>Assign Device</h5>
                                                    <button
                                                        onClick={closeModal}
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            fontSize: "18px",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                                <hr />

                                                <div className="row col-12 col-xl-12 viewDataCss">
                                                    {/* Select Customer */}
                                                    <div className="col-md-6">
                                                        <div className="form-group row">
                                                            <div className="col-sm-12" style={{ fontWeight: "bold" }}>
                                                                <label>Select Customer</label>
                                                                <select
                                                                    name="user"
                                                                    className="form-control"
                                                                    style={{ padding: "8px", margin: "5px 0" }}
                                                                    onChange={(e) => handleuserSelection(e.target.value)}
                                                                    value={selecteduser}
                                                                    required
                                                                >
                                                                    <option value="" disabled>
                                                                        Select Customer
                                                                    </option>

                                                                    {users
                                                                        .filter((u) => u.status === true && u.role_id === 2)
                                                                        .map((u) => (
                                                                            <option key={u._id} value={u._id}>
                                                                                {u.user_name} ({u.user_email})
                                                                            </option>
                                                                        ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Select Device */}
                                                    <div className="col-md-6">
                                                        <div className="form-group row">
                                                            <div className="col-sm-12" style={{ fontWeight: "bold" }}>
                                                                <label>Select Device</label>
                                                                <select
                                                                    name="devices"
                                                                    className="form-control"
                                                                    style={{ padding: "8px", margin: "5px 0" }}
                                                                    onChange={(e) => handleDeviceSelection(e.target.value)}
                                                                    value={selectedDevices}
                                                                    required
                                                                >
                                                                    <option value="" disabled>
                                                                        Select Device
                                                                    </option>

                                                                    {devices
                                                                        .filter((d) => d.status === true && d.assign_status === false)
                                                                        .map((d) => (
                                                                            <option key={d._id} value={d.serial_number}>
                                                                                {d.serial_number}
                                                                            </option>
                                                                        ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Display Selected Customer & Device */}
                                                <div className="row col-12 col-xl-12 viewDataCss" style={{ marginTop: "10px" }}>
                                                    {/* Selected Customer */}
                                                    {selecteduser && (
                                                        <div className="col-md-6">
                                                            <label style={{ fontWeight: "bold" }}>Selected Customer</label>
                                                            <p>
                                                                {users.find((u) => u._id === selecteduser)?.user_name ||
                                                                    "Unknown Customer"}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Selected Device */}
                                                    {selectedDevices.length > 0 && (
                                                        <div className="col-md-6">
                                                            <label style={{ fontWeight: "bold" }}>Selected Device</label>
                                                            <p>{selectedDevices}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Footer Buttons */}
                                                <div
                                                    style={{
                                                        marginTop: "20px",
                                                        display: "flex",
                                                        justifyContent: "flex-end",
                                                        gap: "10px",
                                                    }}
                                                >
                                                    <button
                                                        className="btn btn-secondary mb-0"
                                                        style={{ padding: "10px" }}
                                                        onClick={closeModal}
                                                    >
                                                        Close
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="btn btn-primary mb-0"
                                                        style={{ padding: "10px" }}
                                                        disabled={loadingSubmit}
                                                    >
                                                        {loadingSubmit ? "Assigning..." : "Assign"}
                                                    </button>
                                                </div>
                                            </form>

                                            {assignErrorMessage && (
                                                <div className="card-header pb-0 text-left bg-transparent">
                                                    <p className="text-danger text-center">{assignErrorMessage}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                )}
                                <div className="card-body px-0 pt-0 pb-2">
                                    <div className="table-responsive p-0" style={{ maxHeight: '500px', overflowY: 'scroll' }}>
                                        <table className="table align-items-center mb-0" >
                                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa' }}>
                                                <tr>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">S.No</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Serial Number</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Assign Device By</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Assign Status</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Device Status</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Option</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan="6" style={{ textAlign: 'center' }}>
                                                            <p>Loading...</p>
                                                        </td>
                                                    </tr>
                                                ) : errorDevice ? (
                                                    <tr>
                                                        <td colSpan="6" style={{ textAlign: 'center', color: 'red' }}>
                                                            <p>{errorDevice}</p>
                                                        </td>
                                                    </tr>
                                                ) : devices && devices.length > 0 ? (
                                                    devices.map((device, index) => (
                                                        <tr key={device._id}>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {index + 1 || '-'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {device.serial_number || '-'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {device?.user_details?.user_name || '-'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {device.assign_status ? (
                                                                        <span className="badge badge-sm bg-gradient-success" style={{ width: '60px', textAlign: 'center' }}>Assign</span>
                                                                    ) : (
                                                                        <span className="badge badge-sm bg-gradient-secondary" style={{ width: '70px', textAlign: 'center' }}>Un-Assign</span>
                                                                    )}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {device.status ? (
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
                                                                            setDeviceEditDetails(device); // Set the selected device's details
                                                                        }}>
                                                                        <i className="fas fa-pen" aria-hidden="true" style={{ color: 'white' }}></i> Edit
                                                                    </button>
                                                                    <button className="btn btn-success mb-0" style={{ padding: '10px' }} onClick={() => {
                                                                        setIsModalView(true); // Show the modal
                                                                        setDeviceDetails(device); // Set the selected device's details
                                                                    }}>
                                                                        <i className="fas fa-eye" aria-hidden="true" style={{ color: 'white' }}></i> View
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6" style={{ textAlign: 'center' }}>
                                                            <p>No device data available.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {devices && devices.length > 0 && pagination && (
                                    // {devices && devices.length > 0 && (
                                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 px-3">
                                            {/* Results info */}
                                            <div className="mb-2 mb-md-0">
                                                <span className="text-sm text-muted">
                                                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalDevices)} of {pagination.totalDevices} devices
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
                                                <nav aria-label="Device pagination">
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
                                                                <li key={pageNum} className={`page-item ${pageNum === pagination.currentPage ? 'active' : ''}`}>
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

                    <div className="row mt-4">
                        <div className="col-lg-5 mb-lg-0 mb-4">
                            <div className="card z-index-2">
                                <div className="card-body p-3">
                                    <div className="bg-gradient-dark border-radius-lg py-3 pe-1 mb-3">
                                        <div className="chart">
                                            <canvas id="chart-bars" className="chart-canvas" height="200"></canvas>
                                        </div>
                                    </div>
                                    <h6 className="ms-2 mt-4 mb-0">Active Device: <span className="font-weight-bolder">{devices.filter(device => device.device_status === true).length}</span></h6>
                                    <h6 className="ms-2 mt-3 mb-0">De-Active Device: <span className="font-weight-bolder">{devices.filter(device => device.device_status === false).length}</span></h6>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-7">
                            <div className="card z-index-2">
                                <div className="card-header pb-0">
                                    <div className="d-flex flex-wrap">
                                        <p className="text-sm me-3">
                                            <i className="fa fa-arrow-up text-success"></i>
                                            <span className="font-weight-bold"> Total Device: {pagination.totalDevices}</span>
                                        </p>
                                        <p className="text-sm me-3">
                                            <i className="fa fa-check text-success"></i>
                                            <span className="font-weight-bold"> Active Device: {devices.filter(device => device.device_status === true).length} </span>
                                        </p>
                                        <p className="text-sm">
                                            <i className="fa fa-times text-danger"></i>
                                            <span className="font-weight-bold"> De-Active Device: {devices.filter(device => device.device_status === false).length}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="card-body p-3">
                                    <div className="chart">
                                        <canvas id="chart-line" className="chart-canvas" height="260"></canvas>
                                    </div>
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

export default ManageDevices;
