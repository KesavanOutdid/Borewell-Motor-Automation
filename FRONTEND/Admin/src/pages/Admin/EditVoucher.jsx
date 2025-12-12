import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Admin/Header';
import Sidebar from '../../components/Admin/Sidebar';
import Footer from '../../components/Admin/Footer';
import useManageVouchers from '../../hooks/Admin/useManageVouchers';

const EditVoucher = ({ userInfo, handleLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { voucher } = location.state || {};
    const [isLoading, setIsLoading] = useState(!voucher);

    const {
        errorMessageEdit,
        currentVoucherDetails,
        setCurrentVoucherDetails,
        fetchVoucherById,
        handleVoucherUpdate,
        loadingUpdate
    } = useManageVouchers(userInfo);

    const loadVoucherData = useCallback(async () => {
        if (voucher) {
            setCurrentVoucherDetails({
                _id: voucher._id,
                voucher_code: voucher.voucher_code,
                discount_percentage: voucher.discount_percentage,
                start_date: voucher.start_date,
                end_date: voucher.end_date,
                max_usage: voucher.max_usage,
                description: voucher.description,
                status: voucher.status,
                used_count: voucher.used_count
            });
            setIsLoading(false);
        } else if (location.state?.id) {
            const data = await fetchVoucherById(location.state.id);
            if (data) {
                setCurrentVoucherDetails({
                    _id: data._id,
                    voucher_code: data.voucher_code,
                    discount_percentage: data.discount_percentage,
                    start_date: data.start_date,
                    end_date: data.end_date,
                    max_usage: data.max_usage,
                    description: data.description,
                    status: data.status,
                    used_count: data.used_count
                });
            }
            setIsLoading(false);
        } else {
            navigate('/admin/manage-vouchers');
        }
    }, [voucher, location.state?.id, fetchVoucherById, setCurrentVoucherDetails, navigate]);

    useEffect(() => {
        loadVoucherData();
    }, [loadVoucherData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCurrentVoucherDetails(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'discount_percentage' || name === 'max_usage' ? (value ? parseInt(value) : '') : value)
        }));
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    if (isLoading) {
        return (
            <div style={{ paddingTop: '15px' }}>
                <Sidebar />
                <main className="main-content position-relative h-100 mt-1 border-radius-lg">
                    <Header userInfo={userInfo} handleLogout={handleLogout} />
                    <div className="container-fluid py-4" style={{ textAlign: 'center', padding: '40px' }}>
                        <p>Loading voucher...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!currentVoucherDetails) {
        return (
            <div style={{ paddingTop: '15px' }}>
                <Sidebar />
                <main className="main-content position-relative h-100 mt-1 border-radius-lg">
                    <Header userInfo={userInfo} handleLogout={handleLogout} />
                    <div className="container-fluid py-4" style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                        <p>Voucher not found</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div style={{ paddingTop: '15px' }}>
            <Sidebar />
            <main className="main-content position-relative h-100 mt-1 border-radius-lg">
                <Header userInfo={userInfo} handleLogout={handleLogout} />
                <div className="container-fluid py-4">
                    <div className="row">
                        <div className="col-md-12 col-12 mx-auto">
                            <div className="card">
                                <div className="card-header pb-3">
                                    <h6 className="mb-0">Edit Voucher - {currentVoucherDetails.voucher_code}</h6>
                                </div>

                                <div className="card-body">
                                    {errorMessageEdit && (
                                        <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                            {errorMessageEdit}
                                            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                        </div>
                                    )}

                                    <form onSubmit={handleVoucherUpdate}>
                                        <div className="row">
                                            <div className="col-md-6 col-12">
                                                <label className="form-label">Voucher Code</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="voucher_code"
                                                    value={currentVoucherDetails.voucher_code}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>

                                            <div className="col-md-6 col-12">
                                                <label className="form-label">Discount Percentage (%)</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    name="discount_percentage"
                                                    value={currentVoucherDetails.discount_percentage}
                                                    onChange={handleChange}
                                                    min="0"
                                                    max="100"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="row mt-3">
                                            <div className="col-md-6 col-12">
                                                <label className="form-label">Start Date</label>
                                                <input
                                                    type="datetime-local"
                                                    className="form-control"
                                                    name="start_date"
                                                    value={formatDateForInput(currentVoucherDetails.start_date)}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>

                                            <div className="col-md-6 col-12">
                                                <label className="form-label">End Date</label>
                                                <input
                                                    type="datetime-local"
                                                    className="form-control"
                                                    name="end_date"
                                                    value={formatDateForInput(currentVoucherDetails.end_date)}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="row mt-3">
                                            <div className="col-md-6 col-12">
                                                <label className="form-label">Max Usage</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    name="max_usage"
                                                    value={currentVoucherDetails.max_usage || ''}
                                                    onChange={handleChange}
                                                    min="1"
                                                />
                                                <small className="text-muted">Leave empty for unlimited usage</small>
                                            </div>

                                            <div className="col-md-6 col-12">
                                                <label className="form-label">Usage Count</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={currentVoucherDetails.used_count || 0}
                                                    disabled
                                                />
                                                <small className="text-muted">Read-only field</small>
                                            </div>
                                        </div>

                                        <div className="row mt-3">
                                            <div className="col-12">
                                                <label className="form-label">Description</label>
                                                <textarea
                                                    className="form-control"
                                                    rows="3"
                                                    name="description"
                                                    value={currentVoucherDetails.description || ''}
                                                    onChange={handleChange}
                                                ></textarea>
                                            </div>
                                        </div>

                                        <div className="row mt-3">
                                            <div className="col-12">
                                                <div className="form-check">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id="voucherStatus"
                                                        name="status"
                                                        checked={currentVoucherDetails.status}
                                                        onChange={handleChange}
                                                    />
                                                    <label className="form-check-label" htmlFor="voucherStatus">
                                                        Active/Inactive
                                                    </label>
                                                </div>
                                                <small className="text-muted">
                                                    Status: {currentVoucherDetails.status ? 'Active' : 'Inactive'}
                                                </small>
                                            </div>
                                        </div>

                                        <div className="row mt-4">
                                            <div className="col-12">
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary me-2"
                                                    disabled={loadingUpdate}
                                                >
                                                    {loadingUpdate ? 'Updating...' : 'Update Voucher'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    onClick={() => navigate('/admin/manage-vouchers')}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </form>
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

export default EditVoucher;
