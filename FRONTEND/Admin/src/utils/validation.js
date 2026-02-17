// validation.js

// Name validation
// export const sanitizeName = (value) => {
//     // Remove invalid characters (allow letters, spaces, hyphens, and apostrophes)
//     return value.replace(/[^a-zA-Z\s'-]/g, '').slice(0, 25);;
// };

export const sanitizeName = (value) => {
    // Allow only letters (a to z, A to Z) and spaces, and remove everything else
    return value.replace(/[^a-zA-Z\s]/g, '').slice(0, 25);
};


// Mobile validation
// export const sanitizeMobile = (value) => {
//     // Allow only numeric characters and restrict to 10 digits
//     return value.replace(/[^0-9]/g, '').slice(0, 10);
// };

export const sanitizeMobile = (value) => {
    // Remove non-numeric characters
    const sanitizedValue = value.replace(/[^0-9]/g, '');

    // Prevent the first digit from being 0
    if (sanitizedValue.startsWith('0')) {
        return sanitizedValue.slice(1, 10); // Remove the leading 0 and restrict to 10 digits
    }

    // Restrict to 10 digits
    return sanitizedValue.slice(0, 10);
};

// Email validation
// export const sanitizeEmail = (value) => {
//     // Remove spaces and invalid characters
//     const noSpaces = value.replace(/\s/g, '');
//     const validChars = noSpaces.replace(/[^a-zA-Z0-9@.]/g, '');
//     // Convert to lowercase
//     const lowerCaseEmail = validChars.toLowerCase();
//     // Handle multiple @ symbols
//     const atCount = (lowerCaseEmail.match(/@/g) || []).length;
//     return atCount <= 1 ? lowerCaseEmail : lowerCaseEmail.replace(/@.*@/, '@');
// };

export const sanitizeEmail = (value) => {
    // Remove spaces and keep only valid characters for an email (letters, digits, @, and .)
    const noSpaces = value.replace(/\s/g, '');
    let validChars = noSpaces.replace(/[^a-zA-Z0-9@.]/g, ''); // Disallow - and _
    
    // Collapse consecutive dots
    validChars = validChars.replace(/\.+/g, '.');

    // Convert to lowercase
    const lowerCaseEmail = validChars.toLowerCase();

    // Handle multiple @ symbols by keeping only the first part of the email
    const atIndex = lowerCaseEmail.indexOf('@');
    if (atIndex !== -1) {
        const firstPart = lowerCaseEmail.slice(0, atIndex + 1); // Include first '@'
        const domainPart = lowerCaseEmail.slice(atIndex + 1).replace(/@/g, ''); // Remove additional '@'
        const sanitizedEmail = `${firstPart}${domainPart}`;
        
        // Limit the email address to 40 characters
        return sanitizedEmail.slice(0, 40);
    }

    // No @ symbol: Limit to 40 characters and return
    return lowerCaseEmail.slice(0, 40);
};


// Address validation
export const sanitizeAddress = (value) => {
    // Allow letters, numbers, spaces, and most common special characters
    return value.replace(/[^\w\s.,'-/!@#$%^&*()+=]/g, '').slice(0, 150);
};

// Password validation
// export const sanitizePassword = (value) => {
//     // Remove any non-numeric characters and restrict to 4 digits
//     return value.replace(/[^0-9]/g, '').slice(0, 4);
// };

export const sanitizePassword = (value) => {
    // Remove non-numeric characters
    let sanitizedValue = value.replace(/[^0-9]/g, '');

    // Ensure the first digit is not 0
    if (sanitizedValue.startsWith('0')) {
        sanitizedValue = sanitizedValue.slice(1); // Remove the leading zero
    }

    // Restrict to 4 digits
    return sanitizedValue.slice(0, 6);
};

// Serial number validation
export const sanitizeSerialNumber = (value) => {
    return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 20);
};

// IMEI number validation
export const sanitizeImeiNumber = (value) => {
    return value.replace(/[^0-9]/g, '').slice(0, 17);
};