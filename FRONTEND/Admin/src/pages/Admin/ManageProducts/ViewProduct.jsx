import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../../components/Admin/Header';
import Sidebar from '../../../components/Admin/Sidebar';
import Footer from '../../../components/Admin/Footer';
import ContentSkeleton from '../../../components/Common/ContentSkeleton';
import { formatDateToIST } from '../../../utils/formatDateToIST';

const ViewProduct = ({ userInfo, handleLogout }) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;
    const location = useLocation();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);

    useEffect(() => {
        if (location.state?.product) {
            setProduct(location.state.product);
            setLoading(false);
        } else {
            navigate('/manage-products');
        }
    }, [location, navigate]);

    const handleOpenPdf = () => {
        if (product?.product_description_pdf) {
            window.open(`${API_BASE}${product.product_description_pdf}`, '_blank');
        }
    };

    if (loading) {
        return (
            <div style={{ paddingTop: '15px' }}>
                <Sidebar />
                <main className="main-content position-relative h-100 mt-1 border-radius-lg">
                    <Header userInfo={userInfo} handleLogout={handleLogout} />
                    <div className="container-fluid py-4">
                        <ContentSkeleton />
                    </div>
                </main>
            </div>
        );
    }

    if (!product) {
        return (
            <div style={{ paddingTop: '15px' }}>
                <Sidebar />
                <main className="main-content position-relative h-100 mt-1 border-radius-lg">
                    <Header userInfo={userInfo} handleLogout={handleLogout} />
                    <div className="container-fluid py-4">
                        <p style={{ textAlign: 'center', color: 'red' }}>Product not found</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div style={{ paddingTop: '15px' }}>
            <Sidebar />
            <main className="main-content position-relative h-100 mt-1 border-radius-lg">
                <Header userInfo={userInfo} handleLogout={handleLogout} />
                <div className="container-fluid py-4">
                    <div className="row">
                        <div className="col-12">
                            <div className="card mb-4">
                                <div className="card-header pb-0">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h5 style={{ margin: 0 }}>Product Details</h5>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                type="button"
                                                className="btn btn-primary mb-0"
                                                onClick={() => navigate('/edit-product', { state: { product } })}
                                            >
                                                <i className="fas fa-pen" style={{ marginRight: '5px' }}></i>Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-secondary mb-0"
                                                onClick={() => navigate('/manage-products')}
                                            >
                                                Back
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-body">
                                    <div className="row" style={{ marginBottom: '30px' }}>
                                        <div className="col-md-4">
                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{ fontWeight: '600', color: '#666', fontSize: '14px', marginBottom: '5px', display: 'block' }}>Product ID</label>
                                                <p style={{ fontSize: '16px', margin: 0 }}>{product.product_id || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{ fontWeight: '600', color: '#666', fontSize: '14px', marginBottom: '5px', display: 'block' }}>Product Name</label>
                                                <p style={{ fontSize: '16px', margin: 0 }}>{product.product_name}</p>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{ fontWeight: '600', color: '#666', fontSize: '14px', marginBottom: '5px', display: 'block' }}>Status</label>
                                                <p style={{ fontSize: '16px', margin: 0 }}>
                                                    <span
                                                        className="badge"
                                                        style={{
                                                            backgroundColor: product.status ? '#28a745' : '#6c757d',
                                                            padding: '6px 12px',
                                                            borderRadius: '4px'
                                                        }}
                                                    >
                                                        {product.status ? 'Active' : 'De-Active'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{ fontWeight: '600', color: '#666', fontSize: '14px', marginBottom: '5px', display: 'block' }}>Box Size</label>
                                                <p style={{ fontSize: '16px', margin: 0 }}>{product.product_quality?.box_size || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{ fontWeight: '600', color: '#666', fontSize: '14px', marginBottom: '5px', display: 'block' }}>Created By</label>
                                                <p style={{ fontSize: '16px', margin: 0 }}>{product.createdBy || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{ fontWeight: '600', color: '#666', fontSize: '14px', marginBottom: '5px', display: 'block' }}>Created At</label>
                                                <p style={{ fontSize: '16px', margin: 0 }}>
                                                    {product.createdAt ? formatDateToIST(product.createdAt) : 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{ fontWeight: '600', color: '#666', fontSize: '14px', marginBottom: '5px', display: 'block' }}>Updated By</label>
                                                <p style={{ fontSize: '16px', margin: 0 }}>{product.updatedBy || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{ fontWeight: '600', color: '#666', fontSize: '14px', marginBottom: '5px', display: 'block' }}>Updated At</label>
                                                <p style={{ fontSize: '16px', margin: 0 }}>
                                                    {product.updatedAt ? formatDateToIST(product.updatedAt) : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '30px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
                                        <label style={{ fontWeight: '600', color: '#666', fontSize: '14px', marginBottom: '10px', display: 'block' }}>Product Description</label>
                                        <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#333' }}>
                                            {product.product_description}
                                        </p>
                                    </div>

                                    {product.product_quality?.extra_details && (
                                        <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #ddd' }}>
                                            <label style={{ fontWeight: '600', color: '#666', fontSize: '14px', marginBottom: '10px', display: 'block' }}>Extra Details</label>
                                            <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#333' }}>
                                                {product.product_quality.extra_details}
                                            </p>
                                        </div>
                                    )}

                                    {(product.product_price || product.product_gst || product.product_shipping_cost || product.product_quantity) && (
                                        <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #ddd' }}>
                                            <label style={{ fontWeight: '600', color: '#666', fontSize: '14px', marginBottom: '15px', display: 'block' }}>Pricing & Logistics</label>
                                            <div className="row">
                                                <div className="col-md-3">
                                                    <div style={{ backgroundColor: '#f0f9ff', padding: '10px 15px', borderRadius: '6px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <p style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600', margin: 0 }}>Price</p>
                                                        <p style={{ fontSize: '16px', fontWeight: '700', color: '#1e40af', margin: 0 }}>₹{product.product_price || '0'}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div style={{ backgroundColor: '#fef3f2', padding: '10px 15px', borderRadius: '6px', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <p style={{ fontSize: '12px', color: '#991b1b', fontWeight: '600', margin: 0 }}>GST</p>
                                                        <p style={{ fontSize: '16px', fontWeight: '700', color: '#991b1b', margin: 0 }}>{product.product_gst || '0'}%</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div style={{ backgroundColor: '#f0fdf4', padding: '10px 15px', borderRadius: '6px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <p style={{ fontSize: '12px', color: '#15803d', fontWeight: '600', margin: 0 }}>Shipping Cost</p>
                                                        <p style={{ fontSize: '16px', fontWeight: '700', color: '#15803d', margin: 0 }}>₹{product.product_shipping_cost || '0'}</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div style={{ backgroundColor: '#fef9e7', padding: '10px 15px', borderRadius: '6px', border: '1px solid #fde047', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <p style={{ fontSize: '12px', color: '#b45309', fontWeight: '600', margin: 0 }}>Quantity</p>
                                                        <p style={{ fontSize: '16px', fontWeight: '700', color: '#b45309', margin: 0 }}>{product.product_quantity || '0'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="row" style={{ marginBottom: '30px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
                                        <div className="col-md-2">
                                            <div style={{ paddingBottom: '20px' }}>
                                                <label style={{ fontWeight: '600', color: '#666', fontSize: '13px', marginBottom: '12px', display: 'block' }}>Description PDF</label>
                                                {product.product_description_pdf ? (
                                                    <div style={{ backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '2px solid #bfdbfe', textAlign: 'center' }}>
                                                        <i className="fas fa-file-pdf" style={{ fontSize: '40px', color: '#dc3545', marginBottom: '8px', display: 'block' }}></i>
                                                        <p style={{ fontSize: '12px', color: '#333', marginBottom: '12px', fontWeight: '500', wordBreak: 'break-word' }}>
                                                            {product.product_description_pdf.split('/').pop()}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-info mb-0"
                                                            onClick={handleOpenPdf}
                                                            style={{ width: '100%', fontSize: '12px' }}
                                                        >
                                                            <i className="fas fa-download" style={{ marginRight: '3px' }}></i>Open
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '2px solid #dee2e6', textAlign: 'center', color: '#999' }}>
                                                        <i className="fas fa-file-pdf" style={{ fontSize: '32px', marginBottom: '8px', display: 'block', color: '#ccc' }}></i>
                                                        <p style={{ fontSize: '12px' }}>No PDF</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-md-3">
                                            <div style={{ paddingBottom: '20px', paddingLeft: '10px', paddingRight: '10px' }}>
                                                <label style={{ fontWeight: '600', color: '#666', fontSize: '13px', marginBottom: '12px', display: 'block' }}>Main Product Image</label>
                                                {product.product_main_image ? (
                                                    <div
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => {
                                                            setSelectedImage(product.product_main_image);
                                                            setShowImageModal(true);
                                                        }}
                                                    >
                                                        <img
                                                            src={`${API_BASE}${product.product_main_image}`}
                                                            alt="Main product"
                                                            style={{
                                                                width: '100%',
                                                                height: '280px',
                                                                objectFit: 'cover',
                                                                borderRadius: '8px',
                                                                border: '2px solid #ddd',
                                                                cursor: 'pointer',
                                                                transition: 'transform 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.03)'}
                                                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                                        />
                                                        <p style={{ fontSize: '11px', color: '#999', marginTop: '6px', textAlign: 'center' }}>Click to view full size</p>
                                                    </div>
                                                ) : (
                                                    <div style={{ backgroundColor: '#f8f9fa', padding: '30px', borderRadius: '8px', border: '2px solid #dee2e6', textAlign: 'center', color: '#999', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                                        <i className="fas fa-image" style={{ fontSize: '40px', marginBottom: '8px', color: '#ccc' }}></i>
                                                        <p style={{ fontSize: '12px' }}>No main image</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-md-7">
                                            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                                                <label style={{ fontWeight: '600', marginBottom: '12px', display: 'block', color: '#333', fontSize: '13px' }}>Sub Images (Up to 3 - Optional)</label>
                                                <div className="row" style={{ gap: '10px', marginRight: '-5px', marginLeft: '-5px' }}>
                                                    {[0, 1, 2].map((index) => (
                                                        <div key={`sub-img-${index}`} className="col-md-3" style={{ paddingLeft: '5px', paddingRight: '5px' }}>
                                                            <label style={{ fontSize: '12px', marginBottom: '6px', display: 'block', color: '#666', fontWeight: '500' }}>Sub Image {index + 1}</label>
                                                            {product.product_sub_images && product.product_sub_images[index] ? (
                                                                <div style={{ cursor: 'pointer', position: 'relative', marginTop: '8px' }} onClick={() => {
                                                                    setSelectedImage(product.product_sub_images[index]);
                                                                    setShowImageModal(true);
                                                                }}>
                                                                    <img
                                                                        src={`${API_BASE}${product.product_sub_images[index]}`}
                                                                        alt={`Sub preview ${index + 1}`}
                                                                        style={{
                                                                            width: '100%',
                                                                            height: '200px',
                                                                            objectFit: 'cover',
                                                                            borderRadius: '6px',
                                                                            border: '2px solid #dee2e6',
                                                                            cursor: 'pointer',
                                                                            transition: 'transform 0.2s'
                                                                        }}
                                                                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.03)'}
                                                                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                                                    />
                                                                    <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: '#28a745', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                                                                        Sub {index + 1}
                                                                    </div>
                                                                    <small style={{ color: '#084298', display: 'block', marginTop: '8px', fontWeight: '500', fontSize: '11px' }}>
                                                                        ✓ Current
                                                                    </small>
                                                                </div>
                                                            ) : (
                                                                <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '6px', border: '2px solid #dee2e6', textAlign: 'center', color: '#999', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px', fontSize: '12px' }}>
                                                                    No image
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {showImageModal && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2000
                        }}
                        onClick={() => setShowImageModal(false)}
                    >
                        <div
                            style={{
                                position: 'relative',
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                padding: '20px',
                                maxWidth: '90%',
                                maxHeight: '90%'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '28px',
                                    cursor: 'pointer',
                                    color: '#666'
                                }}
                                onClick={() => setShowImageModal(false)}
                            >
                                &times;
                            </button>
                            <img
                                src={`${API_BASE}${selectedImage}`}
                                alt="Full size"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '80vh',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                    </div>
                )}

                <Footer />
            </main>
        </div>
    );
};

export default ViewProduct;
