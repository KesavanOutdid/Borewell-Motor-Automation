import { useState, useEffect, useRef, useCallback } from 'react';
import { sanitizeSerialNumber } from '../../../utils/validation';
import { showAlertSuccess } from '../../../utils/alert';
import Chart from 'chart.js/auto';

const useManageDevices = (userInfo) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;

    const [isModalCreate, setIsModalCreate] = useState(false);
    const [isModalAssign, setIsModalAssign] = useState(false);
    const [isModalEdit, setIsModalEdit] = useState(false);
    const [isModalView, setIsModalView] = useState(false);
    const [serialNumber, setSerialNumber] = useState('');
    const [imeiNumber, setImeiNumber] = useState('');
    const [deviceType, setDeviceType] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [devices, setDevices] = useState([]);
    const [errorDevice, setErrorDevice] = useState('');
    const [loading, setLoading] = useState(true);  // Tracks loading state
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalDevices: 0,
        totalAssignedDevices: 0,
        totalUnassignedDevices: 0,
        totalActiveDevices: 0,
        totalDeactiveDevices: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [errorMessageEdit, setErrorMessageEdit] = useState('');
    const [users, setusers] = useState([]);
    const [errorusers, setErrorusers] = useState('');
    const [loadingusers, setLoadingusers] = useState(true);  // Tracks loading state
    const fetchuserDataCalled = useRef(false); // Ref to track if fetch users has been called
    const [selecteduser, setSelecteduser] = useState('');
    const [selectedDevices, setSelectedDevices] = useState('');
    const [assignErrorMessage, setAssignErrorMessage] = useState('');
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [filterAssignStatus, setFilterAssignStatus] = useState('');

    // Function to fetch users data
    useEffect(() => {
        async function loadUsers() {
            if (isModalAssign && !fetchuserDataCalled.current) {
                try {
                    const response = await fetch(`${API_BASE}/admin/getUsers?limit=1000`);
                    if (response.ok) {
                        const data = await response.json();
                        setusers(data.users);
                    } else {
                        const err = await response.json();
                        setErrorusers(err.message);
                    }
                    setLoadingusers(false);
                } catch (err) {
                    setErrorusers("An error occurred while fetching users.");
                    setLoadingusers(false);
                }
                fetchuserDataCalled.current = true;
            }
        }

        loadUsers();

    }, [isModalAssign, API_BASE]);

    // Function to fetch device data
    const fetchDeviceData = async (page = 1, limit = 10, search = '', assign_status = '') => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page, limit });
            if (search) params.append('search', search);
            if (assign_status) params.append('assign_status', assign_status);
            
            const response = await fetch(`${API_BASE}/admin/getDevices?${params.toString()}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (response.ok) {
                const data = await response.json();
                setDevices(data.data);
                setPagination(data.pagination);
                setLoading(false);
            } else {
                const errorData = await response.json();
                setErrorDevice(errorData.message);
                setLoading(false);
            }
        } catch (error) {
            setErrorDevice("An error occurred while fetching devices.");
            setLoading(false);
        }
    };

    // Close modal
    const closeModal = () => {
        setIsModalCreate(false);
        setIsModalAssign(false);
        setIsModalEdit(false);
        setIsModalView(false);
        setSerialNumber(''); setImeiNumber(''); setDeviceType('');
        setErrorMessage(''); setErrorDevice(''); setErrorMessageEdit('');
        setSelecteduser(''); setSelectedDevices('');
        setLoadingSubmit(false);
        setLoadingUpdate(false);
    };

    const handleDeviceCreate = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        const sanitizedSerialNumber = sanitizeSerialNumber(serialNumber);

        if (!sanitizedSerialNumber.trim()) {
            setErrorMessage("Serial Number is required.");
            setTimeout(() => setErrorMessage(''), 5000);
            return;
        }

        if (sanitizedSerialNumber.length < 10) {
            setErrorMessage("Serial Number must be at least 10 characters.");
            setTimeout(() => setErrorMessage(''), 5000);
            return;
        }

        if (sanitizedSerialNumber.length < 17 || sanitizedSerialNumber.length > 20) {
            setErrorMessage("Serial Number must be between 17 to 20 characters.");
            setTimeout(() => setErrorMessage(''), 5000);
            return;
        }

        if (loadingSubmit) return;
        setLoadingSubmit(true);

        try {
            const response = await fetch(`${API_BASE}/admin/createdDevice`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    serial_number: sanitizedSerialNumber,
                    createdBy: userInfo?.user?.user_email
                })
            });

            const data = await response.json().catch(() => null); 

            if (!response.ok) {
                setErrorMessage(data?.message || "Server returned an error.");
                setLoadingSubmit(false);
                return;
            }

            showAlertSuccess("Device created successfully!");
            closeModal();
            fetchDeviceData();
            setLoadingSubmit(false);

        } catch (error) {
            console.error("Create device error:", error);
            setErrorMessage("Unable to reach server. Please check API_BASE or backend.");
            setLoadingSubmit(false);
        }
    };

    // Handle user single-selection
    const handleuserSelection = (value) => {
        setSelecteduser(value);   // store only single _id
    };

    // Handle device single-selection
    const handleDeviceSelection = (value) => {
        setSelectedDevices(value);   // store as array with 1 item
    };

    // Handle Assign Action
    const handleAssign = async (e) => {
        e.preventDefault();

        if (!selecteduser) {
            setAssignErrorMessage("Please select a user.");
            return;
        }

        if (!selectedDevices) {
            setAssignErrorMessage("Please select a device.");
            return;
        }

        setLoadingSubmit(true);

        try {
            const user = users.find((u) => u._id === selecteduser);
            const device = devices.find((d) => d.serial_number === selectedDevices);

            const payload = {
                user_id: user?.user_id,
                user_name: user?.user_name,
                user_email: user?.user_email,
                serial_number: device?.serial_number,
                assignedBy: userInfo?.user?.user_email,
            };

            const response = await fetch(`${API_BASE}/admin/deviceAssignTouser`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                showAlertSuccess("Device Assigned successfully!");
                closeModal();
                fetchDeviceData();
            } else {
                setAssignErrorMessage(data.message || "Assign failed.");
            }
        } catch (err) {
            setAssignErrorMessage("Server error. Try again later.");
        }

        setLoadingSubmit(false);
    };

    // Pagination functions
    const handlePageChange = (newPage, searchQuery = '') => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchDeviceData(newPage, pagination.limit, searchQuery, filterAssignStatus);
        }
    };

    const handleLimitChange = (newLimit, searchQuery = '') => {
        fetchDeviceData(1, newLimit, searchQuery, filterAssignStatus); // Reset to page 1 when limit changes
    };

    // fetch analytics Data
    const [analytics, setAnalytics] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [errorAnalytics, setErrorAnalytics] = useState(null);

    const analyticsFetched = useRef(false);

    const fetchAnalyticsData = useCallback(async () => {
        try {
            setLoadingAnalytics(true);
            const response = await fetch(`${API_BASE}/admin/getAnalasitic`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (response.ok) {
                const data = await response.json();
                setAnalytics(data);
            } else {
                const errorData = await response.json();
                setErrorAnalytics(errorData.message);
            }
            setLoadingAnalytics(false);
        } catch (error) {
            setErrorAnalytics("An error occurred while fetching analytics.");
            setLoadingAnalytics(false);
        }
    }, [API_BASE]);

    useEffect(() => {
        if (!analyticsFetched.current) {
            fetchAnalyticsData();
            analyticsFetched.current = true;
        }
    }, [fetchAnalyticsData]);

    // which view: 'weekly' | 'monthly' | 'yearly'
    const [chartType, setChartType] = useState("weekly");

    // Chart.js instance ref so we can destroy/recreate
    const chartInstanceRef = useRef(null);

    const prepareAnalyticsData = useCallback(() => {
        let labels = [];
        let created = [];
        let active = [];
        let assigned = [];
        let deactivated = [];

        if (chartType === "weekly") {
            labels = analytics.created.weekly.map(x => x.week);
            created = analytics.created.weekly.map(x => x.count);
            active = analytics.activeStatus.weekly.map(x => x.count);
            assigned = analytics.assigned.weekly.map(x => x.count);
            deactivated = analytics.statusDeactivated.weekly.map(x => x.count);
        } else if (chartType === "monthly") {
            labels = analytics.created.monthly.map(x => x.month);
            created = analytics.created.monthly.map(x => x.count);
            active = analytics.activeStatus.monthly.map(x => x.count);
            assigned = analytics.assigned.monthly.map(x => x.count);
            deactivated = analytics.statusDeactivated.monthly.map(x => x.count);
        } else if (chartType === "yearly") {
            labels = analytics.created.yearly.map(x => x.year);
            created = analytics.created.yearly.map(x => x.count);
            active = analytics.activeStatus.yearly.map(x => x.count);
            assigned = analytics.assigned.yearly.map(x => x.count);
            deactivated = analytics.statusDeactivated.yearly.map(x => x.count);
        }

        return { labels, created, active, assigned, deactivated };
    }, [analytics, chartType]);


    useEffect(() => {
        if (!analytics) return;

        const canvas = document.getElementById("chart-line");
        if (!canvas) return;

        const { labels, created, active, assigned, deactivated } = prepareAnalyticsData();

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        const ctx = canvas.getContext("2d");

        chartInstanceRef.current = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: "Created",
                        data: created,
                        borderColor: "#1E88E5",
                        backgroundColor: "rgba(30, 136, 229, .2)",
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                    },
                    {
                        label: "Active",
                        data: active,
                        borderColor: "#4CAF50",
                        backgroundColor: "rgba(76, 175, 80, .2)",
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                    },
                    {
                        label: "Assigned",
                        data: assigned,
                        borderColor: "#FF9800",
                        backgroundColor: "rgba(255, 152, 0, .2)",
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                    },
                    {
                        label: "Deactivated",
                        data: deactivated,
                        borderColor: "#F44336",
                        backgroundColor: "rgba(244, 67, 54, .2)",
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            padding: 20,
                            font: { size: 13, weight: "bold" }
                        },
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                    },
                    x: {
                        ticks: { maxTicksLimit: 10 },
                    },
                },
            },
        });
    }, [prepareAnalyticsData, analytics]);


    return {
        setIsModalCreate, isModalCreate, setIsModalAssign, isModalAssign, serialNumber, setSerialNumber, imeiNumber, setImeiNumber, deviceType, setDeviceType, errorMessage, handleDeviceCreate, closeModal,
        isModalEdit, setIsModalEdit, setIsModalView, isModalView, fetchDeviceData, devices, loading, errorDevice, errorMessageEdit, setErrorMessageEdit, users, errorusers, loadingusers,
        selecteduser, setSelecteduser, handleuserSelection, selectedDevices, setSelectedDevices, handleDeviceSelection, handleAssign, assignErrorMessage, loadingSubmit, loadingUpdate, setLoadingUpdate,
        pagination, handlePageChange, handleLimitChange,
        analytics, loadingAnalytics, errorAnalytics,
        chartType, setChartType,
        filterAssignStatus, setFilterAssignStatus
    };
};

export default useManageDevices;
