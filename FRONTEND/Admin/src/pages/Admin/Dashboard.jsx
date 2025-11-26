import React, { useState, useEffect } from 'react';
import Header from '../../components/Admin/Header';
import Sidebar from '../../components/Admin/Sidebar';
import Footer from '../../components/Admin/Footer';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import MotorRmsCurrent from "../../charts/Admin/MotorRmsCurrent";
import PvDcVoltage from "../../charts/Admin/PvDcVoltage";
import MotorVoltageRms from "../../charts/Admin/MotorVoltageRms";
import PvCurrent from "../../charts/Admin/PvCurrent";
import axios from 'axios';
import useDashboard from '../../hooks/Admin/useDashboard';
import useLiveTelemetry from "../../hooks/Admin/useLiveTelemetry";
import useLiveStatus from "../../hooks/Admin/useLiveStatus";
import useLiveAlert from "../../hooks/Admin/useLiveAlert";
import useLiveBoot from "../../hooks/Admin/useLiveBoot";
import useLiveHeartbeat from "../../hooks/Admin/useLiveHeartbeat";

const Dashboard = ({ userInfo, handleLogout }) => {

    const { assignDevices } = useDashboard(userInfo);


    const API_KEY = 'AIzaSyD4_6anlN09mZ1H6hhnfryibQdAWfygUbo';
    const [selectedAssignedDevice, setSelectedAssignedDevice] = useState(null);
    const [latLonName, setLatLonName] = useState('');

    const telemetry = useLiveTelemetry(selectedAssignedDevice?.serial_number);
    const { status, lastStart: liveLastStart, lastStop: liveLastStop } = useLiveStatus(selectedAssignedDevice?.serial_number);
    const alert = useLiveAlert(selectedAssignedDevice?.serial_number);
    const boot = useLiveBoot(selectedAssignedDevice?.serial_number);
    const heartbeat = useLiveHeartbeat(selectedAssignedDevice?.serial_number);

    useEffect(() => {
        const savedDevice = localStorage.getItem("selectedDevice");
        if (savedDevice) setSelectedAssignedDevice(JSON.parse(savedDevice));
    }, []);

    // Clean numeric coordinates
    const cleanCoordinate = (value) => {
        if (!value) return null;

        // Extract first valid number in string
        const match = value.match(/-?\d+(\.\d+)?/);
        return match ? parseFloat(match[0]) : null;
    };


    const selectedLat = cleanCoordinate(selectedAssignedDevice?.latitude);
    const selectedLng = cleanCoordinate(selectedAssignedDevice?.longitude);

    const mapCenter = (selectedLat && selectedLng)
        ? { lat: selectedLat, lng: selectedLng }
        : { lat: 0, lng: 0 };

    //     fetchLocationName();
    // }, [selectedLat, selectedLng]);
    const formatNominatimAddress = (addr) => {
        if (!addr) return "";

        const parts = [
            addr.road,
            addr.neighbourhood,
            addr.suburb,
            addr.city || addr.town || addr.city_district,
            addr.state_district,
            addr.state,
            addr.postcode,
            addr.country
        ];

        // Remove empty and duplicate values
        const filtered = [...new Set(parts.filter(Boolean))];

        return filtered.join(", ");
    };

    useEffect(() => {
        if (!selectedLat || !selectedLng) return;

        const fetchLocationName = async () => {
            try {
                const response = await axios.get(
                    "https://nominatim.openstreetmap.org/reverse",
                    {
                        params: {
                            lat: selectedLat,
                            lon: selectedLng,
                            format: "jsonv2"
                        }
                    }
                );

                console.log("Nominatim response:", response.data);

                const addr = response.data?.address;
                if (addr) {
                    setLatLonName(formatNominatimAddress(addr));
                }

            } catch (error) {
                console.error("Address fetch error:", error);
            }
        };

        fetchLocationName();
    }, [selectedLat, selectedLng]);

    const containerStyle = {
        width: '100%',
        height: '420px',
        padding: '20px',
        borderRadius: '8px',
    };

    const computeDeviceStatus = () => {
        // if (alert?.alert_type) return "Alert";
        if (status?.motor_running === true) return "Started";
        if (status?.motor_running === false) return "Stopped";
        if (boot?.device_status === "READY") return "Ready";

        // Fallback to DB value
        if (selectedAssignedDevice?.start_status === true) return "Started";
        if (selectedAssignedDevice?.start_status === false) return "Stopped";

        return "Ready";
    };

    const computeStatusColor = (state) => {
        switch (state) {
            case "Started":
                return "text-success";
            case "Stopped":
                return "text-danger";
            case "Online":
                return "text-success";
            case "Offline":
                return "text-danger";
            case "Ready":
                return "text-warning";
            case "Alert":
                return "text-orange";
            default:
                return "text-secondary";
        }
    };

    const lastStart = liveLastStart ?? selectedAssignedDevice?.startAt;

    const lastStop = selectedAssignedDevice?.start_status ? "-" : (liveLastStop ?? selectedAssignedDevice?.stopAt);

    const deviceStatusText = computeDeviceStatus();
    const deviceStatusColor = computeStatusColor(deviceStatusText);

    
    const formatDateTime = (dateString) => {
        if (!dateString) return "-";

        const date = new Date(dateString);

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    return (
        <div className='' style={{ paddingTop: '15px' }}>
            {/* Sidebar */}
            <Sidebar />
            <main className="main-content position-relative h-100 mt-1 border-radius-lg ">
                {/* Header */}
                <Header userInfo={userInfo} handleLogout={handleLogout} />
                <div className="container-fluid py-4">
                    {/* User details start */}
                    <h4>Borewell Motor Automation Live Data</h4>
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="row">
                                <div className="col-xl-12">
                                    <div className="row">
                                        <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                                            <div className="card">
                                                <div className="card-body p-3">
                                                    <div className="row">
                                                        <div className="col-8">
                                                            <div className="numbers">
                                                                <p className="text-sm mb-0 text-capitalize font-weight-bold">Customer Name</p>
                                                                <h5 className="font-weight-bolder mb-0">
                                                                    <span className="text-success text-sm font-weight-bolder">{selectedAssignedDevice?.user_details?.user_name || '-'}</span>
                                                                </h5>
                                                            </div>
                                                        </div>
                                                        <div className="col-4 text-end">
                                                            <div className="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                                                                <i className="fas fa-user opacity-10" aria-hidden="true"></i>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                                            <div className="card">
                                                <div className="card-body p-3">
                                                    <div className="row">
                                                        <div className="col-8">
                                                            <div className="numbers">
                                                                <p className="text-sm mb-0 text-capitalize font-weight-bold">Customer Mobile</p>
                                                                <h5 className="font-weight-bolder mb-0">
                                                                    <span className="text-success text-sm font-weight-bolder">{selectedAssignedDevice?.user_details?.user_phone || '-'}</span>
                                                                </h5>
                                                            </div>
                                                        </div>
                                                        <div className="col-4 text-end">
                                                            <div className="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                                                                <i className="fas fa-phone opacity-10" aria-hidden="true"></i>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                                            <div className="card">
                                                <div className="card-body p-3">
                                                    <div className="row">
                                                        <div className="col-8">
                                                            <div className="numbers">
                                                                <p className="text-sm mb-0 text-capitalize font-weight-bold">Customer E-mail</p>
                                                                <h5 className="font-weight-bolder mb-0">
                                                                    <span className="text-success text-sm font-weight-bolder">{selectedAssignedDevice?.user_details?.user_email || '-'}</span>
                                                                </h5>
                                                            </div>
                                                        </div>
                                                        <div className="col-4 text-end">
                                                            <div className="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                                                                <i className="fas fa-envelope opacity-10" aria-hidden="true"></i>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                                            <div className="card shadow-sm border-0">
                                                <div className="card-body p-3">
                                                    <div className="d-flex justify-content-between align-items-center">

                                                        {/* Left side - Dropdown */}
                                                        <div className="flex-grow-1 pe-2">
                                                            {/* <label className="text-sm text-dark font-weight-bold mb-1">
                                                                Select Assigned Device
                                                            </label> */}
                                                            <select
                                                                className="form-control form-select"
                                                                value={selectedAssignedDevice?.serial_number || ""}
                                                                onChange={(e) => {
                                                                    const selected = assignDevices.find(
                                                                        d => d.serial_number === e.target.value
                                                                    );
                                                                    setSelectedAssignedDevice(selected);
                                                                    localStorage.setItem("selectedDevice", JSON.stringify(selected));
                                                                }}
                                                            >
                                                                <option value="">Choose Assigned Device</option>

                                                                {assignDevices.map(device => (
                                                                    <option key={device._id} value={device.serial_number}>
                                                                        {device.serial_number}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {/* Right side - Icon */}
                                                        <div className="text-end">
                                                            <div className="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                                                                <i className="fas fa-cogs text-white opacity-10"></i>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>                                      
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* User details end */}

                    {/* Data and Map start */}
                    <div className="row my-4">
                        <div className="col-lg-4 col-md-6" style={{ marginBottom: '20px' }}>
                            <div className="card h-100">
                                <div className="card-header pb-0">
                                    <h6>Serial Number</h6>
                                    <p>{selectedAssignedDevice?.serial_number || "-"}</p>
                                    <h6>IMEI Number</h6>
                                    <p>{selectedAssignedDevice?.imei_number || "-"}</p>
                                </div>
                                <div className="card-body p-3">
                                    <div className="timeline timeline-one-side">
                                        <div className="timeline-block mb-2">
                                            <span className="timeline-step">
                                                <i className="fas fa-cogs opacity-10 text-success text-gradient"></i>
                                            </span>
                                            <div className="timeline-content">
                                                <h6 className="text-dark text-sm font-weight-bold mb-0">Motor HP</h6>
                                                <p className="text-secondary font-weight-bold text-xs mt-1 mb-0">{selectedAssignedDevice?.motor_hp || "-"}</p>
                                            </div>
                                        </div>
                                        <div className="timeline-block mb-2">
                                            <span className="timeline-step">
                                                <i className="fas fa-map-marker-alt text-danger text-gradient"></i>
                                            </span>
                                            <div className="timeline-content">
                                                <h6 className="text-dark text-sm font-weight-bold mb-0">Location</h6>
                                                <p className="text-secondary font-weight-bold text-xs mt-1 mb-0">{latLonName}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="container border-radius-lg">
                                        <div className="row">

                                            {/* Last Updated */}
                                            <div className="col-12 ps-0">
                                                <div className="d-flex">
                                                    <h4 className="text-dark text-xs mt-1 mb-0 font-weight-bold">Last updated on</h4>
                                                </div>
                                                <p className="font-weight text-dark ">
                                                    {formatDateTime(selectedAssignedDevice?.updatedAt)}
                                                </p>
                                            </div>

                                            {/* Device Status */}
                                            <div className="col-12 ps-0">
                                                <div className="d-flex justify-content-between align-items-center">

                                                    {status?.motor_running === false  && (
                                                        <div>
                                                            <h4 className="text-dark text-xs mb-0 font-weight-bold">Device Status</h4>
                                                            <h6 className={`font-weight ${deviceStatusColor}`}>
                                                                {boot?.device_status || heartbeat?.device_status || '-'}
                                                            </h6>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <h4 className="text-dark text-xs mb-0 font-weight-bold">Device Start/Stop</h4>
                                                        <h6 className={`font-weight ${deviceStatusColor}`}>
                                                            {status?.motor_running === true ? "Started" :
                                                                status?.motor_running === false ? "Stopped" : "-"}
                                                        </h6>
                                                    </div>

                                                </div>
                                            </div>


                                            {/* Last Start/Stop Time */}
                                            <div className="col-12 ps-0">
                                                <div className="d-flex justify-content-between align-items-center">

                                                    <div>
                                                        <h4 className="text-dark text-xs mt-1 mb-0 font-weight-bold">Device Last Start</h4>
                                                        <p className="font-weight text-dark">
                                                            {formatDateTime(lastStart)}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-dark text-xs mt-1 mb-0 font-weight-bold">Device Last Stop</h4>
                                                        <p className="font-weight text-dark">
                                                            {status?.motor_running === true 
                                                                ? "-"
                                                                : formatDateTime(lastStop)}
                                                        </p>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-8 col-md-6 mb-md-0 mb-4">
                            <div className="card">
                                <div className="card-header pb-0">
                                    <div className="row">
                                        <div className="col-lg-6 col-7">
                                            <h6>Device live location</h6>
                                            <p className="text-sm mb-0">
                                                <span className="font-weight-bold ms-1" id="Latitude">Latitude: </span>({selectedAssignedDevice?.latitude || '-'})
                                                <span className="font-weight-bold ms-1" id="Longitude">Longitude: </span>({selectedAssignedDevice?.longitude || '-'})
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-body px-0 pb-2" style={{ paddingTop: '0' }}>
                                    <div className="table-responsive">
                                        <div style={{ width: '100%', height: '470px', position: 'relative', padding: '20px' }}>
                                            <LoadScript googleMapsApiKey={API_KEY}>
                                                <GoogleMap
                                                    mapContainerStyle={containerStyle}
                                                    center={mapCenter}
                                                    zoom={selectedLat && selectedLng ? 14 : 2}
                                                >
                                                    {selectedLat && selectedLng && (
                                                        <Marker position={{ lat: selectedLat, lng: selectedLng }} />
                                                    )}
                                                </GoogleMap>
                                            </LoadScript>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Data and Map end */}

                    {/* Datas card start*/}
                    <div>
                        <div className="row" style={{ marginTop: '24px' }}>
                            <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                                <div className="card">
                                    <div className="card-body p-3">
                                        <div className="row">
                                            <div className="col-8">
                                                <div className="numbers">
                                                    <p className="text-sm mb-0 text-capitalize font-weight-bold">Motor Frequency</p>
                                                    <h5 className="font-weight-bolder mb-0" id="Frequency">
                                                        {telemetry?.motor_frequency_hz.toFixed(2) ?? "-"}
                                                        <span className="text-success text-sm font-weight-bolder"> HZ</span>
                                                    </h5>
                                                </div>
                                            </div>
                                            <div className="col-4 text-end">
                                                <div className="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                                                    <i className="fas fa-wave-square text-lg opacity-10" aria-hidden="true"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                                <div className="card">
                                    <div className="card-body p-3">
                                        <div className="row">
                                            <div className="col-8">
                                                <div className="numbers">
                                                    <p className="text-sm mb-0 text-capitalize font-weight-bold">Motor Energy</p>
                                                    <h5 className="font-weight-bolder mb-0">
                                                        {telemetry?.energy_kwh.toFixed(2) ?? "-"}
                                                        <span className="text-success text-sm font-weight-bolder"> kWh</span>
                                                    </h5>
                                                </div>
                                            </div>
                                            <div className="col-4 text-end">
                                                <div className="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                                                    <i className="fas fa-bolt text-lg opacity-10" aria-hidden="true"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                                <div className="card">
                                    <div className="card-body p-3">
                                        <div className="row">
                                            <div className="col-8">
                                                <div className="numbers">
                                                    <p className="text-sm mb-0 text-capitalize font-weight-bold">Alert</p>
                                                    <h5 className="font-weight-bolder mb-0">
                                                        {alert?.alert_type ?? "-"}
                                                        {/* <span className="text-danger text-sm font-weight-bolder">Device</span> */}
                                                    </h5>
                                                </div>
                                            </div>
                                            <div className="col-4 text-end">
                                                <div className="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                                                    <i className="fas fa-exclamation-triangle text-lg opacity-10" aria-hidden="true"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xl-3 col-sm-6">
                                <div className="card">
                                    <div className="card-body p-3">
                                        <div className="row">
                                            <div className="col-8">
                                                <div className="numbers">
                                                    <p className="text-sm mb-0 text-capitalize font-weight-bold">Device Temperature</p>
                                                    <h5 className="font-weight-bolder mb-0">
                                                        {telemetry?.device_temp_c.toFixed(2) ?? "-"}
                                                        <span className="text-success text-sm font-weight-bolder"> °C</span>
                                                    </h5>
                                                </div>
                                            </div>
                                            <div className="col-4 text-end">
                                                <div className="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                                                    <i className="fas fa-temperature-high text-lg opacity-10" aria-hidden="true"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row" style={{ marginTop: '24px' }}>
                            <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                                <div className="card">
                                    <div className="card-body p-3">
                                        <div className="row">
                                            <div className="col-8">
                                                <div className="numbers">
                                                    <p className="text-sm mb-0 text-capitalize font-weight-bold">Motor Power</p>
                                                    <h5 className="font-weight-bolder mb-0">
                                                        {telemetry?.power_kw.toFixed(2) ?? "-"}
                                                        <span className="text-success text-sm font-weight-bolder"> kW</span>
                                                    </h5>
                                                </div>
                                            </div>
                                            <div className="col-4 text-end">
                                                <div className="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                                                    <i className="fas fa-plug text-lg opacity-10" aria-hidden="true"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                                <div className="card">
                                    <div className="card-body p-3">
                                        <div className="row">
                                            <div className="col-8">
                                                <div className="numbers">
                                                    <p className="text-sm mb-0 text-capitalize font-weight-bold">Flow Rate</p>
                                                    <h5 className="font-weight-bolder mb-0">
                                                        {telemetry?.flow_lpm.toFixed(2) ?? "-"}
                                                        <span className="text-success text-sm font-weight-bolder"> LPM</span>
                                                    </h5>
                                                </div>
                                            </div>
                                            <div className="col-4 text-end">
                                                <div className="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                                                    <i className="fas fa-water text-lg opacity-10" aria-hidden="true"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
                                <div className="card">
                                    <div className="card-body p-3">
                                        <div className="row">
                                            <div className="col-8">
                                                <div className="numbers">
                                                    <p className="text-sm mb-0 text-capitalize font-weight-bold">Motor Speed</p>
                                                    <h5 className="font-weight-bolder mb-0">
                                                        {telemetry?.motor_rpm.toFixed(2) ?? "-"}
                                                        <span className="text-success text-sm font-weight-bolder"> RPM</span>
                                                    </h5>
                                                </div>
                                            </div>
                                            <div className="col-4 text-end">
                                                <div className="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                                                    <i className="fas fa-tachometer-alt text-lg opacity-10" aria-hidden="true"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xl-3 col-sm-6">
                                <div className="card">
                                    <div className="card-body p-3">
                                        <div className="row">
                                            <div className="col-8">
                                                <div className="numbers">
                                                    <p className="text-sm mb-0 text-capitalize font-weight-bold">Signal Strength</p>
                                                    <h5 className="font-weight-bolder mb-0">
                                                        {telemetry?.signal_strength.toFixed(2) ?? "-"}
                                                        <span className="text-success text-sm font-weight-bolder"></span>
                                                    </h5>
                                                </div>
                                            </div>
                                            <div className="col-4 text-end">
                                                <div className="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                                                    <i className="fas fa-wifi text-lg opacity-10" aria-hidden="true"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Datas card start*/}

                    {/* Chart start */}
                    <div className="row mt-4">
                        <div className="col-lg-3 mb-lg-0 mb-4">
                            <div className="card">
                                <div className="card-body p-3">
                                    <p className="mb-1 pt-2 text-bold text-center">Motor RMS Current</p>
                                    <MotorRmsCurrent />
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 mb-lg-0 mb-4">
                            <div className="card">
                                <div className="card-body p-3">
                                    <p className="mb-1 pt-2 text-bold text-center">PV / DC Voltage</p>
                                    <PvDcVoltage />
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 mb-lg-0 mb-4">
                            <div className="card">
                                <div className="card-body p-3">
                                    <p className="mb-1 pt-2 text-bold text-center">Motor Voltage RMS</p>
                                    <MotorVoltageRms />
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 mb-lg-0 mb-4">
                            <div className="card">
                                <div className="card-body p-3">
                                    <p className="mb-1 pt-2 text-bold text-center">PV Current</p>
                                    <PvCurrent />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* chart end */}

                    {/* Footer */}
                    <Footer />
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
