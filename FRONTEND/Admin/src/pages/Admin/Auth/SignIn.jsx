import React, { useEffect, useState } from 'react';
import SignInHandler from '../../../hooks/Admin/useSignIn';
import { sanitizeEmail, sanitizePassword } from '../../../utils/validation';
import { useNavigate } from "react-router-dom";
import signInBg from '../../../assets/img/signin.png';
import logoImg from '../../../assets/img/AgriPlus.png';

const SignIn = ({ handleSignIn, userInfo }) => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (userInfo?.token) {
            navigate("/dashboard", { replace: true });
        }
    }, [userInfo?.token, navigate]);

    const { user_email, setEmail, passwords, setPassword, errorMessage, handleSignInFormSubmit, loadingSubmit } = SignInHandler(handleSignIn);

    return (
        <div className="main-content mt-0" style={{
            backgroundColor: '#ffffff',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '15px',
            fontFamily: "'Open Sans', sans-serif"
        }}>
            <style>
                {`
                . {
                    box-shadow: none !important;
                    outline: none !important;
                }
                .input-group:focus-within {
                    border-color: #8b80f9 !important;
                }
                `}
            </style>

            {/* Main Content Area */}
            <div className="flex-grow-1 position-relative" style={{
                borderRadius: '45px',
                border: '12px solid #ffffff',
                overflow: 'hidden',
                backgroundImage: `url(${signInBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                padding: '0 8%',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
            }}>
                <div className="col-xl-4 col-lg-5 col-md-7">
                    <div className="card border-0 mb-0" style={{
                        borderRadius: '30px',
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(15px)',
                        WebkitBackdropFilter: 'blur(15px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
                        padding: '40px 30px'
                    }}>
                        <div className="card-header pb-0 text-left bg-transparent border-0">
                            <h2 className="font-weight-bolder text-white" style={{ fontSize: '2.2rem', marginBottom: '10px' }}>Welcome Back...</h2>
                            <p className="mb-4 text-white" style={{ fontSize: '0.95rem', opacity: 0.8 }}>Please enter your email and password</p>
                        </div>
                        <div className="card-body p-0">
                            <form className="form" onSubmit={handleSignInFormSubmit}>
                                <div className="mb-3">
                                    <div className="input-group border-0 rounded-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '5px 15px' }}>
                                        <input
                                            type="email"
                                            className="form-control border-0 shadow-none bg-transparent"
                                            placeholder="Enter your email"
                                            value={user_email}
                                            onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
                                            required
                                            style={{ height: '50px', fontSize: '1rem', color: '#333' }}
                                        />
                                        <span className="input-group-text bg-transparent border-0">
                                            <i className="fas fa-at text-secondary"></i>
                                        </span>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <div className="input-group border-0 rounded-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '5px 15px' }}>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="form-control border-0 shadow-none bg-transparent"
                                            placeholder="Enter your 6-digit password"
                                            value={passwords}
                                            onChange={(e) => setPassword(sanitizePassword(e.target.value))}
                                            required
                                            style={{ height: '50px', fontSize: '1rem', color: '#333' }}
                                        />
                                        <span 
                                            className="input-group-text bg-transparent border-0" 
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-secondary`}></i>
                                        </span>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <button
                                        type="submit"
                                        className="btn w-100 mb-0 d-flex justify-content-between align-items-center"
                                        disabled={loadingSubmit}
                                        style={{
                                            backgroundColor: '#8b80f9',
                                            color: 'white',
                                            borderRadius: '15px',
                                            padding: '15px 25px',
                                            fontSize: '1.1rem',
                                            fontWeight: '600',
                                            border: 'none',
                                            boxShadow: '0 4px 15px rgba(139, 128, 249, 0.3)'
                                        }}
                                    >
                                        <span>{loadingSubmit ? "login" : "login"}</span>
                                        <i className="fas fa-arrow-right ms-2"></i>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    {errorMessage && (
                        <div className="mt-3 bg-white rounded-4 p-3 shadow-sm" style={{ borderLeft: '5px solid #ff4d4d' }}>
                            <p className="text-danger text-center mb-0 small font-weight-bold">{errorMessage}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Bottom Bar */}
            <div className="d-flex flex-wrap justify-content-between align-items-center px-4 py-3 text-dark mt-2" style={{ fontSize: '0.85rem' }}>
                <div className="d-flex align-items-center mb-2 mb-md-0">
                    <div className="me-3">
                        <img src={logoImg} alt="logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                    </div>
                    <div>
                        <div className="font-weight-bold" style={{ fontSize: '1.1rem', color: '#1a103d' }}>Smart Motor Automation</div>
                        <div style={{ opacity: 0.6 }}>Efficient & Reliable Control</div>
                    </div>
                </div>
                <div style={{ opacity: 0.6, textAlign: 'right', fontWeight: '500' }}>
                    Outdid Unified Pvt Ltd @{new Date().getFullYear()} All Rights Reserved
                </div>
            </div>
        </div>
    );
};

export default SignIn;
