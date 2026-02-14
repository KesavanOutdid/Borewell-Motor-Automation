import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sanitizeName, sanitizeMobile, sanitizeEmail, sanitizePassword } from '../../utils/validation';

const useSignUp = (handleSignUp) => {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [passwords, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loadingSubmit, setLoadingSubmit] = useState(false);

    const navigate = useNavigate(); // Initialize useNavigate

    const handleSignUpFormSubmit = async (e) => {
        e.preventDefault();

        // Apply sanitization before validation
        const sanitizedName = sanitizeName(name);
        const sanitizedMobile = sanitizeMobile(mobile);
        const sanitizedEmail = sanitizeEmail(email);
        const sanitizedPassword = sanitizePassword(passwords);

        // Name validation
        if (!sanitizedName.trim()) {
            setErrorMessage('Name is required.');
            setTimeout(() => setErrorMessage(''), 5000);
            return;
        }

        // Mobile validation (only allowing 10 digits from sanitized input)
        if (sanitizedMobile.length !== 10) {
            setErrorMessage('Mobile must be a 10-digit number.');
            setTimeout(() => setErrorMessage(''), 5000);
            return;
        }

        // Email validation (Check for presence of '@' and ensure it's formatted correctly after sanitization)
        if (!sanitizedEmail.includes('@') || !sanitizedEmail.includes('.')) {
            setErrorMessage('Invalid email address.');
            setTimeout(() => setErrorMessage(''), 5000);
            return;
        }

        // Password validation (ensure it's a 4-digit number after sanitization)
        if (sanitizedPassword.length !== 4) {
            setErrorMessage('Password must be a 4-digit number.');
            setTimeout(() => setErrorMessage(''), 5000);
            return;
        }


        if (loadingSubmit) return; // Prevent multiple submissions
        setLoadingSubmit(true); // Disable button

        try {
            const response = await fetch('/DataLogger/CheckSingUpCredentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: sanitizedName,
                    mobile: sanitizedMobile,
                    email: sanitizedEmail,
                    password: parseInt(sanitizedPassword, 10),
                }),
            });

            if (response.ok) {
                setSuccessMessage('Sign-up successful!');
                setErrorMessage('');
                navigate('/SignIn'); // Redirect to the login page
                setLoadingSubmit(false);
            } else {
                const responseData = await response.json();
                setErrorMessage(`Sign-up failed: ${responseData.message}`);
                setSuccessMessage('');
                setTimeout(() => setErrorMessage(''), 5000);
                setLoadingSubmit(false);
            }
        } catch (error) {
            setErrorMessage('An error occurred during sign-up. Please try again later.');
            setSuccessMessage('');
            setTimeout(() => setErrorMessage(''), 5000);
            setLoadingSubmit(false);
        }
    };

    return {
        name, setName, mobile, setMobile, email, setEmail, passwords, setPassword, errorMessage, successMessage, handleSignUpFormSubmit, loadingSubmit
    };
};

export default useSignUp;
