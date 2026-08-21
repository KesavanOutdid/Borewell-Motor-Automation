// utils/formatDateToIST.js
export const formatDateToIST = (dateString) => {
    if (!dateString || isNaN(Date.parse(dateString))) {
        return '-';
    }

    const date = new Date(dateString);

    const options = {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    };

    let formatted = date.toLocaleString('en-IN', options);

    // Replace narrow non-breaking space with standard space if present
    formatted = formatted.replace(/\u202f/g, ' ');

    // Convert "am"/"pm" to uppercase AM/PM
    formatted = formatted.replace(/\b(am|pm)\b/gi, (match) => match.toUpperCase());

    return formatted;
};
