import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Admin/Header';
import Sidebar from '../../components/Admin/Sidebar';
import Footer from '../../components/Admin/Footer';
import useManageVouchers from '../../hooks/Admin/useManageVouchers';

const AddVoucher = ({ userInfo, handleLogout }) => {
    const navigate = useNavigate();
    const {
        voucherCode,
        setVoucherCode,
        discountPercentage,
        setDiscountPercentage,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        maxUsage,
        setMaxUsage,
        description,
        setDescription,
        errorMessage,
        handleVoucherCreate,
        loadingSubmit
    } = useManageVouchers(userInfo);

    const today = new Date().toISOString().split('T')[0];

    const isFormValid = 
        voucherCode.trim() && 
        discountPercentage !== '' && 
        startDate && 
        endDate && 
        description.trim() &&
        maxUsage !== '';

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
                                    <h6 className="mb-0">Create New Voucher</h6>
                                </div>

                                <div className="card-body">
                                    {errorMessage && (
                                        <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                            {errorMessage}
                                            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                        </div>
                                    )}

                                    <form onSubmit={handleVoucherCreate}>
                                        <div className="row">
                                            <div className="col-md-6 col-12">
                                                <label className="form-label">Voucher Code</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="e.g., SAVE20"
                                                    value={voucherCode}
                                                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                                    required
                                                />
                                                <small className="text-muted">Code will be automatically converted to uppercase</small>
                                            </div>

                                            <div className="col-md-6 col-12">
                                                <label className="form-label">Discount Percentage (%)</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    placeholder="e.g., 20"
                                                    value={discountPercentage}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === '') {
                                                            setDiscountPercentage('');
                                                        } else {
                                                            const parsed = parseInt(val, 10);
                                                            setDiscountPercentage(isNaN(parsed) ? '' : parsed);
                                                        }
                                                    }}
                                                    onFocus={(e) => {
                                                        if (e.target.value === '0') setDiscountPercentage('');
                                                    }}
                                                    min="0"
                                                    max="100"
                                                    required
                                                />
                                                <small className="text-muted">Must be between 0-100</small>
                                            </div>
                                        </div>

                                        <div className="row mt-3">
                                            <div className="col-md-6 col-12">
                                                <label className="form-label">Start Date</label>
                                                <input
                                                    type="datetime-local"
                                                    className="form-control"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    min={today}
                                                    required
                                                />
                                            </div>

                                            <div className="col-md-6 col-12">
                                                <label className="form-label">End Date</label>
                                                <input
                                                    type="datetime-local"
                                                    className="form-control"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    min={today}
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
                                                    placeholder="e.g., 100"
                                                    value={maxUsage}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === '') {
                                                            setMaxUsage('');
                                                        } else {
                                                            const parsed = parseInt(val, 10);
                                                            setMaxUsage(isNaN(parsed) ? '' : parsed);
                                                        }
                                                    }}
                                                    onFocus={(e) => {
                                                        if (e.target.value === '0') setMaxUsage('');
                                                    }}
                                                    min="1"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="row mt-3">
                                            <div className="col-12">
                                                <label className="form-label">Description</label>
                                                <textarea
                                                    className="form-control"
                                                    rows="3"
                                                    placeholder="e.g., 20% discount on all products"
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    required
                                                ></textarea>
                                            </div>
                                        </div>

                                        <div className="row mt-4">
                                            <div className="col-12">
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary me-2"
                                                    disabled={loadingSubmit || !isFormValid}
                                                >
                                                    {loadingSubmit ? 'Creating...' : 'Create Voucher'}
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

export default AddVoucher;
