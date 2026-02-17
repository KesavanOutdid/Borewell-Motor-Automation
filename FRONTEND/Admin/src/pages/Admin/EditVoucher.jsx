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
    const [initialVoucherDetails, setInitialVoucherDetails] = useState(null);

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
            const data = {
                _id: voucher._id,
                voucher_code: voucher.voucher_code,
                discount_percentage: voucher.discount_percentage,
                start_date: voucher.start_date,
                end_date: voucher.end_date,
                max_usage: voucher.max_usage,
                description: voucher.description,
                status: voucher.status,
                used_count: voucher.used_count
            };
            setCurrentVoucherDetails(data);
            setInitialVoucherDetails(data);
            setIsLoading(false);
        } else if (location.state?.id) {
            const data = await fetchVoucherById(location.state.id);
            if (data) {
                const voucherData = {
                    _id: data._id,
                    voucher_code: data.voucher_code,
                    discount_percentage: data.discount_percentage,
                    start_date: data.start_date,
                    end_date: data.end_date,
                    max_usage: data.max_usage,
                    description: data.description,
                    status: data.status,
                    used_count: data.used_count
                };
                setCurrentVoucherDetails(voucherData);
                setInitialVoucherDetails(voucherData);
            }
            setIsLoading(false);
        } else {
            navigate('/manage-vouchers');
        }
    }, [voucher, location.state?.id, fetchVoucherById, setCurrentVoucherDetails, navigate]);

    useEffect(() => {
        loadVoucherData();
    }, [loadVoucherData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let finalValue = type === 'checkbox' ? checked : value;

        if (name === 'status') {
            finalValue = value === 'true';
        }

        if (name === 'discount_percentage' || name === 'max_usage' || name === 'used_count') {
            if (value === '') {
                finalValue = '';
            } else {
                // Parse to integer to remove leading zeros
                finalValue = parseInt(value, 10);
                if (isNaN(finalValue)) finalValue = '';
            }
        }

        setCurrentVoucherDetails(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };

    const handleFocus = (e) => {
        const { name, value } = e.target;
        if (value === '0' && (name === 'discount_percentage' || name === 'max_usage' || name === 'used_count')) {
            setCurrentVoucherDetails(prev => ({
                ...prev,
                [name]: ''
            }));
        }
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

    const isModified = initialVoucherDetails && currentVoucherDetails && (
        currentVoucherDetails.voucher_code !== initialVoucherDetails.voucher_code ||
        currentVoucherDetails.discount_percentage !== initialVoucherDetails.discount_percentage ||
        formatDateForInput(currentVoucherDetails.start_date) !== formatDateForInput(initialVoucherDetails.start_date) ||
        formatDateForInput(currentVoucherDetails.end_date) !== formatDateForInput(initialVoucherDetails.end_date) ||
        (currentVoucherDetails.max_usage || '') !== (initialVoucherDetails.max_usage || '') ||
        (currentVoucherDetails.used_count || 0) !== (initialVoucherDetails.used_count || 0) ||
        (currentVoucherDetails.description || '') !== (initialVoucherDetails.description || '') ||
        currentVoucherDetails.status !== initialVoucherDetails.status
    );

    const isRequiredFieldsFilled = 
        currentVoucherDetails?.voucher_code?.trim() && 
        currentVoucherDetails?.discount_percentage !== '' && 
        currentVoucherDetails?.start_date && 
        currentVoucherDetails?.end_date &&
        currentVoucherDetails?.description?.trim() &&
        currentVoucherDetails?.max_usage !== '' &&
        currentVoucherDetails?.used_count !== '';

    const onUpdate = async (e) => {
        const success = await handleVoucherUpdate(e);
        if (success) {
            setInitialVoucherDetails({ ...currentVoucherDetails });
            navigate('/manage-vouchers');
        }
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
                                <div className="card-header pb-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h6 className="mb-0">Edit Voucher - {currentVoucherDetails.voucher_code}</h6>
                                    <button 
                                        className="btn btn-sm mb-0"
                                        style={{ 
                                            backgroundColor: '#67748e', 
                                            color: 'white',
                                            padding: '8px 16px',
                                            fontSize: '13px'
                                        }}
                                        onClick={() => navigate('/manage-vouchers')}
                                    >
                                        <i className="fas fa-arrow-left me-2"></i>Back
                                    </button>
                                </div>

                                <div className="card-body">
                                    {errorMessageEdit && (
                                        <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                            {errorMessageEdit}
                                            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                        </div>
                                    )}

                                    <form onSubmit={onUpdate}>
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
                                                    readOnly
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
                                                    onFocus={handleFocus}
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
                                            <div className="col-md-4 col-12">
                                                <label className="form-label">Max Usage</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    name="max_usage"
                                                    value={currentVoucherDetails.max_usage || ''}
                                                    onChange={handleChange}
                                                    onFocus={handleFocus}
                                                    min="1"
                                                    required
                                                />
                                            </div>

                                            <div className="col-md-4 col-12">
                                                <label className="form-label">Usage Count</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    name="used_count"
                                                    value={currentVoucherDetails.used_count === 0 ? '0' : (currentVoucherDetails.used_count || '')}
                                                    onChange={handleChange}
                                                    onFocus={handleFocus}
                                                    required
                                                />
                                                <small className="text-muted">Usage count of the voucher</small>
                                            </div>

                                            <div className="col-md-4 col-12">
                                                <label className="form-label">Status</label>
                                                <select
                                                    className="form-control"
                                                    name="status"
                                                    value={currentVoucherDetails.status.toString()}
                                                    onChange={handleChange}
                                                >
                                                    <option value="true">Active</option>
                                                    <option value="false">Inactive</option>
                                                </select>
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
                                                    required
                                                ></textarea>
                                            </div>
                                        </div>

                                        <div className="row mt-4">
                                            <div className="col-12">
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary me-2"
                                                    disabled={loadingUpdate || !isModified || !isRequiredFieldsFilled}
                                                >
                                                    {loadingUpdate ? 'Updating...' : 'Update Voucher'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    onClick={() => navigate('/manage-vouchers')}
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
