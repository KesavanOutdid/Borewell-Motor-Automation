import React, { useEffect, useRef } from 'react';
import { renderCharts } from '../../charts/Admin/chart';
import Header from '../../components/Admin/Header';
import Sidebar from '../../components/Admin/Sidebar';
import Footer from '../../components/Admin/Footer';
import TableSkeleton from '../../components/Common/TableSkeleton';
import { Link } from 'react-router-dom';
import { useChannelHistory } from '../../hooks/Admin/useChannelHistory';

const ChannelHistory = ({ userInfo, handleLogout }) => {
    const {
        channelHistory, filteredData, loading, error, formData, imeiNumbers, serialNumbers, 
        isSearchApplied, countdown, setCountdown, fetchChannelHistory, handleFilter,    
        handleInputChange, handleSubmit, exportData, printData, 
    } = useChannelHistory(userInfo);
   
    // Automatically call API every 1 minute
    useEffect(() => {
        fetchChannelHistory();

        // Start countdown timer
        const timerId = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        // Automatically fetch data every 1 minute
        const intervalId = setInterval(() => {
            fetchChannelHistory();
        }, 60000);

        return () => {
            clearInterval(intervalId);
            clearInterval(timerId);
        };
    }, [fetchChannelHistory, setCountdown]);

    // chart
    const chartInitialized = useRef(false);

    useEffect(() => {
      if (!chartInitialized.current) {
        renderCharts();
        chartInitialized.current = true; // Prevent reinitialization
      }
    }, []);
    
    return (
        <div className='' style={{paddingTop:'15px'}}>
            {/* Sidebar */}
            <Sidebar/>
            <main className="main-content position-relative h-100 mt-1 border-radius-lg ">
                {/* Header */}
                <Header userInfo={userInfo} handleLogout={handleLogout}/>
                <div className="container-fluid py-4">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <h4 style={{ margin: 0 }}>CHANNEL HISTORY, </h4>
                        <p style={{ margin: 0, paddingLeft:'10px'}}> Next channel history update in: {countdown} seconds</p>
                    </div>
                    <div className="row">
                        <div className="col-12">
                            <div className="card mb-4">
                                <div className="card-header pb-2">
                                    <div className="w-40 text-end d-flex gap-2">
                                        <button className="btn btn-primary mb-0 text-end" onClick={() => handleFilter('Today')}>Today</button>
                                        <button className="btn btn-primary mb-0 text-end" onClick={() => handleFilter('Weekly')}>Weekly</button>
                                        <button className="btn btn-primary mb-0 text-end" onClick={() => handleFilter('Monthly')}>Monthly</button>
                                        <button className="btn btn-primary mb-0 text-end" onClick={() => handleFilter('Yearly')}>Yearly</button>
                                    </div>
                                </div>
                                <div className="card-header">
                                    <form className="form-row" onSubmit={handleSubmit}>
                                        <div className="w-100 d-flex gap-2 align-items-center">
                                            {/* Date Pickers */}
                                            <input type="date" className="form-control" style={{ width: '15%' }} placeholder="Start Date" name="fromDate" value={formData.fromDate} onChange={handleInputChange} required/>
                                            <input type="date" className="form-control" style={{ width: '15%' }} placeholder="End Date" name="toDate" value={formData.toDate} onChange={handleInputChange} required/>

                                            {/* Serial Number Dropdown */}
                                            <select className="form-select" style={{ width: '15%' }} aria-label="Select Serial Number" name="serialNumber" value={formData.serialNumber || ""} onChange={handleInputChange} disabled={serialNumbers.length === 0} required>
                                                <option value="" disabled selected>Serial Number</option>
                                                {serialNumbers && serialNumbers.length > 0 ? (
                                                    serialNumbers.map((serial, index) => (
                                                        <option key={index} value={serial}>
                                                            {serial} {/* Displaying serial Number */}
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option disabled>No Serial Numbers Available</option> // Show this when no serial numbers exist
                                                )}

                                            </select>


                                            {/* IMEI Number Dropdown */}
                                            <select className="form-select" style={{ width: '15%' }} aria-label="Select IMEI Number"placeholder="Start Date" name="imeiNumber" value={formData.imeiNumber} onChange={handleInputChange} disabled={imeiNumbers.length === 0} required>
                                                <option value="" disabled selected>IMEI Number</option>
                                                {imeiNumbers && imeiNumbers.length > 0 ? (
                                                    imeiNumbers.map((imei, index) => (
                                                        <option key={index} value={imei}>
                                                            {imei} {/* Displaying IMEI Number */}
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option disabled>No IMEI Numbers Available</option> // Show this when no IMEI numbers exist
                                                )}
                                            </select>

                                            {/* Buttons with Icons */}
                                            <button className="btn btn-primary mb-0">
                                                <i className="fas fa-search" aria-hidden="true" style={{color:'white'}}></i> Search
                                            </button>
                                            <button className="btn btn-success mb-0" onClick={exportData}>
                                                <i className="fas fa-file-export" aria-hidden="true" style={{color:'white'}}></i> Export
                                            </button>
                                            <button className="btn btn-secondary mb-0" onClick={printData}>
                                                <i className="fas fa-print" aria-hidden="true" style={{color:'white'}}></i> Print
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="card-body px-0 pt-0 pb-2">
                                    <div className="table-responsive p-0" style={{ maxHeight: '500px', overflowY: 'scroll' }}>
                                        <table className="table align-items-center mb-0" >
                                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa' }}>
                                                <tr>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">S.No</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Pump ID</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Frequency</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Latitude</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Longitude</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Power Factor</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Voltage</th>
                                                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Date/Time</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading ? (
                                                    <TableSkeleton rows={8} columns={8} />
                                                ) : error ? (
                                                    <tr>
                                                        <td colSpan="8" style={{ textAlign: 'center', color: 'red' }}>
                                                            <p>{error}</p>
                                                        </td>
                                                    </tr>
                                                ) : (isSearchApplied ? filteredData : channelHistory).slice().reverse().length > 0 ? (
                                                    (isSearchApplied ? filteredData : channelHistory)
                                                        .slice()
                                                        .reverse()
                                                        .map((dataItem, index) => (

                                                        <tr key={index}>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {index + 1 || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {dataItem.pump_id || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {dataItem.frequency || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {dataItem.latitude || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {dataItem.longitude || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {dataItem.power_factor || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {dataItem.voltage || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle text-center">
                                                                <span className="text-secondary text-xs font-weight-bold">
                                                                    {dataItem.date && dataItem.time ? `${dataItem.date} ${dataItem.time}` : 'N/A'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="8" style={{ textAlign: 'center' }}>
                                                            No data available.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row mt-4">
                        <div className="col-lg-7 mb-lg-0 mb-4">
                            <div className="card">
                                <div className="card-body p-3">
                                    <div className="row">
                                        <div className="col-lg-6">
                                            <div className="d-flex flex-column h-100">
                                                <p className="mb-1 pt-2 text-bold">Built by developers</p>
                                                <h5 className="font-weight-bolder">Soft UI Dashboard</h5>
                                                <p className="mb-5">From colors, cards, typography to complex elements, you will find the full documentation.</p>
                                                <Link className="text-body text-sm font-weight-bold mb-0 icon-move-right mt-auto" href="#">
                                                Read More
                                                <i className="fas fa-arrow-right text-sm ms-1" aria-hidden="true"></i>
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="col-lg-5 ms-auto text-center mt-5 mt-lg-0">
                                            <div className="bg-gradient-primary border-radius-lg h-100">
                                                <img src="../assets/img/shapes/waves-white.svg" className="position-absolute h-100 w-50 top-0 d-lg-block d-none" alt="waves"/>
                                                <div className="position-relative d-flex align-items-center justify-content-center h-100">
                                                    <img className="w-100 position-relative z-index-2 pt-4" src="../assets/img/illustrations/rocket-white.png" alt="rocket"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-5">
                            <div className="card h-100 p-3">
                                <div className="overflow-hidden position-relative border-radius-lg bg-cover h-100" style={{ backgroundImage: "url('../assets/img/ivancik.jpg')" }}>
                                    <span className="mask bg-gradient-dark"></span>
                                        <div className="card-body position-relative z-index-1 d-flex flex-column h-100 p-3">
                                            <h5 className="text-white font-weight-bolder mb-4 pt-2">Work with the rockets</h5>
                                            <p className="text-white">Wealth creation is an evolutionarily recent positive-sum game. It is all about who take the opportunity first.</p>
                                            <Link className="text-white text-sm font-weight-bold mb-0 icon-move-right mt-auto" href="#">
                                            Read More
                                            <i className="fas fa-arrow-right text-sm ms-1" aria-hidden="true"></i>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    <div className="row mt-4">
                        <div className="col-lg-5 mb-lg-0 mb-4">
                        <div className="card z-index-2">
                            <div className="card-body p-3">
                            <div className="bg-gradient-dark border-radius-lg py-3 pe-1 mb-3">
                                <div className="chart">
                                <canvas id="chart-bars" className="chart-canvas" height="170"></canvas>
                                </div>
                            </div>
                            <h6 className="ms-2 mt-4 mb-0"> Active Users </h6>
                            <p className="text-sm ms-2"> (<span className="font-weight-bolder">+23%</span>) than last week </p>
                            <div className="container border-radius-lg">
                                <div className="row">
                                <div className="col-3 py-3 ps-0">
                                    <div className="d-flex mb-2">
                                    <div className="icon icon-shape icon-xxs shadow border-radius-sm bg-gradient-primary text-center me-2 d-flex align-items-center justify-content-center">
                                        <svg width="10px" height="10px" viewBox="0 0 40 44" version="1.1" >
                                        <title>document</title>
                                        <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                            <g transform="translate(-1870.000000, -591.000000)" fill="#FFFFFF" fillRule="nonzero">
                                            <g transform="translate(1716.000000, 291.000000)">
                                                <g transform="translate(154.000000, 300.000000)">
                                                <path className="color-background" d="M40,40 L36.3636364,40 L36.3636364,3.63636364 L5.45454545,3.63636364 L5.45454545,0 L38.1818182,0 C39.1854545,0 40,0.814545455 40,1.81818182 L40,40 Z" opacity="0.603585379"></path>
                                                <path className="color-background" d="M30.9090909,7.27272727 L1.81818182,7.27272727 C0.814545455,7.27272727 0,8.08727273 0,9.09090909 L0,41.8181818 C0,42.8218182 0.814545455,43.6363636 1.81818182,43.6363636 L30.9090909,43.6363636 C31.9127273,43.6363636 32.7272727,42.8218182 32.7272727,41.8181818 L32.7272727,9.09090909 C32.7272727,8.08727273 31.9127273,7.27272727 30.9090909,7.27272727 Z M18.1818182,34.5454545 L7.27272727,34.5454545 L7.27272727,30.9090909 L18.1818182,30.9090909 L18.1818182,34.5454545 Z M25.4545455,27.2727273 L7.27272727,27.2727273 L7.27272727,23.6363636 L25.4545455,23.6363636 L25.4545455,27.2727273 Z M25.4545455,20 L7.27272727,20 L7.27272727,16.3636364 L25.4545455,16.3636364 L25.4545455,20 Z"></path>
                                                </g>
                                            </g>
                                            </g>
                                        </g>
                                        </svg>
                                    </div>
                                    <p className="text-xs mt-1 mb-0 font-weight-bold">Users</p>
                                    </div>
                                    <h4 className="font-weight-bolder">36K</h4>
                                    <div className="progress w-75">
                                    <div className="progress-bar bg-dark w-60" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>
                                </div>
                                <div className="col-3 py-3 ps-0">
                                    <div className="d-flex mb-2">
                                    <div className="icon icon-shape icon-xxs shadow border-radius-sm bg-gradient-info text-center me-2 d-flex align-items-center justify-content-center">
                                        <svg width="10px" height="10px" viewBox="0 0 40 40" version="1.1">
                                        <title>spaceship</title>
                                        <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                            <g transform="translate(-1720.000000, -592.000000)" fill="#FFFFFF" fillRule="nonzero">
                                            <g transform="translate(1716.000000, 291.000000)">
                                                <g transform="translate(4.000000, 301.000000)">
                                                <path className="color-background" d="M39.3,0.706666667 C38.9660984,0.370464027 38.5048767,0.192278529 38.0316667,0.216666667 C14.6516667,1.43666667 6.015,22.2633333 5.93166667,22.4733333 C5.68236407,23.0926189 5.82664679,23.8009159 6.29833333,24.2733333 L15.7266667,33.7016667 C16.2013871,34.1756798 16.9140329,34.3188658 17.535,34.065 C17.7433333,33.98 38.4583333,25.2466667 39.7816667,1.97666667 C39.8087196,1.50414529 39.6335979,1.04240574 39.3,0.706666667 Z M25.69,19.0233333 C24.7367525,19.9768687 23.3029475,20.2622391 22.0572426,19.7463614 C20.8115377,19.2304837 19.9992882,18.0149658 19.9992882,16.6666667 C19.9992882,15.3183676 20.8115377,14.1028496 22.0572426,13.5869719 C23.3029475,13.0710943 24.7367525,13.3564646 25.69,14.31 C26.9912731,15.6116662 26.9912731,17.7216672 25.69,19.0233333 L25.69,19.0233333 Z"></path>
                                                <path className="color-background" d="M1.855,31.4066667 C3.05106558,30.2024182 4.79973884,29.7296005 6.43969145,30.1670277 C8.07964407,30.6044549 9.36054508,31.8853559 9.7979723,33.5253085 C10.2353995,35.1652612 9.76258177,36.9139344 8.55833333,38.11 C6.70666667,39.9616667 0,40 0,40 C0,40 0,33.2566667 1.855,31.4066667 Z"></path>
                                                <path className="color-background" d="M17.2616667,3.90166667 C12.4943643,3.07192755 7.62174065,4.61673894 4.20333333,8.04166667 C3.31200265,8.94126033 2.53706177,9.94913142 1.89666667,11.0416667 C1.5109569,11.6966059 1.61721591,12.5295394 2.155,13.0666667 L5.47,16.3833333 C8.55036617,11.4946947 12.5559074,7.25476565 17.2616667,3.90166667 L17.2616667,3.90166667 Z" opacity="0.598539807"></path>
                                                <path className="color-background" d="M36.0983333,22.7383333 C36.9280725,27.5056357 35.3832611,32.3782594 31.9583333,35.7966667 C31.0587397,36.6879974 30.0508686,37.4629382 28.9583333,38.1033333 C28.3033941,38.4890431 27.4704606,38.3827841 26.9333333,37.845 L23.6166667,34.53 C28.5053053,31.4496338 32.7452344,27.4440926 36.0983333,22.7383333 L36.0983333,22.7383333 Z" opacity="0.598539807"></path>
                                                </g>
                                            </g>
                                            </g>
                                        </g>
                                        </svg>
                                    </div>
                                    <p className="text-xs mt-1 mb-0 font-weight-bold">Clicks</p>
                                    </div>
                                    <h4 className="font-weight-bolder">2m</h4>
                                    <div className="progress w-75">
                                    <div className="progress-bar bg-dark w-90" role="progressbar" aria-valuenow="90" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>
                                </div>
                                <div className="col-3 py-3 ps-0">
                                    <div className="d-flex mb-2">
                                    <div className="icon icon-shape icon-xxs shadow border-radius-sm bg-gradient-warning text-center me-2 d-flex align-items-center justify-content-center">
                                        <svg width="10px" height="10px" viewBox="0 0 43 36" version="1.1">
                                        <title>credit-card</title>
                                        <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                            <g transform="translate(-2169.000000, -745.000000)" fill="#FFFFFF" fillRule="nonzero">
                                            <g transform="translate(1716.000000, 291.000000)">
                                                <g transform="translate(453.000000, 454.000000)">
                                                <path className="color-background" d="M43,10.7482083 L43,3.58333333 C43,1.60354167 41.3964583,0 39.4166667,0 L3.58333333,0 C1.60354167,0 0,1.60354167 0,3.58333333 L0,10.7482083 L43,10.7482083 Z" opacity="0.593633743"></path>
                                                <path className="color-background" d="M0,16.125 L0,32.25 C0,34.2297917 1.60354167,35.8333333 3.58333333,35.8333333 L39.4166667,35.8333333 C41.3964583,35.8333333 43,34.2297917 43,32.25 L43,16.125 L0,16.125 Z M19.7083333,26.875 L7.16666667,26.875 L7.16666667,23.2916667 L19.7083333,23.2916667 L19.7083333,26.875 Z M35.8333333,26.875 L28.6666667,26.875 L28.6666667,23.2916667 L35.8333333,23.2916667 L35.8333333,26.875 Z"></path>
                                                </g>
                                            </g>
                                            </g>
                                        </g>
                                        </svg>
                                    </div>
                                    <p className="text-xs mt-1 mb-0 font-weight-bold">Sales</p>
                                    </div>
                                    <h4 className="font-weight-bolder">435$</h4>
                                    <div className="progress w-75">
                                    <div className="progress-bar bg-dark w-30" role="progressbar" aria-valuenow="30" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>
                                </div>
                                <div className="col-3 py-3 ps-0">
                                    <div className="d-flex mb-2">
                                    <div className="icon icon-shape icon-xxs shadow border-radius-sm bg-gradient-danger text-center me-2 d-flex align-items-center justify-content-center">
                                        <svg width="10px" height="10px" viewBox="0 0 40 40" version="1.1">
                                        <title>settings</title>
                                        <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                            <g transform="translate(-2020.000000, -442.000000)" fill="#FFFFFF" fillRule="nonzero">
                                            <g transform="translate(1716.000000, 291.000000)">
                                                <g transform="translate(304.000000, 151.000000)">
                                                <polygon className="color-background" opacity="0.596981957" points="18.0883333 15.7316667 11.1783333 8.82166667 13.3333333 6.66666667 6.66666667 0 0 6.66666667 6.66666667 13.3333333 8.82166667 11.1783333 15.315 17.6716667"></polygon>
                                                <path className="color-background" d="M31.5666667,23.2333333 C31.0516667,23.2933333 30.53,23.3333333 30,23.3333333 C29.4916667,23.3333333 28.9866667,23.3033333 28.48,23.245 L22.4116667,30.7433333 L29.9416667,38.2733333 C32.2433333,40.575 35.9733333,40.575 38.275,38.2733333 L38.275,38.2733333 C40.5766667,35.9716667 40.5766667,32.2416667 38.275,29.94 L31.5666667,23.2333333 Z" opacity="0.596981957"></path>
                                                <path className="color-background" d="M33.785,11.285 L28.715,6.215 L34.0616667,0.868333333 C32.82,0.315 31.4483333,0 30,0 C24.4766667,0 20,4.47666667 20,10 C20,10.99 20.1483333,11.9433333 20.4166667,12.8466667 L2.435,27.3966667 C0.95,28.7083333 0.0633333333,30.595 0.00333333333,32.5733333 C-0.0583333333,34.5533333 0.71,36.4916667 2.11,37.89 C3.47,39.2516667 5.27833333,40 7.20166667,40 C9.26666667,40 11.2366667,39.1133333 12.6033333,37.565 L27.1533333,19.5833333 C28.0566667,19.8516667 29.01,20 30,20 C35.5233333,20 40,15.5233333 40,10 C40,8.55166667 39.685,7.18 39.1316667,5.93666667 L33.785,11.285 Z"></path>
                                                </g>
                                            </g>
                                            </g>
                                        </g>
                                        </svg>
                                    </div>
                                    <p className="text-xs mt-1 mb-0 font-weight-bold">Items</p>
                                    </div>
                                    <h4 className="font-weight-bolder">43</h4>
                                    <div className="progress w-75">
                                    <div className="progress-bar bg-dark w-50" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>
                                </div>
                                </div>
                            </div>
                            </div>
                        </div>
                        </div>
                        <div className="col-lg-7">
                        <div className="card z-index-2">
                            <div className="card-header pb-0">
                            <h6>Sales overview</h6>
                            <p className="text-sm">
                                <i className="fa fa-arrow-up text-success"></i>
                                <span className="font-weight-bold">4% more</span> in 2021
                            </p>
                            </div>
                            <div className="card-body p-3">
                            <div className="chart">
                                <canvas id="chart-line" className="chart-canvas" height="300"></canvas>
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>
                
                    {/* Footer */}
                    <Footer />
                </div>
            </main>
        </div>
    );
};

export default ChannelHistory;
