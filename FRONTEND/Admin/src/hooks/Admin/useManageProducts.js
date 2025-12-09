import { useState } from 'react';
import { showAlertSuccess } from '../../utils/alert';

const useManageProducts = (userInfo) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;

    const [isModalCreate, setIsModalCreate] = useState(false);
    const [isModalEdit, setIsModalEdit] = useState(false);
    const [isModalView, setIsModalView] = useState(false);

    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [productDescriptionPdf, setProductDescriptionPdf] = useState('');
    const [productMainImage, setProductMainImage] = useState('');
    const [productSubImages, setProductSubImages] = useState([]);
    const [boxSize, setBoxSize] = useState('');
    const [extraDetails, setExtraDetails] = useState('');

    const [errorMessage, setErrorMessage] = useState('');
    const [products, setProducts] = useState([]);
    const [errorProducts, setErrorProducts] = useState('');
    const [loadingProducts, setLoadingProducts] = useState(true);

    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalProducts: 0,
        totalActiveProducts: 0,
        totalInactiveProducts: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    });

    const [errorMessageEdit, setErrorMessageEdit] = useState('');
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [currentProductDetails, setCurrentProductDetails] = useState(null);

    // Fetch products with pagination
    const fetchProductData = async (page = 1, limit = 10) => {
        try {
            setLoadingProducts(true);
            const response = await fetch(
                `${API_BASE}/admin/getProducts?page=${page}&limit=${limit}`
            );

            if (response.ok) {
                const data = await response.json();
                setProducts(data.data);
                setPagination(data.pagination);
                setLoadingProducts(false);
            } else {
                const errorData = await response.json();
                setErrorProducts(errorData.message || 'Error fetching products');
                setLoadingProducts(false);
            }
        } catch (error) {
            console.error('Fetch Products Error:', error);
            setErrorProducts('An error occurred while fetching products.');
            setLoadingProducts(false);
        }
    };

    // Fetch single product by ID
    const fetchProductById = async (id) => {
        try {
            const response = await fetch(`${API_BASE}/admin/getProductById?id=${id}`);

            if (response.ok) {
                const data = await response.json();
                return data.data;
            } else {
                const errorData = await response.json();
                setErrorMessageEdit(errorData.message || 'Error fetching product');
                return null;
            }
        } catch (error) {
            console.error('Fetch Product Error:', error);
            setErrorMessageEdit('An error occurred while fetching product.');
            return null;
        }
    };

    // Close all modals
    const closeModal = () => {
        setIsModalCreate(false);
        setIsModalEdit(false);
        setIsModalView(false);
        setProductName('');
        setProductDescription('');
        setProductDescriptionPdf('');
        setProductMainImage('');
        setProductSubImages([]);
        setBoxSize('');
        setExtraDetails('');
        setErrorMessage('');
        setErrorMessageEdit('');
        setLoadingSubmit(false);
        setLoadingUpdate(false);
        setCurrentProductDetails(null);
    };

    // Create product
    const handleProductCreate = async (e) => {
        e.preventDefault();

        if (!productName.trim()) return setErrorMessage('Product name is required');
        if (!productDescription.trim()) return setErrorMessage('Product description is required');
        if (!productMainImage.trim()) return setErrorMessage('Main image is required');

        if (loadingSubmit) return;
        setLoadingSubmit(true);

        try {
            const response = await fetch(`${API_BASE}/admin/createProduct`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({
                    product_name: productName.trim(),
                    product_description: productDescription.trim(),
                    product_description_pdf: productDescriptionPdf.trim() || null,
                    product_main_image: productMainImage.trim(),
                    product_sub_images: productSubImages,
                    product_quality: {
                        box_size: boxSize.trim() || null,
                        extra_details: extraDetails.trim() || null
                    },
                    createdBy: userInfo?.user?.user_email
                })
            });

            const res = await response.json();

            if (!response.ok) {
                setErrorMessage(res.message || 'Error creating product');
                setLoadingSubmit(false);
                return;
            }

            showAlertSuccess('Product created successfully!');
            fetchProductData();
            closeModal();
        } catch (err) {
            console.log('Create Product Error:', err);
            setErrorMessage('Error creating product.');
        }

        setLoadingSubmit(false);
    };

    // Update product
    const handleProductUpdate = async (e) => {
        e.preventDefault();

        if (!currentProductDetails._id) {
            setErrorMessageEdit('Product ID is missing');
            return;
        }

        if (!currentProductDetails.product_name?.trim()) {
            return setErrorMessageEdit('Product name is required');
        }

        if (!currentProductDetails.product_description?.trim()) {
            return setErrorMessageEdit('Product description is required');
        }

        if (loadingUpdate) return;
        setLoadingUpdate(true);

        try {
            const response = await fetch(`${API_BASE}/admin/updateProduct`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({
                    id: currentProductDetails._id,
                    product_name: currentProductDetails.product_name,
                    product_description: currentProductDetails.product_description,
                    product_description_pdf: currentProductDetails.product_description_pdf,
                    product_main_image: currentProductDetails.product_main_image,
                    product_sub_images: currentProductDetails.product_sub_images,
                    product_quality: currentProductDetails.product_quality,
                    status: currentProductDetails.status,
                    updatedBy: userInfo?.user?.user_email
                })
            });

            const res = await response.json();

            if (!response.ok) {
                setErrorMessageEdit(res.message || 'Error updating product');
                setLoadingUpdate(false);
                return;
            }

            showAlertSuccess('Product updated successfully!');
            fetchProductData(pagination.currentPage, pagination.limit);
            closeModal();
        } catch (err) {
            console.log('Update Product Error:', err);
            setErrorMessageEdit('Error updating product.');
        }

        setLoadingUpdate(false);
    };

    // Delete product
    const handleProductDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            const response = await fetch(`${API_BASE}/admin/deleteProduct`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ id })
            });

            const res = await response.json();

            if (!response.ok) {
                alert(res.message || 'Error deleting product');
                return;
            }

            showAlertSuccess('Product deleted successfully!');
            fetchProductData(pagination.currentPage, pagination.limit);
        } catch (err) {
            console.log('Delete Product Error:', err);
            alert('Error deleting product');
        }
    };

    // Handle sub-images input
    const handleAddSubImage = () => {
        setProductSubImages([...productSubImages, '']);
    };

    const handleRemoveSubImage = (index) => {
        setProductSubImages(productSubImages.filter((_, i) => i !== index));
    };

    const handleSubImageChange = (index, value) => {
        const updated = [...productSubImages];
        updated[index] = value;
        setProductSubImages(updated);
    };

    // Pagination handlers
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchProductData(newPage, pagination.limit);
        }
    };

    const handleLimitChange = (newLimit) => {
        fetchProductData(1, newLimit);
    };

    return {
        isModalCreate,
        setIsModalCreate,
        isModalEdit,
        setIsModalEdit,
        isModalView,
        setIsModalView,
        productName,
        setProductName,
        productDescription,
        setProductDescription,
        productDescriptionPdf,
        setProductDescriptionPdf,
        productMainImage,
        setProductMainImage,
        productSubImages,
        setProductSubImages,
        boxSize,
        setBoxSize,
        extraDetails,
        setExtraDetails,
        errorMessage,
        setErrorMessage,
        products,
        setProducts,
        errorProducts,
        loadingProducts,
        pagination,
        handlePageChange,
        handleLimitChange,
        handleProductCreate,
        handleProductUpdate,
        handleProductDelete,
        handleAddSubImage,
        handleRemoveSubImage,
        handleSubImageChange,
        errorMessageEdit,
        setErrorMessageEdit,
        loadingSubmit,
        loadingUpdate,
        setLoadingUpdate,
        currentProductDetails,
        setCurrentProductDetails,
        fetchProductById,
        fetchProductData,
        closeModal
    };
};

export default useManageProducts;
