import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../../components/Admin/Header';
import Sidebar from '../../../components/Admin/Sidebar';
import Footer from '../../../components/Admin/Footer';
import { showAlertSuccess, showAlertError } from '../../../utils/alert';

const EditProduct = ({ userInfo, handleLogout }) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;
    const location = useLocation();
    const navigate = useNavigate();

    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [productDescriptionPdf, setProductDescriptionPdf] = useState('');
    const [pdfFile, setPdfFile] = useState(null);
    const [mainImageFile, setMainImageFile] = useState(null);
    const [subImageFiles, setSubImageFiles] = useState([null, null, null]);
    const [mainImagePreview, setMainImagePreview] = useState('');
    const [subImagePreviews, setSubImagePreviews] = useState([null, null, null]);
    const [boxSize, setBoxSize] = useState('');
    const [extraDetails, setExtraDetails] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productGst, setProductGst] = useState('');
    const [productShippingCost, setProductShippingCost] = useState('');
    const [productQuantity, setProductQuantity] = useState('');
    const [status, setStatus] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [productId, setProductId] = useState('');
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [originalData, setOriginalData] = useState({});

    useEffect(() => {
        if (location.state?.product) {
            const product = location.state.product;
            setProductId(product._id);
            setProductName(product.product_name || '');
            setProductDescription(product.product_description || '');
            setProductDescriptionPdf(product.product_description_pdf || '');
            setMainImagePreview(product.product_main_image || '');
            setBoxSize(product.product_quality?.box_size || '');
            setExtraDetails(product.product_quality?.extra_details || '');
            setProductPrice(product.product_price || '');
            setProductGst(product.product_gst || '');
            setProductShippingCost(product.product_shipping_cost || '');
            setProductQuantity(product.product_quantity || '');
            setStatus(product.status !== false);
            setSubImagePreviews(product.product_sub_images || [null, null, null]);

            setOriginalData({
                product_name: product.product_name,
                product_description: product.product_description,
                product_description_pdf: product.product_description_pdf,
                main_image: product.product_main_image,
                box_size: product.product_quality?.box_size,
                extra_details: product.product_quality?.extra_details,
                product_price: product.product_price,
                product_gst: product.product_gst,
                product_shipping_cost: product.product_shipping_cost,
                product_quantity: product.product_quantity,
                status: product.status,
                sub_images: product.product_sub_images
            });
        } else {
            navigate('/manage-products');
        }
    }, [location, navigate]);

    useEffect(() => {
        const isDirty =
            productName !== originalData.product_name ||
            productDescription !== originalData.product_description ||
            productDescriptionPdf !== originalData.product_description_pdf ||
            mainImageFile !== null ||
            boxSize !== (originalData.box_size || '') ||
            extraDetails !== (originalData.extra_details || '') ||
            productPrice !== (originalData.product_price || '') ||
            productGst !== (originalData.product_gst || '') ||
            productShippingCost !== (originalData.product_shipping_cost || '') ||
            productQuantity !== (originalData.product_quantity || '') ||
            status !== originalData.status ||
            subImageFiles.some(f => f !== null);

        setIsFormDirty(isDirty);
    }, [productName, productDescription, productDescriptionPdf, mainImageFile, boxSize, extraDetails, productPrice, productGst, productShippingCost, productQuantity, status, subImageFiles, originalData]);

    const handlePdfChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setPdfFile(file);
            setProductDescriptionPdf(file.name);
            setErrorMessage('');
        } else {
            setErrorMessage('Only PDF files are allowed');
            setPdfFile(null);
        }
    };

    const handleMainImageChange = (e) => {
        const file = e.target.files[0];
        if (file && ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
            setMainImageFile(file);
            const reader = new FileReader();
            reader.onload = (event) => setMainImagePreview(event.target.result);
            reader.readAsDataURL(file);
            setErrorMessage('');
        } else {
            setErrorMessage('Only PNG and JPG images are allowed for main image');
        }
    };

    const handleSubImageChange = (e, index) => {
        const file = e.target.files[0];
        if (file && ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
            const updated = [...subImageFiles];
            updated[index] = file;
            setSubImageFiles(updated);

            const reader = new FileReader();
            reader.onload = (event) => {
                const previews = [...subImagePreviews];
                previews[index] = event.target.result;
                setSubImagePreviews(previews);
            };
            reader.readAsDataURL(file);
            setErrorMessage('');
        } else {
            setErrorMessage('Only PNG and JPG images are allowed for sub images');
        }
    };

    const uploadFile = async (file, endpoint) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE}/admin/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: formData
            });

            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
            }

            if (!response.ok) {
                throw new Error(data.message || `Error uploading file`);
            }

            return data.filePath;
        } catch (error) {
            console.error(`Upload error:`, error);
            throw error;
        }
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();

        if (!productName.trim()) return setErrorMessage('Product name is required');
        
        // Product Name Validation: Only letters and numbers
        const productNameRegex = /^[a-zA-Z0-9\s]+$/;
        if (!productNameRegex.test(productName)) {
            return setErrorMessage('Product name should contain only letters and numbers');
        }

        if (!productDescription.trim()) return setErrorMessage('Product description is required');

        // Box Size Validation: Allow only numbers and '*'
        const boxSizeRegex = /^[\d*]*$/;
        if (boxSize.trim() && !boxSizeRegex.test(boxSize.trim())) {
            return setErrorMessage('Invalid Box Size format. Only numbers and "*" are allowed (e.g., 3*6)');
        }

        // Numeric fields validation
        if (productPrice && isNaN(productPrice)) return setErrorMessage('Price must be a number');
        if (productGst && isNaN(productGst)) return setErrorMessage('GST must be a number');
        if (productShippingCost && isNaN(productShippingCost)) return setErrorMessage('Shipping Cost must be a number');
        if (productQuantity && !/^\d+$/.test(productQuantity)) return setErrorMessage('Quantity must be an integer');

        if (loading) return;
        setLoading(true);
        setErrorMessage('');

        try {
            let mainImagePath = mainImagePreview;
            let pdfPath = productDescriptionPdf;
            let subImagePaths = [...subImagePreviews];

            if (pdfFile) {
                pdfPath = await uploadFile(pdfFile, 'uploadPDF');
            }

            if (mainImageFile) {
                mainImagePath = await uploadFile(mainImageFile, 'uploadImage');
            }

            for (let i = 0; i < subImageFiles.length; i++) {
                if (subImageFiles[i]) {
                    const path = await uploadFile(subImageFiles[i], 'uploadImage');
                    subImagePaths[i] = path;
                }
            }

            const response = await fetch(`${API_BASE}/admin/updateProduct`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({
                    id: productId,
                    product_name: productName.trim(),
                    product_description: productDescription.trim(),
                    product_description_pdf: pdfPath,
                    product_main_image: mainImagePath,
                    product_sub_images: subImagePaths.filter(img => img),
                    product_quality: {
                        box_size: boxSize.trim() || null,
                        extra_details: extraDetails.trim() || null
                    },
                    product_price: productPrice ? parseFloat(productPrice) : 0,
                    product_gst: productGst ? parseFloat(productGst) : 0,
                    product_shipping_cost: productShippingCost ? parseFloat(productShippingCost) : 0,
                    product_quantity: productQuantity ? parseInt(productQuantity) : 0,
                    status: status,
                    updatedBy: userInfo?.user?.user_email
                })
            });

            const contentType = response.headers.get("content-type");
            let res;
            if (contentType && contentType.includes("application/json")) {
                res = await response.json();
            } else {
                const text = await response.text();
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
            }

            if (!response.ok) {
                const errorMsg = res.message || 'Error updating product';
                setErrorMessage(errorMsg);
                showAlertError(errorMsg);
                setLoading(false);
                return;
            }

            showAlertSuccess('Product updated successfully!');
            navigate('/manage-products');
        } catch (err) {
            console.log('Update Product Error:', err);
            const errorMsg = err.message || 'Error updating product';
            setErrorMessage(errorMsg);
            showAlertError(errorMsg);
            setLoading(false);
        }

        setLoading(false);
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
                                <div className="card-header pb-0">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h5 style={{ margin: 0 }}>Edit Product</h5>
                                        <button
                                            type="button"
                                            className="btn btn-secondary mb-0"
                                            onClick={() => navigate('/manage-products')}
                                        >
                                            Back
                                        </button>
                                    </div>
                                </div>

                                <div className="card-body">
                                    <form onSubmit={handleUpdateProduct}>
                                        {errorMessage && (
                                            <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '4px', marginBottom: '15px' }}>
                                                {errorMessage}
                                            </div>
                                        )}

                                        <div className="row">
                                            <div className="col-md-6">
                                                <div style={{ marginBottom: '20px' }}>
                                                    <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Product Name *</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={productName}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            // Filter out special characters
                                                            if (val === '' || /^[a-zA-Z0-9\s]*$/.test(val)) {
                                                                setProductName(val);
                                                                setErrorMessage('');
                                                            } else {
                                                                setErrorMessage('Product name should contain only letters and numbers');
                                                            }
                                                        }}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="col-md-3">
                                                <div style={{ marginBottom: '20px' }}>
                                                    <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Box Size</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={boxSize}
                                                        onChange={(e) => setBoxSize(e.target.value.replace(/[^\d*]/g, ''))}
                                                    />
                                                </div>
                                            </div>

                                            <div className="col-md-3">
                                                <div style={{ marginBottom: '20px' }}>
                                                    <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Status</label>
                                                    <select
                                                        className="form-control"
                                                        value={status ? 'true' : 'false'}
                                                        onChange={(e) => setStatus(e.target.value === 'true')}
                                                    >
                                                        <option value="true">Active</option>
                                                        <option value="false">De-Active</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Product Description *</label>
                                            <textarea
                                                className="form-control"
                                                rows="4"
                                                value={productDescription}
                                                onChange={(e) => setProductDescription(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Extra Details</label>
                                            <textarea
                                                className="form-control"
                                                rows="3"
                                                value={extraDetails}
                                                onChange={(e) => setExtraDetails(e.target.value)}
                                            />
                                        </div>

                                        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #dee2e6' }}>
                                            <h6 style={{ marginTop: 0, marginBottom: '15px', fontWeight: '600', color: '#333' }}>Pricing & Logistics</h6>
                                            <div className="row">
                                                <div className="col-md-3">
                                                    <div style={{ marginBottom: '15px' }}>
                                                        <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Price (₹)</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            value={productPrice}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                                                                    setProductPrice(val);
                                                                }
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (['e', 'E', '+', '-'].includes(e.key)) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            placeholder="0.00"
                                                            step="0.01"
                                                            min="0"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div style={{ marginBottom: '15px' }}>
                                                        <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>GST (%)</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            value={productGst}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === '') {
                                                                    setProductGst(val);
                                                                    return;
                                                                }
                                                                if (/^\d*\.?\d{0,2}$/.test(val)) {
                                                                    const num = parseFloat(val);
                                                                    if (num <= 100) {
                                                                        setProductGst(val);
                                                                    }
                                                                }
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (['e', 'E', '+', '-'].includes(e.key)) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            placeholder="0.00"
                                                            step="0.01"
                                                            min="0"
                                                            max="100"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div style={{ marginBottom: '15px' }}>
                                                        <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Shipping Cost (₹)</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            value={productShippingCost}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                                                                    setProductShippingCost(val);
                                                                }
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (['e', 'E', '+', '-'].includes(e.key)) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            placeholder="0.00"
                                                            step="0.01"
                                                            min="0"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div style={{ marginBottom: '15px' }}>
                                                        <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Quantity</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            value={productQuantity}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === '' || /^\d+$/.test(val)) {
                                                                    setProductQuantity(val);
                                                                }
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (['.', 'e', 'E', '+', '-'].includes(e.key)) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            placeholder="0"
                                                            step="1"
                                                            min="0"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-2">
                                                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                                                    <label style={{ fontWeight: '600', marginBottom: '12px', display: 'block', color: '#333', fontSize: '13px' }}>Description PDF (Optional)</label>
                                                    <input
                                                        type="file"
                                                        className="form-control"
                                                        accept=".pdf"
                                                        onChange={handlePdfChange}
                                                        style={{ marginBottom: '10px', fontSize: '11px' }}
                                                    />
                                                    {pdfFile && (
                                                        <div style={{ backgroundColor: '#d4edda', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                                                            <small style={{ color: '#155724', display: 'block', fontWeight: '500', fontSize: '11px' }}>
                                                                ✓ {pdfFile.name}
                                                            </small>
                                                            <small style={{ color: '#155724', fontSize: '11px' }}>New file</small>
                                                        </div>
                                                    )}
                                                    {productDescriptionPdf && !pdfFile && (
                                                        <div style={{ backgroundColor: '#cfe2ff', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                                                            <small style={{ color: '#084298', display: 'block', fontWeight: '500', fontSize: '11px' }}>
                                                                ✓ {productDescriptionPdf.split('/').pop()}
                                                            </small>
                                                            <small style={{ color: '#084298', fontSize: '11px' }}>Current</small>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="col-md-3">
                                                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                                                    <label style={{ fontWeight: '600', marginBottom: '12px', display: 'block', color: '#333', fontSize: '13px' }}>Main Product Image *</label>
                                                    <input
                                                        type="file"
                                                        className="form-control"
                                                        accept="image/png,image/jpeg"
                                                        onChange={handleMainImageChange}
                                                        style={{ marginBottom: '10px', fontSize: '12px' }}
                                                    />
                                                    {mainImagePreview && (
                                                        <div style={{ marginTop: '10px' }}>
                                                            <img
                                                                src={
                                                                    mainImagePreview.startsWith('data:') || mainImagePreview.startsWith('blob:')
                                                                        ? mainImagePreview
                                                                        : `${API_BASE}${mainImagePreview}`
                                                                }
                                                                alt="Main preview"
                                                                style={{
                                                                    width: '100%',
                                                                    height: '200px',
                                                                    objectFit: 'cover',
                                                                    borderRadius: '6px',
                                                                    border: '2px solid #dee2e6'
                                                                }}
                                                            />
                                                            {mainImageFile && (
                                                                <small style={{ color: '#155724', display: 'block', marginTop: '8px', fontWeight: '500', fontSize: '11px' }}>
                                                                    ✓ {mainImageFile.name}
                                                                </small>
                                                            )}
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
                                                                <input
                                                                    type="file"
                                                                    className="form-control"
                                                                    accept="image/png,image/jpeg"
                                                                    onChange={(e) => handleSubImageChange(e, index)}
                                                                    style={{ fontSize: '11px', marginBottom: '8px' }}
                                                                />
                                                                {(subImageFiles[index] || subImagePreviews[index]) && (
                                                                    <div style={{ position: 'relative', marginTop: '8px' }}>
                                                                        <img
                                                                            src={
                                                                                subImageFiles[index]
                                                                                    ? subImagePreviews[index]
                                                                                    : (subImagePreviews[index].startsWith('data:') || subImagePreviews[index].startsWith('blob:')
                                                                                        ? subImagePreviews[index]
                                                                                        : `${API_BASE}${subImagePreviews[index]}`)
                                                                            }
                                                                            alt={`Sub preview ${index + 1}`}
                                                                            style={{
                                                                                width: '100%',
                                                                                height: '200px',
                                                                                objectFit: 'cover',
                                                                                borderRadius: '6px',
                                                                                border: '2px solid #dee2e6'
                                                                            }}
                                                                        />
                                                                        <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: '#28a745', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                                                                            Sub {index + 1}
                                                                        </div>
                                                                        {subImageFiles[index] && (
                                                                            <small style={{ color: '#155724', display: 'block', marginTop: '8px', fontWeight: '500', fontSize: '11px' }}>
                                                                                ✓ {subImageFiles[index].name}
                                                                            </small>
                                                                        )}
                                                                        {subImagePreviews[index] && !subImageFiles[index] && (
                                                                            <small style={{ color: '#084298', display: 'block', marginTop: '8px', fontWeight: '500', fontSize: '11px' }}>
                                                                                ✓ Current
                                                                            </small>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>



                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '30px' }}>
                                            <button
                                                type="button"
                                                className="btn btn-secondary mb-0"
                                                onClick={() => navigate('/manage-products')}
                                                disabled={loading}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary mb-0"
                                                disabled={loading || !isFormDirty || !productName.trim() || !productDescription.trim() || productPrice === '' || productGst === '' || productShippingCost === '' || productQuantity === ''}
                                            >
                                                {loading ? 'Updating...' : 'Update Product'}
                                            </button>
                                        </div>
                                    </form>
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

export default EditProduct;
