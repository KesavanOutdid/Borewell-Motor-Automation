import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Admin/Header';
import Sidebar from '../../components/Admin/Sidebar';
import Footer from '../../components/Admin/Footer';
import { showAlertSuccess } from '../../utils/alert';

const CreateProduct = ({ userInfo, handleLogout }) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;
    const navigate = useNavigate();

    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [pdfFile, setPdfFile] = useState(null);
    const [mainImageFile, setMainImageFile] = useState(null);
    const [subImageFiles, setSubImageFiles] = useState([]);
    const [mainImagePreview, setMainImagePreview] = useState('');
    const [subImagePreviews, setSubImagePreviews] = useState([]);
    const [boxSize, setBoxSize] = useState('');
    const [extraDetails, setExtraDetails] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productGst, setProductGst] = useState('');
    const [productShippingCost, setProductShippingCost] = useState('');
    const [productQuantity, setProductQuantity] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});

    const handlePdfChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setPdfFile(file);
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
            setMainImageFile(null);
            setMainImagePreview('');
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
            const response = await fetch(`${API_BASE}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Error uploading file to ${endpoint}`);
            }

            return data.filePath;
        } catch (error) {
            console.error(`Upload error (${endpoint}):`, error);
            throw error;
        }
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();

        if (!productName.trim()) return setErrorMessage('Product name is required');
        if (!productDescription.trim()) return setErrorMessage('Product description is required');
        if (!mainImageFile) return setErrorMessage('Main image is required');

        if (loading) return;
        setLoading(true);
        setErrorMessage('');

        try {
            let mainImagePath = '';
            let pdfPath = '';
            const subImagePaths = [];

            setUploadProgress({ pdf: pdfFile ? 'Uploading PDF...' : '' });

            if (pdfFile) {
                pdfPath = await uploadFile(pdfFile, 'uploadPDF');
                setUploadProgress((prev) => ({ ...prev, pdf: 'Done' }));
            }

            setUploadProgress((prev) => ({ ...prev, mainImage: 'Uploading main image...' }));
            mainImagePath = await uploadFile(mainImageFile, 'uploadImage');
            setUploadProgress((prev) => ({ ...prev, mainImage: 'Done' }));

            for (let i = 0; i < subImageFiles.length; i++) {
                if (subImageFiles[i]) {
                    setUploadProgress((prev) => ({
                        ...prev,
                        [`subImage${i}`]: `Uploading sub image ${i + 1}...`
                    }));
                    const path = await uploadFile(subImageFiles[i], 'uploadImage');
                    subImagePaths.push(path);
                    setUploadProgress((prev) => ({
                        ...prev,
                        [`subImage${i}`]: 'Done'
                    }));
                }
            }

            const response = await fetch(`${API_BASE}/createProduct`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({
                    product_name: productName.trim(),
                    product_description: productDescription.trim(),
                    product_description_pdf: pdfPath,
                    product_main_image: mainImagePath,
                    product_sub_images: subImagePaths,
                    product_quality: {
                        box_size: boxSize.trim() || null,
                        extra_details: extraDetails.trim() || null
                    },
                    product_price: productPrice ? parseFloat(productPrice) : 0,
                    product_gst: productGst ? parseFloat(productGst) : 0,
                    product_shipping_cost: productShippingCost ? parseFloat(productShippingCost) : 0,
                    product_quantity: productQuantity ? parseInt(productQuantity) : 0,
                    createdBy: userInfo?.user?.user_email
                })
            });

            const res = await response.json();

            if (!response.ok) {
                setErrorMessage(res.message || 'Error creating product');
                setLoading(false);
                return;
            }

            showAlertSuccess('Product created successfully!');
            navigate('/manage-products');
        } catch (err) {
            console.log('Create Product Error:', err);
            setErrorMessage(err.message || 'Error creating product');
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
                                        <h5 style={{ margin: 0 }}>Create New Product</h5>
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
                                    <form onSubmit={handleCreateProduct}>
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
                                                        onChange={(e) => setProductName(e.target.value)}
                                                        placeholder="Enter product name"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="col-md-6">
                                                <div style={{ marginBottom: '20px' }}>
                                                    <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Box Size</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={boxSize}
                                                        onChange={(e) => setBoxSize(e.target.value)}
                                                        placeholder="e.g., 10x10x10 cm"
                                                    />
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
                                                placeholder="Enter product description"
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
                                                placeholder="Enter extra details"
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
                                                            onChange={(e) => setProductPrice(e.target.value)}
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
                                                            onChange={(e) => setProductGst(e.target.value)}
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
                                                            onChange={(e) => setProductShippingCost(e.target.value)}
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
                                                            onChange={(e) => setProductQuantity(e.target.value)}
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
                                                    <label style={{ fontWeight: '600', marginBottom: '12px', display: 'block', color: '#333' }}>Description PDF (Optional)</label>
                                                    <input
                                                        type="file"
                                                        className="form-control"
                                                        accept=".pdf"
                                                        onChange={handlePdfChange}
                                                        style={{ marginBottom: '10px' }}
                                                    />
                                                    {pdfFile && (
                                                        <div style={{ backgroundColor: '#d4edda', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                                                            <small style={{ color: '#155724', display: 'block', fontWeight: '500' }}>
                                                                ✓ {pdfFile.name}
                                                            </small>
                                                            <small style={{ color: '#155724', fontSize: '12px' }}>File selected</small>
                                                        </div>
                                                    )}
                                                    {uploadProgress.pdf && (
                                                        <div style={{ backgroundColor: '#cce5ff', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                                                            <small style={{ color: '#004085', display: 'block', fontWeight: '500' }}>
                                                                {uploadProgress.pdf}
                                                            </small>
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
                                                        required
                                                        style={{ marginBottom: '10px', fontSize: '12px' }}
                                                    />
                                                    {mainImagePreview && (
                                                        <div>
                                                            <img
                                                                src={mainImagePreview}
                                                                alt="Main preview"
                                                                style={{
                                                                    width: '100%',
                                                                    height: '200px',
                                                                    objectFit: 'cover',
                                                                    borderRadius: '6px',
                                                                    border: '2px solid #dee2e6',
                                                                    marginTop: '10px'
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
                                                                {(subImageFiles[index] && subImagePreviews[index]) && (
                                                                    <div style={{ position: 'relative', marginTop: '8px' }}>
                                                                        <img
                                                                            src={subImagePreviews[index]}
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
                                                                        {uploadProgress[`subImage${index}`] && (
                                                                            <small style={{ color: '#004085', display: 'block', fontWeight: '500', fontSize: '11px', marginTop: '4px' }}>
                                                                                {uploadProgress[`subImage${index}`]}
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
                                                disabled={loading}
                                            >
                                                {loading ? 'Creating...' : 'Create Product'}
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

export default CreateProduct;
