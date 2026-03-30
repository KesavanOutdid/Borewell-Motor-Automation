import { useState } from 'react';
import { sanitizeName, sanitizeMobile, sanitizeEmail, sanitizePassword, validateEmail } from '../../../utils/validation';
import { showAlertSuccess } from '../../../utils/alert';

const useManageUsers = (userInfo) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;

    const [isModalCreate, setIsModalCreate] = useState(false);
    const [isModalEdit, setIsModalEdit] = useState(false);
    const [isModalView, setIsModalView] = useState(false);
    const [selectedUserRoleId, setSelectedUserRoleId] = useState('');
    const [selectedUserRoleName, setSelectedUserRoleName] = useState(null);
    const [selectedClientId, setSelectedClientId] = useState(null);
    const [selectedClientName, setSelectedClientName] = useState(null);
    const [userName, setUserName] = useState(''); 
    const [userMobile, setUserMobile] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userPassword, setUserPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [users, setUsers] = useState([]);
    const [errorUsers, setErrorUsers] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    }); 
    const [errorMessageEdit, setErrorMessageEdit] = useState('');
    const [userRolesData, setUserRoleData] = useState([]);
    const [errorUserRole, setErrorUserRole] = useState('');
    const [loadingUserRole, setLoadingUserRole] = useState(true);  
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedUserName, setSelectedUserName] = useState(null);
    const [selectedUserEmail, setSelectedUserEmial] = useState(null);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [currentUserDetails, setCurrentUserDetails] = useState(null);

    // Function to fetch user role data
    const fetchUserRoleData = async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/getRoles`); // Ensure this matches the server route
            if (response.ok) {
                const data = await response.json();
                setUserRoleData(data.roles); // Update state with fetched data
                setLoadingUserRole(false);  // Set loading to false after data is fetched
            } else {
                const errorData = await response.json();
                setErrorUserRole(`${errorData.message}`);
                setLoadingUserRole(false);  // Set loading to false after an error
            }
        } catch (error) {
            setErrorUserRole('An error occurred while fetching user role.');
            setLoadingUserRole(false);  // Set loading to false after an error
        }
    };          

    // Function to fetch user data with pagination
    const fetchUserData = async (page = 1, limit = 10, search = '') => {
        try {
            setLoadingUsers(true);
            const params = new URLSearchParams({ page, limit });
            if (search && search.trim() !== '') {
                params.append('search', search.trim());
            }
            
            const response = await fetch(`${API_BASE}/admin/getUsers?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users);
                setPagination(data.pagination);
                setLoadingUsers(false);
            } else {
                const errorData = await response.json();
                setErrorUsers(`${errorData.message}`);
                setLoadingUsers(false);
            }
        } catch (error) {
            setErrorUsers('An error occurred while fetching users.');
            setLoadingUsers(false);
        }
    };  

    // Close modal
    const closeModal = () => {
        setIsModalCreate(false);
        setIsModalEdit(false);
        setIsModalView(false);
        setUserName(''); setUserMobile(''); setUserEmail(''); setUserPassword('');
        setSelectedUserRoleId(''); setSelectedUserRoleName('');setSelectedClientId(''); 
        setSelectedClientName(''); setErrorMessage(''); setErrorUsers(''); 
        setErrorMessageEdit(''); setErrorUserRole('');
        setSelectedUserId('');setSelectedUserName(''); setSelectedUserEmial('');
        setLoadingSubmit(false); setLoadingUpdate(false);
    };

    const handleUserCreate = async (e) => {
        e.preventDefault();

        const sanitizedName = sanitizeName(userName);
        const sanitizedMobile = sanitizeMobile(userMobile);
        const sanitizedEmail = sanitizeEmail(userEmail);
        const sanitizedPassword = sanitizePassword(userPassword);

        if (!sanitizedName) return setErrorMessage("Name required");
        if (sanitizedMobile.length !== 10) return setErrorMessage("Mobile must be 10 digits");
        if (!validateEmail(sanitizedEmail)) return setErrorMessage("Enter a valid email address");
        if (sanitizedPassword.length !== 6) return setErrorMessage("Password must be 6 digits");

        if (loadingSubmit) return;
        setLoadingSubmit(true);

        try {
            const response = await fetch(`${API_BASE}/admin/createUser`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${userInfo.token}`  // IMPORTANT!!!
                },
                body: JSON.stringify({
                    user_name: sanitizedName,
                    role_id: Number(selectedUserRoleId),   // FIXED
                    user_email: sanitizedEmail,
                    user_phone: sanitizedMobile,
                    password: sanitizedPassword,
                    createdBy: userInfo?.user?.user_email
                })
            });

            const res = await response.json();

            if (!response.ok) {
                let errorMsg = res.message || "Error creating user";
                if (res.errors && Array.isArray(res.errors) && res.errors.length > 0) {
                    errorMsg = res.errors[0].msg;
                }
                setErrorMessage(errorMsg);
                setLoadingSubmit(false);
                return;
            }

            showAlertSuccess('User created successfully!');
            closeModal();
            return true;

        } catch (err) {
            console.log("Create Error:", err);
            setErrorMessage("Error creating user.");
            setLoadingSubmit(false);
            return false;
        }
    };

    // Pagination functions
    const handlePageChange = (newPage, searchQuery = '') => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchUserData(newPage, pagination.limit, searchQuery);
        }
    };

    const handleLimitChange = (newLimit, searchQuery = '') => {
        fetchUserData(1, newLimit, searchQuery); // Reset to page 1 when limit changes
    };

    return {
        setIsModalCreate, isModalCreate, selectedClientId, setSelectedClientId, selectedClientName, setSelectedClientName, userName, setUserName, userMobile, setUserMobile, userEmail, setUserEmail, userPassword, setUserPassword, errorMessage, handleUserCreate, closeModal,
        fetchUserData, users, errorUsers, loadingUsers, isModalEdit, setIsModalEdit, setIsModalView, isModalView, errorMessageEdit, setErrorMessageEdit, fetchUserRoleData, errorUserRole, userRolesData, loadingUserRole,
        selectedUserRoleId, setSelectedUserRoleId, selectedUserRoleName, setSelectedUserRoleName, selectedUserId, setSelectedUserId, selectedUserName, setSelectedUserName, setSelectedUserEmial, selectedUserEmail, loadingSubmit, loadingUpdate, setLoadingUpdate,
        pagination, handlePageChange, handleLimitChange, currentUserDetails, setCurrentUserDetails
    };
};

export default useManageUsers;
