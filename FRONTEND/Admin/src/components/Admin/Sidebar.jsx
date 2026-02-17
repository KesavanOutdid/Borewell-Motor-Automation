import {useState} from 'react';
import { Link, useLocation  } from 'react-router-dom';
import './Sidebar.css';
import logo from '../../assets/img/AgriPlus.png';

const Sidebar = () => {
    const [isSidebarPinned, setSidebarPinned] = useState(true);
    const location = useLocation();

    // Toggle sidebar pinning
    const toggleSidebar = () => {
        const body = document.body;
        if (isSidebarPinned) {
            body.classList.remove('g-sidenav-pinned');
        } else {
            body.classList.add('g-sidenav-pinned');
        }
        setSidebarPinned(!isSidebarPinned);
    };

    const handleNavClick = (path) => {
        if (window.innerWidth < 1200) {
            toggleSidebar(); // Toggle sidebar pinning only on mobile/smaller screens
        }
    };
    return (
        <aside className="sidenav navbar navbar-vertical navbar-expand-xs border-0 border-radius-xl my-3 fixed-start ms-3 sidebar-topographic" id="sidenav-main">
            <div className="sidenav-header" style={{ height: 'auto', minHeight: '80px', display: 'flex', alignItems: 'center' }}>
                <i className="fas fa-times p-3 cursor-pointer text-secondary opacity-5 position-absolute end-0 top-0 d-xl-none" aria-hidden="true" id="iconSidenav" onClick={toggleSidebar}></i>
                <a className="navbar-brand m-0 d-flex align-items-center" href="/dashboard" onClick={(e) => { e.preventDefault(); window.location.href = '/dashboard'; }}>
                    <img src={logo} className="navbar-brand-img" alt="main_logo" style={{ maxHeight: '40px', width: 'auto' }}/>
                    <span className="ms-2 font-weight-bold" style={{ whiteSpace: 'normal', lineHeight: '1.2' }}>Smart Motor Automation</span>
                </a>
            </div>
            <hr className="horizontal dark mt-0"/>
            <div className="collapse navbar-collapse w-auto" id="sidenav-collapse-main">
                <ul className="navbar-nav sidebar-nav-content">
                    <li className="nav-item">
                        <Link className={location.pathname === '/dashboard' ? 'nav-link  active' : 'nav-link'} to="/dashboard" onClick={() => handleNavClick('/dashboard')}>
                            <div className="icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center">
                                <i className="fas fa-home" style={{fontSize: '12px', color: '#344767', lineHeight: '12px'}}></i>
                            </div>
                            <span className="nav-link-text ms-1">Dashboard</span>
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className={location.pathname === '/manage-devices' || location.pathname === '/manage-devices-view' || location.pathname === '/device-history' ? 'nav-link  active' : 'nav-link'} to="/manage-devices" onClick={() => handleNavClick('/manage-devices')}>
                            <div className="icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center">
                                <i className="fas fa-laptop" style={{ fontSize: '12px', color: '#344767', lineHeight: '12px' }}></i>
                            </div>
                            <span className="nav-link-text ms-1">Manage Device</span>
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className={location.pathname === '/manage-user-roles' ? 'nav-link  active' : 'nav-link'} to="/manage-user-roles" onClick={() => handleNavClick('/manage-user-roles')}>
                            <div className="icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center">
                                <i className="fas fa-user-shield" style={{ fontSize: '12px', color: '#344767', lineHeight: '12px' }}></i>
                            </div>
                            <span className="nav-link-text ms-1">Manage User Role</span>
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className={location.pathname === '/manage-users' || location.pathname === '/manage-users-view' || (location.pathname === '/device-details' && location.state?.from === 'manage-users') || (location.pathname === '/device-history' && location.state?.from === 'manage-users') ? 'nav-link  active' : 'nav-link'} to="/manage-users" onClick={() => handleNavClick('/manage-users')}>
                            <div className="icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center">
                                <i className="fas fa-user" style={{ fontSize: '12px', color: '#344767', lineHeight: '12px' }}></i>
                            </div>
                            <span className="nav-link-text ms-1">Manage User</span>
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className={location.pathname === '/manage-products' || location.pathname === '/create-product' || location.pathname === '/view-product' || location.pathname === '/edit-product' ? 'nav-link  active' : 'nav-link'} to="/manage-products" onClick={() => handleNavClick('/manage-products')}>
                            <div className="icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center">
                                <i className="fas fa-box" style={{ fontSize: '12px', color: '#344767', lineHeight: '12px' }}></i>
                            </div>
                            <span className="nav-link-text ms-1">Manage Products</span>
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className={location.pathname === '/manage-orders' || location.pathname === '/view-order' ? 'nav-link  active' : 'nav-link'} to="/manage-orders" onClick={() => handleNavClick('/manage-orders')}>
                            <div className="icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center">
                                <i className="fas fa-shopping-cart" style={{ fontSize: '12px', color: '#344767', lineHeight: '12px' }}></i>
                            </div>
                            <span className="nav-link-text ms-1">Manage Orders</span>
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className={location.pathname === '/manage-vouchers' || location.pathname === '/add-voucher' || location.pathname === '/edit-voucher' ? 'nav-link  active' : 'nav-link'} to="/manage-vouchers" onClick={() => handleNavClick('/manage-vouchers')}>
                            <div className="icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center">
                                <i className="fas fa-ticket-alt" style={{ fontSize: '12px', color: '#344767', lineHeight: '12px' }}></i>
                            </div>
                            <span className="nav-link-text ms-1">Manage Vouchers</span>
                        </Link>
                    </li>
                    <li className="nav-item mt-3">
                        <h6 className="ps-4 ms-2 text-uppercase text-xs font-weight-bolder opacity-6">Account pages</h6>
                    </li>
                    <li className="nav-item">
                        <Link className={location.pathname === '/profile' ? 'nav-link  active' : 'nav-link'} to="/profile"  onClick={() => handleNavClick('/profile')}>
                            <div className="icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center">
                                <svg width="12px" height="12px" viewBox="0 0 46 42" version="1.1" >
                                    <title>customer-support</title>
                                    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                        <g transform="translate(-1717.000000, -291.000000)" fill="#FFFFFF" fillRule="nonzero">
                                            <g transform="translate(1716.000000, 291.000000)">
                                                <g transform="translate(1.000000, 0.000000)">
                                                    <path className="color-background opacity-6" d="M45,0 L26,0 C25.447,0 25,0.447 25,1 L25,20 C25,20.379 25.214,20.725 25.553,20.895 C25.694,20.965 25.848,21 26,21 C26.212,21 26.424,20.933 26.6,20.8 L34.333,15 L45,15 C45.553,15 46,14.553 46,14 L46,1 C46,0.447 45.553,0 45,0 Z"></path>
                                                    <path className="color-background" d="M22.883,32.86 C20.761,32.012 17.324,31 13,31 C8.676,31 5.239,32.012 3.116,32.86 C1.224,33.619 0,35.438 0,37.494 L0,41 C0,41.553 0.447,42 1,42 L25,42 C25.553,42 26,41.553 26,41 L26,37.494 C26,35.438 24.776,33.619 22.883,32.86 Z"></path>
                                                    <path className="color-background" d="M13,28 C17.432,28 21,22.529 21,18 C21,13.589 17.411,10 13,10 C8.589,10 5,13.589 5,18 C5,22.529 8.568,28 13,28 Z"></path>
                                                </g>
                                            </g>
                                        </g>
                                    </g>
                                </svg>
                            </div>
                            <span className="nav-link-text ms-1">Profile</span>
                        </Link>
                    </li>
                    {/* <li className="nav-item">
                        <Link className={location.pathname === '/admin/SignUp' ? 'nav-link  active' : 'nav-link'} to="/admin/SignUp" >
                            <div className="icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center">
                                <svg width="12px" height="20px" viewBox="0 0 40 40" version="1.1" >
                                    <title>spaceship</title>
                                    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                        <g transform="translate(-1720.000000, -592.000000)" fill="#FFFFFF" fillRule="nonzero">
                                            <g transform="translate(1716.000000, 291.000000)">
                                                <g transform="translate(4.000000, 301.000000)">
                                                    <path className="color-background" d="M39.3,0.706666667 C38.9660984,0.370464027 38.5048767,0.192278529 38.0316667,0.216666667 C14.6516667,1.43666667 6.015,22.2633333 5.93166667,22.4733333 C5.68236407,23.0926189 5.82664679,23.8009159 6.29833333,24.2733333 L15.7266667,33.7016667 C16.2013871,34.1756798 16.9140329,34.3188658 17.535,34.065 C17.7433333,33.98 38.4583333,25.2466667 39.7816667,1.97666667 C39.8087196,1.50414529 39.6335979,1.04240574 39.3,0.706666667 Z M25.69,19.0233333 C24.7367525,19.9768687 23.3029475,20.2622391 22.0572426,19.7463614 C20.8115377,19.2304837 19.9992882,18.0149658 19.9992882,16.6666667 C19.9992882,15.3183676 20.8115377,14.1028496 22.0572426,13.5869719 C23.3029475,13.0710943 24.7367525,13.3564646 25.69,14.31 C26.9912731,15.6116662 26.9912731,17.7216672 25.69,19.0233333 L25.69,19.0233333 Z"></path>
                                                    <path className="color-background opacity-6" d="M1.855,31.4066667 C3.05106558,30.2024182 4.79973884,29.7296005 6.43969145,30.1670277 C8.07964407,30.6044549 9.36054508,31.8853559 9.7979723,33.5253085 C10.2353995,35.1652612 9.76258177,36.9139344 8.55833333,38.11 C6.70666667,39.9616667 0,40 0,40 C0,40 0,33.2566667 1.855,31.4066667 Z"></path>
                                                    <path className="color-background opacity-6" d="M17.2616667,3.90166667 C12.4943643,3.07192755 7.62174065,4.61673894 4.20333333,8.04166667 C3.31200265,8.94126033 2.53706177,9.94913142 1.89666667,11.0416667 C1.5109569,11.6966059 1.61721591,12.5295394 2.155,13.0666667 L5.47,16.3833333 C8.55036617,11.4946947 12.5559074,7.25476565 17.2616667,3.90166667 L17.2616667,3.90166667 Z"></path>
                                                    <path className="color-background opacity-6" d="M36.0983333,22.7383333 C36.9280725,27.5056357 35.3832611,32.3782594 31.9583333,35.7966667 C31.0587397,36.6879974 30.0508686,37.4629382 28.9583333,38.1033333 C28.3033941,38.4890431 27.4704606,38.3827841 26.9333333,37.845 L23.6166667,34.53 C28.5053053,31.4496338 32.7452344,27.4440926 36.0983333,22.7383333 L36.0983333,22.7383333 Z"></path>
                                                </g>
                                            </g>
                                        </g>
                                    </g>
                                </svg>
                            </div>
                            <span className="nav-link-text ms-1">Sign Up</span>
                        </Link>
                    </li> */}
                </ul>
                {/* <div className="sidebar-bottom-image">
                    <img 
                        src="../assets/img/farming-scene.jpeg" 
                        alt="Agricultural Scene" 
                        className="sidebar-farm-image"
                    />
                </div> */}
            </div>
      </aside>
  );
};

export default Sidebar;
