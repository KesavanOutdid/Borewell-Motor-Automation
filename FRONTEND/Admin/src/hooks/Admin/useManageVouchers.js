import { useState } from 'react';
import { showAlertSuccess } from '../../utils/alert';

const useManageVouchers = (userInfo) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;

    const [isModalCreate, setIsModalCreate] = useState(false);
    const [isModalEdit, setIsModalEdit] = useState(false);
    const [isModalView, setIsModalView] = useState(false);

    const [voucherCode, setVoucherCode] = useState('');
    const [discountPercentage, setDiscountPercentage] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [maxUsage, setMaxUsage] = useState('');
    const [description, setDescription] = useState('');

    const [errorMessage, setErrorMessage] = useState('');
    const [vouchers, setVouchers] = useState([]);
    const [errorVouchers, setErrorVouchers] = useState('');
    const [loadingVouchers, setLoadingVouchers] = useState(true);

    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalVouchers: 0,
        totalActiveVouchers: 0,
        totalInactiveVouchers: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    });

    const [errorMessageEdit, setErrorMessageEdit] = useState('');
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [currentVoucherDetails, setCurrentVoucherDetails] = useState(null);

    const fetchVoucherData = async (page = 1, limit = 10) => {
        try {
            setLoadingVouchers(true);
            const response = await fetch(
                `${API_BASE}/app/getAllVouchers?page=${page}&limit=${limit}`,
                {
                    headers: {
                        'Authorization': `Bearer ${userInfo.token}`
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setVouchers(data.data);
                setPagination(data.pagination);
                setLoadingVouchers(false);
            } else {
                const errorData = await response.json();
                setErrorVouchers(errorData.message || 'Error fetching vouchers');
                setLoadingVouchers(false);
            }
        } catch (error) {
            console.error('Fetch Vouchers Error:', error);
            setErrorVouchers('An error occurred while fetching vouchers.');
            setLoadingVouchers(false);
        }
    };

    const fetchVoucherById = async (id) => {
        try {
            const response = await fetch(`${API_BASE}/app/getVoucherById?id=${id}`, {
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.data;
            } else {
                const errorData = await response.json();
                setErrorMessageEdit(errorData.message || 'Error fetching voucher');
                return null;
            }
        } catch (error) {
            console.error('Fetch Voucher Error:', error);
            setErrorMessageEdit('An error occurred while fetching voucher.');
            return null;
        }
    };

    const closeModal = () => {
        setIsModalCreate(false);
        setIsModalEdit(false);
        setIsModalView(false);
        setVoucherCode('');
        setDiscountPercentage('');
        setStartDate('');
        setEndDate('');
        setMaxUsage('');
        setDescription('');
        setErrorMessage('');
        setErrorMessageEdit('');
        setLoadingSubmit(false);
        setLoadingUpdate(false);
        setCurrentVoucherDetails(null);
    };

    const handleVoucherCreate = async (e) => {
        e.preventDefault();

        if (!voucherCode.trim()) return setErrorMessage('Voucher code is required');
        if (!discountPercentage) return setErrorMessage('Discount percentage is required');
        if (!startDate) return setErrorMessage('Start date is required');
        if (!endDate) return setErrorMessage('End date is required');

        if (new Date(startDate) >= new Date(endDate))
            return setErrorMessage('Start date must be before end date');

        if (discountPercentage < 0 || discountPercentage > 100)
            return setErrorMessage('Discount percentage must be between 0-100');

        if (loadingSubmit) return;
        setLoadingSubmit(true);

        try {
            const response = await fetch(`${API_BASE}/app/createVoucher`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({
                    voucher_code: voucherCode.trim().toUpperCase(),
                    discount_percentage: parseInt(discountPercentage),
                    start_date: startDate,
                    end_date: endDate,
                    max_usage: maxUsage ? parseInt(maxUsage) : null,
                    description: description.trim() || null,
                    createdBy: userInfo?.user?.user_email
                })
            });

            const res = await response.json();

            if (!response.ok) {
                setErrorMessage(res.message || 'Error creating voucher');
                setLoadingSubmit(false);
                return;
            }

            showAlertSuccess('Voucher created successfully!');
            fetchVoucherData();
            closeModal();
        } catch (err) {
            console.log('Create Voucher Error:', err);
            setErrorMessage('Error creating voucher.');
        }

        setLoadingSubmit(false);
    };

    const handleVoucherUpdate = async (e) => {
        e.preventDefault();

        if (!currentVoucherDetails._id) {
            setErrorMessageEdit('Voucher ID is missing');
            return;
        }

        if (!currentVoucherDetails.voucher_code?.trim()) {
            return setErrorMessageEdit('Voucher code is required');
        }

        if (new Date(currentVoucherDetails.start_date) >= new Date(currentVoucherDetails.end_date))
            return setErrorMessageEdit('Start date must be before end date');

        if (loadingUpdate) return;
        setLoadingUpdate(true);

        try {
            const response = await fetch(`${API_BASE}/app/updateVoucher`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({
                    id: currentVoucherDetails._id,
                    voucher_code: currentVoucherDetails.voucher_code,
                    discount_percentage: currentVoucherDetails.discount_percentage,
                    start_date: currentVoucherDetails.start_date,
                    end_date: currentVoucherDetails.end_date,
                    max_usage: currentVoucherDetails.max_usage,
                    description: currentVoucherDetails.description,
                    status: currentVoucherDetails.status,
                    updatedBy: userInfo?.user?.user_email
                })
            });

            const res = await response.json();

            if (!response.ok) {
                setErrorMessageEdit(res.message || 'Error updating voucher');
                setLoadingUpdate(false);
                return;
            }

            showAlertSuccess('Voucher updated successfully!');
            fetchVoucherData(pagination.currentPage, pagination.limit);
            closeModal();
        } catch (err) {
            console.log('Update Voucher Error:', err);
            setErrorMessageEdit('Error updating voucher.');
        }

        setLoadingUpdate(false);
    };

    const handleVoucherDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this voucher?')) return;

        try {
            const response = await fetch(`${API_BASE}/app/deleteVoucher`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ id })
            });

            const res = await response.json();

            if (!response.ok) {
                alert(res.message || 'Error deleting voucher');
                return;
            }

            showAlertSuccess('Voucher deleted successfully!');
            fetchVoucherData(pagination.currentPage, pagination.limit);
        } catch (err) {
            console.log('Delete Voucher Error:', err);
            alert('Error deleting voucher');
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchVoucherData(newPage, pagination.limit);
        }
    };

    const handleLimitChange = (newLimit) => {
        fetchVoucherData(1, newLimit);
    };

    return {
        isModalCreate,
        setIsModalCreate,
        isModalEdit,
        setIsModalEdit,
        isModalView,
        setIsModalView,
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
        setErrorMessage,
        vouchers,
        setVouchers,
        errorVouchers,
        loadingVouchers,
        pagination,
        handlePageChange,
        handleLimitChange,
        handleVoucherCreate,
        handleVoucherUpdate,
        handleVoucherDelete,
        errorMessageEdit,
        setErrorMessageEdit,
        loadingSubmit,
        loadingUpdate,
        setLoadingUpdate,
        currentVoucherDetails,
        setCurrentVoucherDetails,
        fetchVoucherById,
        fetchVoucherData,
        closeModal
    };
};

export default useManageVouchers;
