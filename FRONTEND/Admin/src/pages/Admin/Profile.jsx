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
        profile_image,
        selectedImage,
        setUpdateUname,
        setUpdatePassword,
        setSelectedImage,
        errorMessage,
        setErrorMessage,
        userModified,
        loadingUpdate,
        loadingImageUpload,
        handleUpdate,
        handleImageUpload,
    } = useProfile(userInfo);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (user_name && user_name.trim().length > 40) {
            setErrorMessage('Name should not exceed 40 characters.');
            return;
        }
        await handleUpdate(userInfo, setErrorMessage, Swal);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                Swal.fire({
                    icon: 'error',
                    title: 'File Too Large',
                    text: 'Image size must be less than 5MB',
                    timer: 5000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    position: 'top-end',
                    toast: true
                });
                e.target.value = null;
                return;
            }

            // Validate file type
            const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Format',
                    text: 'Only PNG and JPG images are allowed',
                    timer: 5000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    position: 'top-end',
                    toast: true
                });
                e.target.value = null;
                return;
            }

            setErrorMessage('');
            setSelectedImage(file);
        }
    };

    const handleImageSubmit = async () => {
        if (selectedImage) {
            await handleImageUpload(selectedImage);
        }
    };

    const getImageUrl = () => {
        if (selectedImage) {
            return URL.createObjectURL(selectedImage);
        } else if (profile_image) {
            return `${process.env.REACT_APP_SERVER_URL}${profile_image}`;
        }
        return "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    };

    return (
        <div className='' style={{ paddingTop: '15px' }}>
            {/* Sidebar */}
            <Sidebar />
            <main className="main-content position-relative h-100 mt-1 border-radius-lg ">
                {/* Header */}
                <Header userInfo={userInfo} handleLogout={handleLogout} />
                <div className="container-fluid">
                    {/* <div className="page-header border-radius-lg mt-4 d-flex flex-column justify-content-end">
                        <span className="mask bg-primary opacity-9"></span>
                        <div className="w-100 position-relative p-3">
                            <div className="d-flex justify-content-between align-items-end">
                                <div className="d-flex align-items-center">

                                </div>
                            </div>
                        </div>
                    </div> */}

                    {/* Profile update start */}
                    <div className="row">
                        <div className="col-md-12 mt-4">
                            {/* Error Messages */}
                            {errorMessage && (
                                <div className="alert alert-danger alert-dismissible fade show" role="alert" style={{ marginBottom: '15px' }}>
                                    <i className="fas fa-exclamation-circle me-2"></i>
                                    {errorMessage}
                                    <button type="button" className="btn-close" onClick={() => setErrorMessage('')}></button>
                                </div>
                            )}
                            <div className="card">
                                <div className="card-header pb-0 px-3">
                                    <h6 className="mb-0">Profile Update</h6>
                                </div>
                                <div className="row" style={{padding:'20px'}}>
                                    <div className="card-body pt-4 p-3 col-md-6" style={{ borderRadius: '10px' }}>
                                        <div className="list-group-item border-0 p-4 mb-2 bg-gray-100 border-radius-lg">
                                            {/* Avatar Image */}
                                            <div className="d-flex flex-column align-items-center">
                                                <div className="position-relative mb-3" style={{ cursor: selectedImage ? 'default' : 'pointer' }}>
                                                    <img
                                                        src={getImageUrl()}
                                                        alt="profile_image"
                                                        id="profile_image"
                                                        className="shadow"
                                                        style={{ 
                                                            width: '200px', 
                                                            height: '200px', 
                                                            objectFit: 'cover',
                                                            border: '4px solid #fff',
                                                            borderRadius: '50%',
                                                            transition: 'all 0.3s ease'
                                                        }} 
                                                        onClick={() => !selectedImage && document.getElementById('imageUpload').click()}
                                                    />
                                                    {!selectedImage && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary btn-sm rounded-circle position-absolute"
                                                            style={{
                                                                bottom: '10px',
                                                                right: '10px',
                                                                width: '45px',
                                                                height: '45px',
                                                                padding: '0',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                                                            }}
                                                            onClick={() => document.getElementById('imageUpload').click()}
                                                            disabled={loadingImageUpload}
                                                        >
                                                            <i className="fas fa-camera" style={{ fontSize: '18px' }}></i>
                                                        </button>
                                                    )}
                                                    <input
                                                        type="file"
                                                        id="imageUpload"
                                                        accept="image/png, image/jpeg, image/jpg"
                                                        style={{ display: 'none' }}
                                                        onChange={handleImageChange}
                                                    />
                                                </div>

                                                {selectedImage ? (
                                                    <div className="d-flex gap-2 mt-2">
                                                        <button
                                                            type="button"
                                                            className="btn btn-success btn-sm"
                                                            onClick={handleImageSubmit}
                                                            disabled={loadingImageUpload}
                                                            style={{ minWidth: '100px' }}
                                                        >
                                                            {loadingImageUpload ? (
                                                                <>
                                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                                    Uploading...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="fas fa-check me-2"></i>
                                                                    Save
                                                                </>
                                                            )}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-secondary btn-sm"
                                                            onClick={() => {
                                                                setSelectedImage(null);
                                                                document.getElementById('imageUpload').value = null;
                                                                setErrorMessage('');
                                                            }}
                                                            disabled={loadingImageUpload}
                                                        >
                                                            <i className="fas fa-times me-2"></i>
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-center mt-2">
                                                        <p className="text-sm text-muted mb-0">Click camera icon to change photo</p>
                                                        <small className="text-muted" style={{ fontSize: '11px' }}>Max: 5MB (PNG, JPG, JPEG)</small>
                                                    </div>
                                                )}
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
                                                        maxLength={40}
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
                                                        value={password ? password.toString() : ''}
                                                        maxLength={6}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, '');
                                                            setUpdatePassword(val);
                                                            if (errorMessage) setErrorMessage('');
                                                        }}
                                                        autoComplete="off" />
                                                </div>
                                                {errorMessage && (
                                                    <div className="alert alert-danger text-white text-sm" role="alert">
                                                        {errorMessage}
                                                    </div>
                                                )}
                                                <div className="text-center">
                                                    <button className="btn btn-primary" id="Update" disabled={!userModified || loadingUpdate || !user_name.trim() || !password || password.toString().length !== 6}>
                                                        {loadingUpdate ? "Updating..." : "Update"}
                                                    </button>
                                                </div>
                                            </form>
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
