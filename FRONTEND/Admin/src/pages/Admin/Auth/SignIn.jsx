import React, {useEffect} from 'react';
import { Link } from 'react-router-dom';
import SignInHandler from '../../../hooks/Admin/useSignIn'; 
import { sanitizeEmail, sanitizePassword } from '../../../utils/validation';
import { useNavigate } from "react-router-dom";

const SignIn = ({ handleSignIn, userInfo }) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (userInfo?.token) {
            navigate("/dashboard", { replace: true });
        }
    }, [userInfo?.token, navigate]);

    const { user_email, setEmail, passwords, setPassword, errorMessage, successMessage, handleSignInFormSubmit, loadingSubmit} = SignInHandler(handleSignIn);
    console.log(successMessage);
    
    return (
        <div className="">
            <div className="container position-sticky z-index-sticky top-0">
                {/* Navbar  */}
                <nav className="navbar navbar-expand-lg blur blur-rounded top-0 z-index-3 position-absolute my-3 py-2 start-0 end-0" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <h2 style={{ margin: 0 }}>Smart Motor Automation</h2>
                </nav>
                {/* End Navbar  */}
            </div>
            <main className="main-content mt-0">
                <section>
                    <div className="page-header min-vh-75">
                        <div className="container">
                            <div className="row">
                                <div className="col-xl-4 col-lg-5 col-md-6 d-flex flex-column mx-auto">
                                    <div className="card card-plain mt-8">
                                        <div className="card-header pb-0 text-left bg-transparent">
                                            <h3 className="font-weight-bolder text-info text-gradient">Welcome back</h3>
                                            <p className="mb-0">Enter your email and password to sign in</p>
                                        </div>
                                        <div className="card-body">
                                            <form className="form" onSubmit={handleSignInFormSubmit}>
                                                <label>Email</label>
                                                <div className="mb-3">
                                                    <input type="email" className="form-control" placeholder="Email" aria-label="Email" aria-describedby="email-addon" autoComplete="off" value={user_email}
                                                         onChange={(e) => setEmail(sanitizeEmail(e.target.value))} required/>
                                                </div>
                                                <label>Password</label>
                                                <div className="mb-3">
                                                    <input type="password" className="form-control" placeholder="Password" aria-label="Password" aria-describedby="password-addon" autoComplete="off" minLength={6} maxLength={6} value={passwords}
                                                         onChange={(e) => setPassword(sanitizePassword(e.target.value))} required/>
                                                </div>
                                                <div className="text-center">
                                                    <button type="submit" className="btn bg-gradient-info w-100 mt-4 mb-0" disabled={loadingSubmit}>{loadingSubmit ? "Signing..." : "Sign in"}</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                    {errorMessage && (
                                        <div className="card-header pb-0 text-left bg-transparent">
                                            <p className="text-danger text-center">{errorMessage}</p>
                                        </div>
                                    )}
                                    {/* {successMessage && (
                                        <div className="card-header pb-0 text-left bg-transparent">
                                            <p className="text-success text-center">{successMessage}</p>
                                        </div>
                                    )} */}
                                </div>
                                <div className="col-md-6">
                                    <div className="oblique position-absolute top-0 h-100 d-md-block d-none me-n8">
                                        <div className="oblique-image bg-cover position-absolute fixed-top ms-auto h-100 z-index-0 ms-n6" style={{ backgroundImage: "url('/assets/img/farming-scene1.jpeg')" }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            {/* START FOOTER  */}
            <footer className="footer py-5">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-8 mx-auto text-center mb-4 mt-2">
                            {/* <Link href="#" target="_blank" className="text-secondary me-xl-4 me-4">
                                <span className="text-lg fab fa-twitter"></span>
                            </Link>
                            <Link href="#" target="_blank" className="text-secondary me-xl-4 me-4">
                                <span className="text-lg fab fa-instagram"></span>
                            </Link> */}
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-8 mx-auto text-center mt-1">
                            <p className="mb-0 text-secondary">
                                Copyright © <script>
                                document.write(new Date().getFullYear())
                                </script>  <Link to="https://outdidunified.com" className="font-weight-bold" target="_blank"> Outdid Unified Pvt Ltd,. </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
            {/* END FOOTER  */}
        </div>
    );
};

export default SignIn
