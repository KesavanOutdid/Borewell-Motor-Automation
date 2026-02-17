import { useState, useCallback } from 'react';
import { showAlertSuccess, showDeleteConfirmation, showAlertError } from '../../utils/alert';

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

    const fetchVoucherData = useCallback(async (page = 1, limit = 10, search = '') => {
        try {
            setLoadingVouchers(true);
            const params = new URLSearchParams({ page, limit });
            if (search) params.append('search', search);
            
            const response = await fetch(
                `${API_BASE}/app/getAllVouchers?${params.toString()}`,
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
    }, [API_BASE, userInfo.token]);

    const fetchVoucherById = useCallback(async (id) => {
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
    }, [API_BASE, userInfo.token]);

    const closeModal = useCallback(() => {
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
    }, []);

    const handleVoucherCreate = useCallback(async (e) => {
        e.preventDefault();

        if (!voucherCode.trim()) return setErrorMessage('Voucher code is required');
        if (!discountPercentage) return setErrorMessage('Discount percentage is required');
        if (!startDate) return setErrorMessage('Start date is required');
        if (!endDate) return setErrorMessage('End date is required');
        if (!description.trim()) return setErrorMessage('Description is required');
        if (maxUsage === '' || maxUsage === null) return setErrorMessage('Max usage is required');

        if (new Date(startDate) >= new Date(endDate))
            return setErrorMessage('Start date must be before end date');

        if (isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 100)
            return setErrorMessage('Discount percentage must be a number between 0-100');

        if (maxUsage !== '' && maxUsage !== null && (isNaN(maxUsage) || maxUsage < 1))
            return setErrorMessage('Max usage must be a number at least 1');

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
            setLoadingSubmit(false);
            return true;
        } catch (err) {
            console.log('Create Voucher Error:', err);
            setErrorMessage('Error creating voucher.');
            setLoadingSubmit(false);
            return false;
        }
    }, [API_BASE, userInfo, voucherCode, discountPercentage, startDate, endDate, maxUsage, description, loadingSubmit, fetchVoucherData, closeModal]);

    const handleVoucherUpdate = useCallback(async (e) => {
        e.preventDefault();

        if (!currentVoucherDetails._id) {
            setErrorMessageEdit('Voucher ID is missing');
            return;
        }

        if (!currentVoucherDetails.voucher_code?.trim()) {
            return setErrorMessageEdit('Voucher code is required');
        }

        if (currentVoucherDetails.discount_percentage === '' || currentVoucherDetails.discount_percentage === null) {
            return setErrorMessageEdit('Discount percentage is required');
        }

        if (!currentVoucherDetails.start_date) {
            return setErrorMessageEdit('Start date is required');
        }

        if (!currentVoucherDetails.end_date) {
            return setErrorMessageEdit('End date is required');
        }

        if (!currentVoucherDetails.description?.trim()) {
            return setErrorMessageEdit('Description is required');
        }

        if (currentVoucherDetails.max_usage === '' || currentVoucherDetails.max_usage === null) {
            return setErrorMessageEdit('Max usage is required');
        }

        if (new Date(currentVoucherDetails.start_date) >= new Date(currentVoucherDetails.end_date))
            return setErrorMessageEdit('Start date must be before end date');

        if (isNaN(currentVoucherDetails.discount_percentage) || currentVoucherDetails.discount_percentage < 0 || currentVoucherDetails.discount_percentage > 100)
            return setErrorMessageEdit('Discount percentage must be a number between 0-100');

        if (currentVoucherDetails.max_usage !== '' && currentVoucherDetails.max_usage !== null && (isNaN(currentVoucherDetails.max_usage) || currentVoucherDetails.max_usage < 1))
            return setErrorMessageEdit('Max usage must be a number at least 1');

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
                    used_count: currentVoucherDetails.used_count,
                    description: currentVoucherDetails.description,
                    status: currentVoucherDetails.status,
                    updatedBy: userInfo?.user?.user_email
                })
            });

            const res = await response.json();

            if (!response.ok) {
                setErrorMessageEdit(res.message || 'Error updating voucher');
                setLoadingUpdate(false);
                return false;
            }

            showAlertSuccess('Voucher updated successfully!');
            fetchVoucherData(pagination.currentPage, pagination.limit);
            // Don't call closeModal() here if we want to stay on the edit page with data
            // closeModal();
            setLoadingUpdate(false);
            return true;
        } catch (err) {
            console.log('Update Voucher Error:', err);
            setErrorMessageEdit('Error updating voucher.');
            setLoadingUpdate(false);
            return false;
        }
    }, [API_BASE, userInfo, currentVoucherDetails, loadingUpdate, fetchVoucherData, pagination.currentPage, pagination.limit]);

    const handleVoucherDelete = useCallback(async (id, voucherCode) => {
        const result = await showDeleteConfirmation(voucherCode, 'voucher');
        if (!result.isConfirmed) return;

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
                showAlertError(res.message || 'Error deleting voucher');
                return;
            }

            showAlertSuccess('Voucher deleted successfully!');
            fetchVoucherData(pagination.currentPage, pagination.limit);
        } catch (err) {
            console.log('Delete Voucher Error:', err);
            showAlertError('Error deleting voucher');
        }
    }, [API_BASE, userInfo.token, fetchVoucherData, pagination.currentPage, pagination.limit]);

    const handlePageChange = useCallback((newPage, searchQuery = '') => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchVoucherData(newPage, pagination.limit, searchQuery);
        }
    }, [pagination.totalPages, pagination.limit, fetchVoucherData]);

    const handleLimitChange = useCallback((newLimit, searchQuery = '') => {
        fetchVoucherData(1, newLimit, searchQuery);
    }, [fetchVoucherData]);

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
