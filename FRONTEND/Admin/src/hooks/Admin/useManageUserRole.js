import { useState } from 'react';
import { showAlertSuccess } from '../../utils/alert';

const useManageUserRole = (userInfo) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;

    const [isModalCreate, setIsModalCreate] = useState(false);
    const [isModalEdit, setIsModalEdit] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [userRolesData, setUserRoleData] = useState([]);
    const [errorUserRole, setErrorUserRole] = useState('');
    const [loading, setLoading] = useState(true);  // Tracks loading state
    const [errorMessageEdit, setErrorMessageEdit] = useState('');
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRoles: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    });

    // Function to fetch user role data
    const fetchUserRoleData = async (page = 1, limit = pagination.limit) => {
        try {
            const response = await fetch(`${API_BASE}/admin/getRoles?page=${page}&limit=${limit}`); // Ensure this matches the server route
            if (response.ok) {
                const data = await response.json();
                setUserRoleData(data.roles);
                setPagination(data.pagination);
                setLoading(false);  // Set loading to false after data is fetched
            } else {
                const errorData = await response.json();
                setErrorUserRole(`${errorData.message}`);
                setLoading(false);  // Set loading to false after an error
            }
        } catch (error) {
            setErrorUserRole('An error occurred while fetching user role.');
            setLoading(false);  // Set loading to false after an error
        }
    };

    // Handle limit change
    const handleLimitChange = (newLimit) => {
        setPagination(prev => ({ ...prev, limit: newLimit }));
        fetchUserRoleData(1, newLimit); // Reset to page 1 when changing limit
    };    

    // Close modal
    const closeModal = () => {
        setIsModalCreate(false); setIsModalEdit(false);
        setUserRole(''); setErrorMessage(''); setErrorUserRole(''); 
        setErrorMessageEdit(''); setLoadingUpdate(false); setLoadingSubmit(false);
    };
    
    const handleUserRoleCreate = async (e) => {
        e.preventDefault();

        if (!userRole) {
            setErrorMessage("Please select a role.");
            return;
        }

        setLoadingSubmit(true);

        try {
            const response = await fetch(`${API_BASE}/admin/createRole`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role_id: userRole.role_id,
                    role_name: userRole.role_name,
                    createdBy: userInfo?.user?.user_email,
                })
            });

            if (response.ok) {
                showAlertSuccess('Role created successfully!');
                closeModal();
                fetchUserRoleData(1); // Go back to first page after creating
            } else {
                const errorData = await response.json();
                setErrorMessage(errorData.message);
            }
        } catch (error) {
            setErrorMessage("Error creating role. Try again.");
        }

        setLoadingSubmit(false);
    };

    return {
        isModalCreate, setIsModalCreate, handleUserRoleCreate, isModalEdit, setIsModalEdit, setUserRole, userRole, closeModal, errorMessage,
        userRolesData, errorUserRole, loading, fetchUserRoleData, errorMessageEdit, setErrorMessageEdit, loadingSubmit, loadingUpdate, setLoadingUpdate,
        pagination, handleLimitChange
    };
};

export default useManageUserRole;
