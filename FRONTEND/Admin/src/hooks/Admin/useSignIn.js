import { useState } from 'react';
import { sanitizeEmail, sanitizePassword } from '../../utils/validation';

const useSignIn = (handleSignIn) => {
    const API_BASE = process.env.REACT_APP_SERVER_URL;
    const [user_email, setEmail] = useState('');
    const [passwords, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loadingSubmit, setLoadingSubmit] = useState(false);

    const handleSignInFormSubmit = async (e) => {
        e.preventDefault();

        // Apply sanitization to inputs
        const sanitizedEmail = sanitizeEmail(user_email);
        const sanitizedPassword = sanitizePassword(passwords);

        // Email validation (checking if the sanitized email contains "@" and ".")
        if (!sanitizedEmail.includes('@') || !sanitizedEmail.includes('.')) {
            setErrorMessage('Invalid email address.');
            setTimeout(() => setErrorMessage(''), 5000);
            return;
        }

        // Password validation (check for a valid 4-digit password)
        if (sanitizedPassword.length !== 6) {
            setErrorMessage('Password must be a 4-digit number.');
            setTimeout(() => setErrorMessage(''), 5000);
            return;
        }

        if (loadingSubmit) return; // Prevent multiple submissions
        setLoadingSubmit(true); // Disable button

        try {
            // Send sanitized inputs for sign-in
            const parsedPassword = parseInt(sanitizedPassword, 10);
            const response = await fetch(`${API_BASE}/app/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_email: sanitizedEmail, password: parsedPassword, role_id: 1 }),
            });

            if (response.ok) {
                const data = await response.json();

                setSuccessMessage(data.message || 'Sign-in successful!');
                setErrorMessage('');

                handleSignIn({ data });   // store user in session + redirect
                setLoadingSubmit(false);
            } else {
                const responseData = await response.json();

                setErrorMessage(responseData.message || 'Sign-in failed.');
                setSuccessMessage('');
                setLoadingSubmit(false);
            }

        } catch (error) {
            setErrorMessage('An error occurred during sign-in. Please try again later.');
            setSuccessMessage('');
            setTimeout(() => setErrorMessage(''), 5000);
            setLoadingSubmit(false);
        }
    };

    return { user_email, setEmail, passwords, setPassword, errorMessage, successMessage, handleSignInFormSubmit, loadingSubmit };
};

export default useSignIn;
