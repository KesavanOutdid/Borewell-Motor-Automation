import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/Admin/Header';
import Sidebar from '../../../components/Admin/Sidebar';
import Footer from '../../../components/Admin/Footer';
import CardSkeleton from '../../../components/Common/CardSkeleton';
import useManageProducts from '../../../hooks/Admin/ManageProducts/useManageProducts';

const ManageProducts = ({ userInfo, handleLogout }) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const searchTimeoutRef = useRef(null);
    const {
        products,
        errorProducts,
        loadingProducts,
        pagination,
        handlePageChange,
        handleLimitChange,
        handleProductDelete,
        fetchProductData
    } = useManageProducts(userInfo);

    const fetchProductDataCalled = useRef(false);

    useEffect(() => {
        if (!fetchProductDataCalled.current) {
            fetchProductData();
            fetchProductDataCalled.current = true;
        }
    }, [fetchProductData]);

    // Handle search with debounce
    const handleSearch = (query) => {
        setSearchQuery(query);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            fetchProductData(1, pagination.limit, query);
        }, 500);
    };

    const handleViewProduct = (product) => {
        navigate('/view-product', { state: { product } });
    };

    const handleEditProduct = (product) => {
        navigate('/edit-product', { state: { product } });
    };

    const handleDeleteProduct = async (id, productName) => {
        await handleProductDelete(id, productName);
        fetchProductData();
    };

    return (
        <div style={{ paddingTop: '15px' }}>
            <Sidebar />
            <main className="main-content position-relative h-100 mt-1 border-radius-lg">
                <Header userInfo={userInfo} handleLogout={handleLogout} />
                <div className="container-fluid py-4">
                    <div className="row">
                        <div className="col-12">
                            <div className="card mb-4">
                                <div className="card-header pb-3">
                                    <div className="row g-2 align-items-center mb-3">
                                        <div className="row g-2 align-items-center">
                                            <div className="col-md-2 col-6 d-flex align-items-center">
                                                <button className="btn btn-primary mb-0" style={{ padding: '10px', width: '50%' }} onClick={() => navigate('/create-product')}>
                                                    <i className="fas fa-file" aria-hidden="true" style={{ color: 'white' }}></i> Create
                                                </button>
                                            </div>
                                            <div className="col-md-2 col-6">
                                                <div style={{ backgroundColor: '#f0f9ff', padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Total</p>
                                                    <p style={{ fontSize: '18px', color: '#1e40af', fontWeight: '700', margin: 0 }}>{pagination?.totalProducts || 0}</p>
                                                </div>
                                            </div>
                                            <div className="col-md-2 col-6">
                                                <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Active</p>
                                                    <p style={{ fontSize: '18px', color: '#15803d', fontWeight: '700', margin: 0 }}>{pagination?.totalActiveProducts || 0}</p>
                                                </div>
                                            </div>
                                            <div className="col-md-2 col-6">
                                                <div style={{ backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Inactive</p>
                                                    <p style={{ fontSize: '18px', color: '#991b1b', fontWeight: '700', margin: 0 }}>{pagination?.totalInactiveProducts || 0}</p>
                                                </div>
                                            </div>
                                            <div className="col-md-2 col-6">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="🔍 Search products..."
                                                    value={searchQuery}
                                                    onChange={(e) => handleSearch(e.target.value)}
                                                    style={{ borderRadius: '6px', padding: '10px 15px', fontSize: '14px' }}
                                                />
                                            </div>

                                        </div>


                                    </div>

                                    {/* <div className="row g-2 align-items-center">
                                        <div className="col-md-3 col-6">
                                            <div style={{ backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Total</p>
                                                <p style={{ fontSize: '18px', color: '#1e40af', fontWeight: '700', margin: 0 }}>{pagination?.totalProducts || 0}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-3 col-6">
                                            <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Active</p>
                                                <p style={{ fontSize: '18px', color: '#15803d', fontWeight: '700', margin: 0 }}>{pagination?.totalActiveProducts || 0}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-3 col-6">
                                            <div style={{ backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{ fontSize: '11px', color: '#7a8a99', fontWeight: '600', margin: 0, flex: 1 }}>Inactive</p>
                                                <p style={{ fontSize: '18px', color: '#991b1b', fontWeight: '700', margin: 0 }}>{pagination?.totalInactiveProducts || 0}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-3 col-6">
                                            <select
                                                className="form-control"
                                                style={{ padding: '8px', fontSize: '13px' }}
                                                value={pagination.limit}
                                                onChange={(e) => handleLimitChange(parseInt(e.target.value), searchQuery)}
                                            >
                                                <option value={5}>Show: 5</option>
                                                <option value={8}>Show: 8</option>
                                                <option value={12}>Show: 12</option>
                                                <option value={20}>Show: 20</option>
                                            </select>
                                        </div>
                                    </div> */}

                                </div>

                                <div className="card-body">
                                    {loadingProducts ? (
                                        <CardSkeleton cards={pagination.limit || 5} />
                                    ) : errorProducts ? (
                                        <div style={{ textAlign: 'center', color: 'red', padding: '40px' }}>
                                            <p>{errorProducts}</p>
                                        </div>
                                    ) : products && products.length > 0 ? (
                                        <>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                                                {products.map((product, index) => (
                                                    <div
                                                        key={`product-${index}`}
                                                        style={{
                                                            backgroundColor: '#fff',
                                                            borderRadius: '10px',
                                                            border: '1px solid #e0e0e0',
                                                            overflow: 'hidden',
                                                            transition: 'all 0.3s ease',
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                                            cursor: 'pointer'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                        }}
                                                    >
                                                        <div style={{ position: 'relative', width: '100%', height: '200px', backgroundColor: '#f5f5f5', overflow: 'hidden' }}>
                                                            <img
                                                                src={`${API_BASE}${product.product_main_image}`}
                                                                alt={product.product_name}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover',
                                                                    cursor: 'pointer'
                                                                }}
                                                                onClick={() => handleViewProduct(product)}
                                                            />
                                                            <div style={{
                                                                position: 'absolute',
                                                                top: '10px',
                                                                right: '10px',
                                                                backgroundColor: product.status ? '#15803d' : '#6c757d',
                                                                color: 'white',
                                                                padding: '4px 10px',
                                                                borderRadius: '4px',
                                                                fontSize: '11px',
                                                                fontWeight: '600'
                                                            }}>
                                                                {product.status ? 'Active' : 'Inactive'}
                                                            </div>
                                                            {!product.product_quantity && (
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    top: '50%',
                                                                    left: '50%',
                                                                    transform: 'translate(-50%, -50%)',
                                                                    backgroundColor: 'rgba(220, 38, 38, 0.95)',
                                                                    color: 'white',
                                                                    padding: '8px 16px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '13px',
                                                                    fontWeight: '700',
                                                                    backdropFilter: 'blur(2px)',
                                                                    zIndex: 10
                                                                }}>
                                                                    OUT OF STOCK
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div style={{ padding: '15px' }}>
                                                            <h6 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0', color: '#333', minHeight: '35px', maxHeight: '35px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {product.product_name}
                                                            </h6>

                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px', fontSize: '12px' }}>
                                                                <div style={{ backgroundColor: '#f0f9ff', padding: '8px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                                                                    <p style={{ fontSize: '10px', color: '#1e40af', fontWeight: '600', margin: '0 0 2px 0' }}>Price</p>
                                                                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#1e40af', margin: 0 }}>₹{product.product_price || 0}</p>
                                                                </div>
                                                                <div style={{ backgroundColor: product.product_quantity ? '#fef9e7' : '#fee2e2', padding: '8px', borderRadius: '4px', border: product.product_quantity ? '1px solid #fde047' : '1px solid #fca5a5' }}>
                                                                    <p style={{ fontSize: '10px', color: product.product_quantity ? '#b45309' : '#dc2626', fontWeight: '600', margin: '0 0 2px 0' }}>Qty</p>
                                                                    <p style={{ fontSize: '14px', fontWeight: '700', color: product.product_quantity ? '#b45309' : '#dc2626', margin: 0 }}>{product.product_quantity || 'Out of Stock'}</p>
                                                                </div>
                                                            </div>

                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px', fontSize: '11px', color: '#666' }}>
                                                                <div>
                                                                    <p style={{ margin: 0, fontWeight: '600' }}>Created</p>
                                                                    <p style={{ margin: 0, fontSize: '10px' }}>{new Date(product.createdAt).toLocaleDateString()}</p>
                                                                </div>
                                                                <div>
                                                                    <p style={{ margin: 0, fontWeight: '600' }}>Updated</p>
                                                                    <p style={{ margin: 0, fontSize: '10px' }}>{product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'N/A'}</p>
                                                                </div>
                                                            </div>

                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                                                                <button
                                                                    className="btn btn-sm btn-primary mb-0"
                                                                    style={{ padding: '6px', fontSize: '11px' }}
                                                                    onClick={() => handleViewProduct(product)}
                                                                    title="View Product"
                                                                >
                                                                    <i className="fas fa-eye"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-info mb-0"
                                                                    style={{ padding: '6px', fontSize: '11px' }}
                                                                    onClick={() => handleEditProduct(product)}
                                                                    title="Edit Product"
                                                                >
                                                                    <i className="fas fa-pen"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-danger mb-0"
                                                                    style={{ padding: '6px', fontSize: '11px' }}
                                                                    onClick={() => handleDeleteProduct(product._id, product.product_name)}
                                                                    title="Delete Product"
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {products && products.length > 0 && pagination && (
                                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 px-3">
                                                    {/* Results info */}
                                                    <div className="mb-2 mb-md-0">
                                                        <span className="text-sm text-muted">
                                                            Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalPages)} of {pagination.totalPages} Products
                                                        </span>
                                                    </div>

                                                    {/* Pagination controls */}
                                                    <div className="d-flex flex-column flex-sm-row align-items-center gap-2">
                                                        {/* Items per page selector */}
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className="text-sm">Show:</span>
                                                            <select
                                                                className="form-select form-select-sm"
                                                                style={{ width: 'auto', minWidth: '70px' }}
                                                                value={pagination.limit}
                                                                onChange={(e) => handleLimitChange(parseInt(e.target.value), searchQuery)}
                                                            >
                                                                <option value={5}>5</option>
                                                                <option value={10}>10</option>
                                                                <option value={25}>25</option>
                                                                <option value={50}>50</option>
                                                            </select>
                                                            <span className="text-sm">per page</span>
                                                        </div>

                                                        {/* Page navigation */}
                                                        <nav aria-label="User pagination">
                                                            <ul className="pagination pagination-sm mb-0">
                                                                {/* Previous button */}
                                                                <li className={`page-item ${!pagination.hasPrevPage ? 'disabled' : ''}`}>
                                                                    <button
                                                                        className="page-link"
                                                                        onClick={() => handlePageChange(pagination.currentPage - 1, searchQuery)}
                                                                        disabled={!pagination.hasPrevPage}
                                                                        aria-label="Previous"
                                                                    >
                                                                        <i className="fas fa-chevron-left"></i>
                                                                    </button>
                                                                </li>

                                                                {/* Page numbers */}
                                                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                                                    let pageNum;
                                                                    if (pagination.totalPages <= 5) {
                                                                        pageNum = i + 1;
                                                                    } else if (pagination.currentPage <= 3) {
                                                                        pageNum = i + 1;
                                                                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                                                                        pageNum = pagination.totalPages - 4 + i;
                                                                    } else {
                                                                        pageNum = pagination.currentPage - 2 + i;
                                                                    }

                                                                    return (
                                                                        <li key={`page-${pageNum}`} className={`page-item ${pageNum === pagination.currentPage ? 'active' : ''}`}>
                                                                            <button
                                                                                className="page-link"
                                                                                onClick={() => handlePageChange(pageNum, searchQuery)}
                                                                            >
                                                                                {pageNum}
                                                                            </button>
                                                                        </li>
                                                                    );
                                                                })}

                                                                {/* Next button */}
                                                                <li className={`page-item ${!pagination.hasNextPage ? 'disabled' : ''}`}>
                                                                    <button
                                                                        className="page-link"
                                                                        onClick={() => handlePageChange(pagination.currentPage + 1, searchQuery)}
                                                                        disabled={!pagination.hasNextPage}
                                                                        aria-label="Next"
                                                                    >
                                                                        <i className="fas fa-chevron-right"></i>
                                                                    </button>
                                                                </li>
                                                            </ul>
                                                        </nav>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '40px' }}>
                                            <p>{searchQuery ? `No products found matching "${searchQuery}"` : 'No products available.'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </main>
        </div>
    );
};

export default ManageProducts;
