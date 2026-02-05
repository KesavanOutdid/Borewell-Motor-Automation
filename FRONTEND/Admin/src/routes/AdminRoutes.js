import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import PageSkeleton from '../components/Common/PageSkeleton';

// Lazy load all page components
const SignIn = lazy(() => import('../pages/Admin/Auth/SignIn'));
const SignUp = lazy(() => import('../pages/Admin/Auth/SignUp'));
const Dashboard = lazy(() => import('../pages/Admin/Dashboard'));
const ManageDevices = lazy(() => import('../pages/Admin/ManageDevices'));
const ManageDevicesView = lazy(() => import('../pages/Admin/ManageDevicesView'));
const DeviceHistory = lazy(() => import('../pages/Admin/DeviceHistory'));
const DeviceDetails = lazy(() => import('../pages/Admin/DeviceDetails'));
const ManageUserRoles = lazy(() => import('../pages/Admin/ManageUserRoles'));
const ManageUsers = lazy(() => import('../pages/Admin/ManageUsers'));
const ManageUsersView = lazy(() => import('../pages/Admin/ManageUsersView'));
const ManageProducts = lazy(() => import('../pages/Admin/ManageProducts'));
const CreateProduct = lazy(() => import('../pages/Admin/CreateProduct'));
const EditProduct = lazy(() => import('../pages/Admin/EditProduct'));
const ViewProduct = lazy(() => import('../pages/Admin/ViewProduct'));
const ChannelHistory = lazy(() => import('../pages/Admin/ChannelHistory'));
const Profile = lazy(() => import('../pages/Admin/Profile'));
const ManageOrders = lazy(() => import('../pages/Admin/ManageOrders'));
const ViewOrder = lazy(() => import('../pages/Admin/ViewOrder'));
const ManageVouchers = lazy(() => import('../pages/Admin/ManageVouchers'));
const AddVoucher = lazy(() => import('../pages/Admin/AddVoucher'));
const EditVoucher = lazy(() => import('../pages/Admin/EditVoucher'));

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
            navigate("/admin/dashboard");
        } else {
            console.error("SignIn response does not contain valid data");
        }
    };

    const handleLogout = () => {
        setLoggedIn(false);
        setUserInfo({});
        sessionStorage.removeItem('adminUser');
        navigate('/admin/signin'); // Redirect to SignIn page on logout
    };

    return (
        <Suspense fallback={<PageSkeleton />}>
            <Routes>
                <Route
                    path="signin"
                    element={
                        loggedIn ? (
                            <Navigate to="/admin/dashboard" replace />
                        ) : (
                            <SignIn userInfo={userInfo} handleSignIn={handleSignIn} />
                        )
                    }
                />
                <Route
                    path="signin"
                    element={<SignIn userInfo={userInfo} handleSignIn={handleSignIn} />}
                />
                <Route
                    path="dashboard"
                    element={loggedIn ? (
                        <Dashboard userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/admin/signin" />
                    )}
                />
                <Route
                    path="manage-devices"
                    element={loggedIn ? (
                        <ManageDevices userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/admin/signin" />
                    )}
                />
                <Route
                    path="manage-devices-view"
                    element={loggedIn ? (
                        <ManageDevicesView userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/admin/signin" />
                    )}
                />
                <Route
                    path="device-history"
                    element={loggedIn ? (
                        <DeviceHistory userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/admin/signin" />
                    )}
                />
                <Route
                    path="device-details"
                    element={loggedIn ? (
                        <DeviceDetails userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/admin/signin" />
                    )}
                />
                <Route
                    path="manage-user-roles"
                    element={loggedIn ? (
                        <ManageUserRoles userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/admin/signin" />
                    )}
                />
                <Route
                    path="manage-users"
                    element={loggedIn ? (
                        <ManageUsers userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/admin/signin" />
                    )}
                />
                <Route
                    path="manage-users-view"
                    element={loggedIn ? (
                        <ManageUsersView userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/admin/signin" />
                    )}
                />
                <Route
                    path="channel-history"
                    element={loggedIn ? (
                        <ChannelHistory userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/admin/signin" />
                    )}
                />
                <Route
                    path="profile"
                    element={loggedIn ? (
                        <Profile userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/admin/signin" />
                    )}
                />
                <Route
                    path="manage-products"
                    element={loggedIn ? (
                        <ManageProducts userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/admin/signin" />
                    )}
                />
                <Route
                    path="create-product"
                    element={loggedIn ? (
                        <CreateProduct userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/admin/signin" />
                    )}
                />
                <Route
                    path="edit-product"
                    element={loggedIn ? (
                        <EditProduct userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/admin/signin" />
                    )}
                />
                <Route
                    path="view-product"
                    element={loggedIn ? (
                        <ViewProduct userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/admin/signin" />
                    )}
                />
                <Route
                    path="SignUp"
                    element={loggedIn ? (
                        <SignUp userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/admin/signin" />
                    )}
                />
                <Route
                    path="manage-orders"
                    element={loggedIn ? (
                        <ManageOrders userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/admin/signin" />
                    )}
                />
                <Route
                    path="view-order"
                    element={loggedIn ? (
                        <ViewOrder userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/admin/signin" />
                    )}
                />
                <Route
                    path="manage-vouchers"
                    element={loggedIn ? (
                        <ManageVouchers userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/admin/signin" />
                    )}
                />
                <Route
                    path="add-voucher"
                    element={loggedIn ? (
                        <AddVoucher userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/admin/signin" />
                    )}
                />
                <Route
                    path="edit-voucher"
                    element={loggedIn ? (
                        <EditVoucher userInfo={userInfo} handleLogout={handleLogout} />
                    ) : (
                        <Navigate to="/admin/signin" />
                    )}
                />
            </Routes>
        </Suspense>
    );
};

export default AdminRoutes;
