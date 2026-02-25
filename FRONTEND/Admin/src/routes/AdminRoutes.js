import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import PageSkeleton from '../components/Common/PageSkeleton';

// Lazy load all page components
const SignIn = lazy(() => import('../pages/Admin/Auth/SignIn'));
const SignUp = lazy(() => import('../pages/Admin/Auth/SignUp'));
const Dashboard = lazy(() => import('../pages/Admin/Dashboard/Dashboard'));
const ManageDevices = lazy(() => import('../pages/Admin/ManageDevice/ManageDevices'));
const ManageDevicesView = lazy(() => import('../pages/Admin/ManageDevice/ManageDevicesView'));
const DeviceHistory = lazy(() => import('../pages/Admin/ManageDevice/DeviceHistory'));
const DeviceDetails = lazy(() => import('../pages/Admin/ManageDevice/DeviceDetails'));
const ManageUserRoles = lazy(() => import('../pages/Admin/ManageUserRole/ManageUserRoles'));
const ManageUsers = lazy(() => import('../pages/Admin/ManageUser/ManageUsers'));
const ManageUsersView = lazy(() => import('../pages/Admin/ManageUser/ManageUsersView'));
const ManageProducts = lazy(() => import('../pages/Admin/ManageProducts/ManageProducts'));
const CreateProduct = lazy(() => import('../pages/Admin/ManageProducts/CreateProduct'));
const EditProduct = lazy(() => import('../pages/Admin/ManageProducts/EditProduct'));
const ViewProduct = lazy(() => import('../pages/Admin/ManageProducts/ViewProduct'));
const ChannelHistory = lazy(() => import('../pages/Admin/ManageDevice/ChannelHistory'));
const Profile = lazy(() => import('../pages/Admin/Profile/Profile'));
const ManageOrders = lazy(() => import('../pages/Admin/ManageOrders/ManageOrders'));
const ViewOrder = lazy(() => import('../pages/Admin/ManageOrders/ViewOrder'));
const ManageVouchers = lazy(() => import('../pages/Admin/ManageVouchers/ManageVouchers'));
const AddVoucher = lazy(() => import('../pages/Admin/ManageVouchers/AddVoucher'));
const EditVoucher = lazy(() => import('../pages/Admin/ManageVouchers/EditVoucher'));

const AdminRoutes = () => {
    const storedUser = JSON.parse(sessionStorage.getItem('adminUser'));
    const [loggedIn, setLoggedIn] = useState(!!storedUser);
    const [userInfo, setUserInfo] = useState(storedUser || {});
    const navigate = useNavigate();

    const handleSignIn = (data) => {
        console.log("handleSignIn received:", data);

        if (data?.data?.token && data?.data?.user) {
            const storeData = {
                token: data.data.token,
                user: data.data.user,
            };

            setUserInfo(storeData);
            setLoggedIn(true);
            sessionStorage.setItem("adminUser", JSON.stringify(storeData));
            navigate("/dashboard");
        } else {
            console.error("SignIn response does not contain valid data");
        }
    };

    const handleLogout = () => {
        setLoggedIn(false);
        setUserInfo({});
        sessionStorage.removeItem('adminUser');
        navigate('/'); // Redirect to SignIn page on logout
    };

    return (
        <Suspense fallback={<PageSkeleton />}>
            <Routes>
                <Route
                    path="/"
                    element={
                        loggedIn ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <SignIn userInfo={userInfo} handleSignIn={handleSignIn} />
                        )
                    }
                />
                <Route
                    path="dashboard"
                    element={loggedIn ? (
                        <Dashboard userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/" />
                    )}
                />
                <Route
                    path="manage-devices"
                    element={loggedIn ? (
                        <ManageDevices userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/" />
                    )}
                />
                <Route
                    path="manage-devices-view"
                    element={loggedIn ? (
                        <ManageDevicesView userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/" />
                    )}
                />
                <Route
                    path="device-history"
                    element={loggedIn ? (
                        <DeviceHistory userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/" />
                    )}
                />
                <Route
                    path="device-details"
                    element={loggedIn ? (
                        <DeviceDetails userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/" />
                    )}
                />
                <Route
                    path="manage-user-roles"
                    element={loggedIn ? (
                        <ManageUserRoles userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/" />
                    )}
                />
                <Route
                    path="manage-users"
                    element={loggedIn ? (
                        <ManageUsers userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/" />
                    )}
                />
                <Route
                    path="manage-users-view"
                    element={loggedIn ? (
                        <ManageUsersView userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/" />
                    )}
                />
                <Route
                    path="channel-history"
                    element={loggedIn ? (
                        <ChannelHistory userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/" />
                    )}
                />
                <Route
                    path="profile"
                    element={loggedIn ? (
                        <Profile userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/" />
                    )}
                />
                <Route
                    path="manage-products"
                    element={loggedIn ? (
                        <ManageProducts userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/" />
                    )}
                />
                <Route
                    path="create-product"
                    element={loggedIn ? (
                        <CreateProduct userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/" />
                    )}
                />
                <Route
                    path="edit-product"
                    element={loggedIn ? (
                        <EditProduct userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/" />
                    )}
                />
                <Route
                    path="view-product"
                    element={loggedIn ? (
                        <ViewProduct userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/" />
                    )}
                />
                <Route
                    path="SignUp"
                    element={loggedIn ? (
                        <SignUp userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/" />
                    )}
                />
                <Route
                    path="manage-orders"
                    element={loggedIn ? (
                        <ManageOrders userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/" />
                    )}
                />
                <Route
                    path="view-order"
                    element={loggedIn ? (
                        <ViewOrder userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/" />
                    )}
                />
                <Route
                    path="manage-vouchers"
                    element={loggedIn ? (
                        <ManageVouchers userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/" />
                    )}
                />
                <Route
                    path="add-voucher"
                    element={loggedIn ? (
                        <AddVoucher userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/" />
                    )}
                />
                <Route
                    path="edit-voucher"
                    element={loggedIn ? (
                        <EditVoucher userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/" />
                    )}
                />
            </Routes>
        </Suspense>
    );
};

export default AdminRoutes;
