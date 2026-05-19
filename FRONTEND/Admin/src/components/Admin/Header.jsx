import { Link, useLocation } from 'react-router-dom';
import { useHeaderLogic } from '../../hooks/Admin/useHeader';
import './Header.css';

const Header = ({ userInfo, handleLogout }) => {
    const location = useLocation(); // React Router's useLocation hook

    const pageTitle = () => {
        switch (location.pathname) {
            case '/dashboard':
                return 'Dashboard';
            case '/manage-devices':
                return 'Manage Devices';
            case '/manage-devices-view':
                return 'Device Details';
            case '/manage-sims':
                return 'Manage Sims';
            case '/manage-clients':
                return 'Manage Clients';
            case '/manage-user-roles':
                return 'Manage User Roles';
            case '/manage-users':
                return 'Manage Users';
            case '/manage-users-view':
                return 'User Details & Devices';
            case '/device-details':
                return 'Device Details';
            case '/device-history':
                return 'Device History';
            case '/manage-device-type':
                return 'Manage Device Type';
            case '/channel-history':
                return 'Channel History';
            case '/profile':
                return 'Profile';
            case '/manage-orders':
                return 'Manage Orders';
            case '/view-order':
                return 'View Order';
            case '/manage-products':
                return 'Manage Products';
            case '/view-product':
                return 'View Products';
            case '/edit-product':
                return 'Edit Products';
            case '/create-product':
                return 'Create Products';
            case '/manage-vouchers':
                return 'Manage Vouchers';
            case '/edit-voucher':
                return 'Edit Vouchers';
            case '/add-voucher':
                return 'Create Vouchers';
            case '/manage-help':
                return 'Manage Help';
            case '/view-help':
                return 'Manage Help View';
            default:
                return 'Page Not Found';
        }
    };

    const {
        toggleSidebar,
        handleLogoutWithConfirmation,
    } = useHeaderLogic(userInfo);

    return (
        <nav className="navbar navbar-main navbar-expand-lg px-0 mx-4 border-radius-xl position-sticky header-topographic left-auto top-1 z-index-sticky" style={{ paddingTop: '10px' }} id="navbarBlur" navbar-scroll="true">
            <div className="container-fluid py-1 px-3">
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb bg-transparent mb-0 pb-0 pt-1 px-0 me-sm-6 me-5">
                        <li className="breadcrumb-item text-sm"><span className="opacity-5 text-white">Page</span></li>
                        <li className="breadcrumb-item text-sm text-dark active" aria-current="page">{pageTitle()}</li>
                    </ol>
                    {/* <h6 className="font-weight-bolder mb-0">{pageTitle()}</h6> */}
                </nav>
                <div className="collapse navbar-collapse mt-sm-0 mt-2 me-md-0 me-sm-4" id="navbar" style={{ flexGrow: '0' }}>
                    <ul className="navbar-nav  justify-content-end">
                        <li className="nav-item d-flex align-items-center">
                            <Link className="nav-link text-body font-weight-bold px-5" onClick={() => handleLogoutWithConfirmation(handleLogout)}>
                                <i className="fas fa-sign-out-alt me-sm-1"></i>
                                <span className="d-sm-inline d-none">Sign Out</span>
                            </Link>
                        </li>
                        <li className="nav-item d-xl-none ps-3 d-flex align-items-center">
                            <Link href="#" className="nav-link text-body p-0" id="iconNavbarSidenav" onClick={(e) => { e.preventDefault(); toggleSidebar(); }}>
                                <div className="sidenav-toggler-inner">
                                    <i className="sidenav-toggler-line"></i>
                                    <i className="sidenav-toggler-line"></i>
                                    <i className="sidenav-toggler-line"></i>
                                </div>
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>

    );
};

export default Header;
