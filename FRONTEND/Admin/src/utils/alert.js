// alert.js
import Swal from 'sweetalert2';

// Function to show the logout confirmation alert
export const showLogoutConfirmation = async () => {
    return Swal.fire({
        title: 'Are you sure, you want to sign out?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Sign Out',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
    });
};

// Function to show the successful logout alert
export const showLogoutSuccess = () => {
    Swal.fire({
        title: 'Sign out successfully!',
        icon: 'success',
        timer: 2000, // Automatically close after 2 seconds
        showConfirmButton: false, // Optional: Hide the confirmation button
    });
};

// Function to show the successful alert
export const showAlertSuccess = (title) => {
    Swal.fire({
        title, // Dynamically set the alert title
        icon: 'success',
        timer: 2000, // Automatically close after 2 seconds
        showConfirmButton: false, // Optional: Hide the confirmation button
    });
};

// Function to show error alert
export const showAlertError = (title) => {
    Swal.fire({
        title, // Dynamically set the alert title
        icon: 'error',
        timer: 2000, // Automatically close after 2 seconds
        showConfirmButton: false, // Optional: Hide the confirmation button
    });
};
