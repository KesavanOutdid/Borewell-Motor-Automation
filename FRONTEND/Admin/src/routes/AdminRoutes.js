import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import SignIn from '../pages/Admin/Auth/SignIn';
import SignUp from '../pages/Admin/Auth/SignUp';
import Dashboard from '../pages/Admin/Dashboard';
import ManageDevices from '../pages/Admin/ManageDevices';
import ManageUserRoles from '../pages/Admin/ManageUserRoles';
import ManageUsers from '../pages/Admin/ManageUsers';
import ManageUsersView from '../pages/Admin/ManageUsersView';
import ChannelHistory from '../pages/Admin/ChannelHistory';
import Profile from '../pages/Admin/Profile';

const AdminRoutes = () => {
    const storedUser = JSON.parse(sessionStorage.getItem('adminUser'));
    const [loggedIn, setLoggedIn] = useState(!!storedUser);
    const [userInfo, setUserInfo] = useState(storedUser || {});
    const navigate = useNavigate();

    // Handle SignIn
    // const handleSignIn = (data) => {
    //     if (data?.token && data?.user) {
    //         const storeData = {
    //             token: data.token,
    //             user: data.user
    //         };

    //         setUserInfo(storeData);
    //         setLoggedIn(true);

    //         sessionStorage.setItem('adminUser', JSON.stringify(storeData)); // Save token + user

    //         navigate('/admin/dashboard');
    //     } else {
    //         console.error("SignIn response missing token or user");
    //     }
    // };

    const handleSignIn = (data) => {
        if (data?.data) {
            // setUserInfo(data.data);
            // setLoggedIn(true);
            const storeData = {
                token: data.token,
                user: data.user
            };

            setUserInfo(storeData);
            setLoggedIn(true);
            sessionStorage.setItem('adminUser', JSON.stringify(data.data));
            navigate('/admin/dashboard');
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
                path="SignUp"
                element={loggedIn ? (
                    <SignUp userInfo={userInfo} handleLogout={handleLogout} />
                ) : (
                    <Navigate to="/admin/signin" />
                )}
            />
        </Routes>
    );
};

export default AdminRoutes;
