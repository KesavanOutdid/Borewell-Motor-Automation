import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SignInHandler from '../../../hooks/Admin/useSignIn';
import { sanitizeEmail, sanitizePassword } from '../../../utils/validation';
import { useNavigate } from "react-router-dom";
import signInBg from '../../../assets/img/signin.png';

const SignIn = ({ handleSignIn, userInfo }) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (userInfo?.token) {
            navigate("/dashboard", { replace: true });
        }
    }, [userInfo?.token, navigate]);

    const { user_email, setEmail, passwords, setPassword, errorMessage, successMessage, handleSignInFormSubmit, loadingSubmit } = SignInHandler(handleSignIn);

    return (
        <div className="main-content mt-0" style={{
            backgroundImage: `url(${signInBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div className="container">
                <div className="row justify-content-end">
                    <div className="col-xl-4 col-lg-5 col-md-7">
                        <div className="card border-0 mb-0" style={{
                            borderRadius: '24px',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            boxShadow: '0 20px 27px 0 rgba(0, 0, 0, 0.1)',
                            padding: '40px 20px'
                        }}>
                            <div className="card-header pb-0 text-left bg-transparent border-0">
                                <h3 className="font-weight-bolder text-dark" style={{ fontSize: '2rem', marginBottom: '8px' }}>Welcome Back...</h3>
                                <p className="mb-4 text-secondary" style={{ fontSize: '0.95rem' }}>Please enter your email and password</p>
                            </div>
                            <div className="card-body">
                                <form className="form" onSubmit={handleSignInFormSubmit}>
                                    <div className="mb-4">
                                        <div className="input-group input-group-alternative border rounded-3" style={{ padding: '4px 8px' }}>
                                            <input
                                                type="email"
                                                className="form-control border-0 shadow-none"
                                                placeholder="user@gmail.com"
                                                autoComplete="off"
                                                value={user_email}
                                                onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
                                                required
                                                style={{ fontSize: '1rem', height: '45px' }}
                                            />
                                            <span className="input-group-text bg-transparent border-0">
                                                <i className="fas fa-at text-secondary"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <div className="input-group input-group-alternative border rounded-3" style={{ padding: '4px 8px' }}>
                                            <input
                                                type="password"
                                                className="form-control border-0 shadow-none"
                                                placeholder="Password"
                                                autoComplete="off"
                                                minLength={6}
                                                maxLength={6}
                                                value={passwords}
                                                onChange={(e) => setPassword(sanitizePassword(e.target.value))}
                                                required
                                                style={{ fontSize: '1rem', height: '45px' }}
                                            />
                                            <span className="input-group-text bg-transparent border-0">
                                                <i className="fas fa-eye text-secondary"></i>
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
                                                borderRadius: '12px',
                                                padding: '12px 24px',
                                                fontSize: '1.1rem',
                                                fontWeight: '500',
                                                transition: 'all 0.2s ease',
                                                border: 'none'
                                            }}
                                        >
                                            <span>{loadingSubmit ? "login..." : "login..."}</span>
                                            <i className="fas fa-arrow-right ms-2"></i>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                        {errorMessage && (
                            <div className="mt-3 bg-white rounded-3 p-3 shadow-sm" style={{ borderLeft: '4px solid #ea0606' }}>
                                <p className="text-danger text-center mb-0 small">{errorMessage}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignIn;
