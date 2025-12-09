import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import SignIn from '../pages/Admin/Auth/SignIn';
import SignUp from '../pages/Admin/Auth/SignUp';
import Dashboard from '../pages/Admin/Dashboard';
import ManageDevices from '../pages/Admin/ManageDevices';
import ManageUserRoles from '../pages/Admin/ManageUserRoles';
import ManageUsers from '../pages/Admin/ManageUsers';
import ManageUsersView from '../pages/Admin/ManageUsersView';
import ManageProducts from '../pages/Admin/ManageProducts';
import CreateProduct from '../pages/Admin/CreateProduct';
import EditProduct from '../pages/Admin/EditProduct';
import ViewProduct from '../pages/Admin/ViewProduct';
import ChannelHistory from '../pages/Admin/ChannelHistory';
import Profile from '../pages/Admin/Profile';
import ManageOrders from '../pages/Admin/ManageOrders';
import ViewOrder from '../pages/Admin/ViewOrder';

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
        </Routes>
    );
};

export default AdminRoutes;
