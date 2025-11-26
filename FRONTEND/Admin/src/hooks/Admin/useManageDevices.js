import { useState, useEffect, useRef } from 'react';
import { sanitizeSerialNumber } from '../../utils/validation';
import { showAlertSuccess } from '../../utils/alert';
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
    const chartInitialized = useRef(null);

    // Function to fetch users data
    useEffect(() => {
        async function loadUsers() {
            if (isModalAssign && !fetchuserDataCalled.current) {
                try {
                    const response = await fetch(`${API_BASE}/admin/getUsers`);
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
    const fetchDeviceData = async (page = 1, limit = 10) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/admin/getDevices?page=${page}&limit=${limit}`, {
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

        if (loadingSubmit) return;
        setLoadingSubmit(true);

        const sanitizedSerialNumber = sanitizeSerialNumber(serialNumber);

        if (!sanitizedSerialNumber.trim()) {
            setErrorMessage("Serial Number is required.");
            setTimeout(() => setErrorMessage(''), 5000);
            return;
        }

        if (sanitizedSerialNumber.length < 17 || sanitizedSerialNumber.length > 20) {
            setErrorMessage("Serial Number must be between 17 to 20 characters.");
            setTimeout(() => setErrorMessage(''), 5000);
            return;
        }

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

    // Render charts when devices data is available
    useEffect(() => {
        if (!chartInitialized.current && devices.length > 0) {
            renderCharts(devices);
            chartInitialized.current = true;
        }
    }, [devices]);

    // Chart rendering function
    const renderCharts = (chartData) => {
        if (!chartData || chartData.length === 0) return;

        // Group data by month
        const monthlyData = {};

        chartData.forEach((item) => {
            const date = new Date(item.created_date);
            const monthLabel = date.toLocaleString("en-US", { month: "short" }); // "Jan", "Feb", etc.

            if (!monthlyData[monthLabel]) {
                monthlyData[monthLabel] = {
                    createdCount: 0,
                    activeCount: 0,
                    deactivatedCount: 0
                };
            }

            monthlyData[monthLabel].createdCount += 1;
            if (item.status) {
                monthlyData[monthLabel].activeCount += 1;
            } else {
                monthlyData[monthLabel].deactivatedCount += 1;
            }
        });

        // Get the last 12 months
        const labels = [];
        const createdCounts = [];
        const activeCounts = [];
        const deactivatedCounts = [];

        const currentDate = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthLabel = date.toLocaleString("en-US", { month: "short" });

            labels.push(monthLabel);
            createdCounts.push(monthlyData[monthLabel]?.createdCount || 0);
            activeCounts.push(monthlyData[monthLabel]?.activeCount || 0);
            deactivatedCounts.push(monthlyData[monthLabel]?.deactivatedCount || 0);
        }

        // Ensure the canvas elements exist
        const barCanvas = document.getElementById("chart-bars");
        const lineCanvas = document.getElementById("chart-line");

        if (!barCanvas || !lineCanvas) return;

        const ctx1 = barCanvas.getContext("2d");
        new Chart(ctx1, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Devices Created",
                        backgroundColor: "#4CAF50",
                        data: createdCounts,
                        maxBarThickness: 6,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: "#fff",
                            stepSize: 5, // Ensures tick values are 1, 5, 10, 15
                            callback: (value) => (value % 5 === 0 ? value : null)
                        },
                    },
                    x: {
                        ticks: { color: "#fff" },
                    },
                },
            },
        });

        const ctx2 = lineCanvas.getContext("2d");
        new Chart(ctx2, {
            type: "line",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Active Devices",
                        borderColor: "#4CAF50",
                        backgroundColor: "rgba(76, 175, 80, 0.2)",
                        fill: true,
                        data: activeCounts,
                        tension: 0.4,
                    },
                    {
                        label: "Deactivated Devices",
                        borderColor: "#F44336",
                        backgroundColor: "rgba(244, 67, 54, 0.2)",
                        fill: true,
                        data: deactivatedCounts,
                        tension: 0.4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true },
                },
                scales: {
                    y: {
                        ticks: {
                            color: "#b2b9bf",
                            stepSize: 5,
                            callback: (value) => (value % 5 === 0 ? value : null)
                        },
                    },
                    x: { ticks: { color: "#b2b9bf" } },
                },
            },
        });
    };

    // Pagination functions
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchDeviceData(newPage, pagination.limit);
        }
    };

    const handleLimitChange = (newLimit) => {
        fetchDeviceData(1, newLimit); // Reset to page 1 when limit changes
    };

    return {
        setIsModalCreate, isModalCreate, setIsModalAssign, isModalAssign, serialNumber, setSerialNumber, imeiNumber, setImeiNumber, deviceType, setDeviceType, errorMessage, handleDeviceCreate, closeModal,
        isModalEdit, setIsModalEdit, setIsModalView, isModalView, fetchDeviceData, devices, loading, errorDevice, errorMessageEdit, setErrorMessageEdit, users, errorusers, loadingusers,
        selecteduser, setSelecteduser, handleuserSelection, selectedDevices, setSelectedDevices, handleDeviceSelection, handleAssign, assignErrorMessage, loadingSubmit, loadingUpdate, setLoadingUpdate,
        pagination, handlePageChange, handleLimitChange
    };
};

export default useManageDevices;
