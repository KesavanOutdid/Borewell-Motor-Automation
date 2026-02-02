import React from 'react';
import Header from '../../components/Admin/Header';
import Sidebar from '../../components/Admin/Sidebar';
import Footer from '../../components/Admin/Footer';
import Swal from 'sweetalert2';
import { useProfile } from '../../hooks/Admin/useProfile';
const Profile = ({ userInfo, handleLogout }) => {

    const {
        user_name,
        user_phone,
        user_email,
        password,
        setUpdateUname,
        setUpdatePassword,
        errorMessage,
        successMessage,
        setErrorMessage,
        userModified,
        loadingUpdate,
        handleUpdate,
    } = useProfile(userInfo);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        await handleUpdate(userInfo, setErrorMessage, Swal);
    };

    return (
        <div className='' style={{ paddingTop: '15px' }}>
            {/* Sidebar */}
            <Sidebar />
            <main className="main-content position-relative h-100 mt-1 border-radius-lg ">
                {/* Header */}
                <Header userInfo={userInfo} handleLogout={handleLogout} />
                <div className="container-fluid">
                    <div className="page-header border-radius-lg mt-4 d-flex flex-column justify-content-end">
                        <span className="mask bg-primary opacity-9"></span>
                        <div className="w-100 position-relative p-3">
                            <div className="d-flex justify-content-between align-items-end">
                                <div className="d-flex align-items-center">

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profile update start */}
                    <div className="row">
                        <div className="col-md-12 mt-4">
                            <div className="card">
                                <div className="card-header pb-0 px-3">
                                    <h6 className="mb-0">Profile Update</h6>
                                </div>
                                <div className="row" style={{padding:'20px'}}>
                                    <div className="card-body pt-4 p-3 col-md-6" style={{ borderRadius: '10px' }}>
                                        <div className="list-group-item border-0 p-4 mb-2 bg-gray-100 border-radius-lg">
                                            {/* Avatar Image */}
                                            <div className="d-flex flex-column align-items-center">
                                                <div className="position-relative mb-3">
                                                    <img
                                                        src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                                                        alt="profile_image"
                                                        id="profile_image"
                                                        className="border-radius-lg shadow-sm"
                                                        style={{ width: '250px', height: '250px', objectFit: 'cover' }} 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-body pt-4 p-3 col-md-6" style={{ borderRadius: '10px' }}>
                                        <div className="list-group-item border-0 p-4 mb-2 bg-gray-100 border-radius-lg">
                                            <form onSubmit={handleFormSubmit}>
                                                <div className="mb-3">
                                                    <label className="form-label text-sm">Name</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="name"
                                                        value={user_name}
                                                        onChange={(e) => setUpdateUname(e.target.value)}
                                                        autoComplete="off" />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label text-sm">Phone</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="mobile"
                                                        value={user_phone}
                                                        style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
                                                        readOnly
                                                        autoComplete="off" />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label text-sm">Email</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="email"
                                                        value={user_email}
                                                        style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
                                                        readOnly
                                                        autoComplete="off" />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label text-sm">Password</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="password"
                                                        value={password}
                                                        maxLength={6}
                                                        minLength={6}
                                                        onChange={(e) => setUpdatePassword(e.target.value)}
                                                        autoComplete="off" />
                                                </div>
                                                <div className="text-center">
                                                    <button className="btn btn-primary" id="Update" disabled={!userModified || loadingUpdate}>{loadingUpdate ? "Updating..." : "Update"}</button>
                                                </div>
                                            </form>
                                            {/* Success/Error Messages */}
                                            {successMessage && <div className="text-success" style={{ paddingBottom: '20px', textAlign: 'center' }}>{successMessage}</div>}
                                            {errorMessage && <div className="text-danger" style={{ paddingBottom: '20px', textAlign: 'center' }}>{errorMessage}</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Profile update end */}

                    {/* Footer */}
                    <Footer />
                </div>
            </main>
        </div>
    );
};

export default Profile;
