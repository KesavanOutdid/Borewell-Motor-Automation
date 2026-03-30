// utils/formatDateToIST.js
export const formatDateToIST = (dateString) => {
    if (!dateString || isNaN(Date.parse(dateString))) {
        return 'N/A';
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
    };

    const istString = date.toLocaleString('en-IN', options);

    // Example output: "17/11/2025, 05:45 am"
    let formatted = istString.replace(',', '');

    // Convert "am"/"pm" to uppercase AM/PM
    formatted = formatted.replace(' am', ' AM').replace(' pm', ' PM');

    return formatted;
};
