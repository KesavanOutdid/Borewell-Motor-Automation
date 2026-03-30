// HeaderLogic.js
import React, { useCallback, useState } from 'react';
import axios from 'axios';

export const useChannelHistory = (userInfo) => {
    const [channelHistory, setChannelHistory] = useState([]);
    const [filteredData, setFilteredData] = useState([]);    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [imeiNumbers, setImeiNumbers] = React.useState([]);
    const [serialNumbers, setSerialNumbers] = React.useState([]);
    const [isSearchApplied, setIsSearchApplied] = useState(false);
    const [countdown, setCountdown] = useState(60); // Initialize countdown at 60 seconds

    // Initial state for form data
    const [formData, setFormData] = useState({
        fromDate: '',
        toDate: '',
        serialNumber: '',
        imeiNumber: '',
    });

    // Fetch channel history data
    const fetchChannelHistory = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get("/DataLogger/channelAllHistory");
            if (response.data.success) {
                const data = response.data.data;

                setChannelHistory(data);
                setError(null);

                const imeiNumbers = [...new Set(data.map(item => item.imeiNumber))];
                const serialNumbers = [...new Set(data.map(item => item.serialNumber))];

                setImeiNumbers(imeiNumbers);
                setSerialNumbers(serialNumbers);

                setCountdown(60); // Reset countdown
            } else {
                setError(response.data.message || "Failed to fetch channel history.");
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            setError("Error fetching channel history. Please check your connection.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Today, Weekly, Monthly, Yearly datas
    const parseDateString = (dateString) => {
        if (!dateString || typeof dateString !== 'string') {
            console.error("Invalid date string:", dateString);
            return null;
        }
    
        // Assume dateString format is "DD/MM/YY"
        const [day, month, year] = dateString.split('/').map(num => parseInt(num, 10));
        if (isNaN(day) || isNaN(month) || isNaN(year)) {
            console.error("Invalid date components:", { day, month, year });
            return null;
        }
    
        // Adjust year to 2000+ for two-digit year representation
        const adjustedYear = year < 100 ? year + 2000 : year;
        return new Date(adjustedYear, month - 1, day);
    };
    
    const handleFilter = (timePeriod) => {
        const now = new Date();
        const currentDate = new Date(now); // Keep the current date intact
        let filtered = [];
        
        setError(null); // Reset error state before filtering
    
        switch (timePeriod) {
            case "Today":
                const startOfToday = new Date(currentDate.setHours(0, 0, 0, 0));
                const endOfToday = new Date(currentDate.setHours(23, 59, 59, 999));
                filtered = channelHistory.filter(item => {
                    const itemDate = parseDateString(item.date);
                    return itemDate && itemDate >= startOfToday && itemDate <= endOfToday;
                });
                if (filtered.length === 0) setError("No data found for today.");
                break;
    
            case "Weekly":
                // From last Sunday to current date
                const startOfWeek = new Date(currentDate);
                startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Sunday
                startOfWeek.setHours(0, 0, 0, 0);
    
                const endOfWeek = new Date(currentDate.setHours(23, 59, 59, 999));
                filtered = channelHistory.filter(item => {
                    const itemDate = parseDateString(item.date);
                    return itemDate && itemDate >= startOfWeek && itemDate <= endOfWeek;
                });
                if (filtered.length === 0) setError("No data found for this week.");
                break;
    
            case "Monthly":
                // From 1st day of the current month to current date
                const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const endOfMonth = new Date(currentDate); // Current date
                filtered = channelHistory.filter(item => {
                    const itemDate = parseDateString(item.date);
                    return itemDate && itemDate >= startOfMonth && itemDate <= endOfMonth;
                });
                if (filtered.length === 0) setError("No data found for this month.");
                break;
    
            case "Yearly":
                // From 1st day of the current year to current date
                const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
                const endOfYear = new Date(currentDate); // Current date
                filtered = channelHistory.filter(item => {
                    const itemDate = parseDateString(item.date);
                    return itemDate && itemDate >= startOfYear && itemDate <= endOfYear;
                });
                if (filtered.length === 0) setError("No data found for this year.");
                break;
    
            default:
                filtered = channelHistory; // No filter applied
                break;
        }
    
        // Update the filtered data and indicate a search is applied
        setFilteredData(filtered);
        setIsSearchApplied(true);
    };
    
    // Handle filter input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
    
        const { fromDate, toDate, serialNumber, imeiNumber } = formData;
    
        const filtered = channelHistory.filter((item) => {
            // Check if 'date' exists before trying to split it
            if (!item.date) return false; // If date is missing, skip this item
    
            // Convert 'date' to a comparable date object (dd/mm/yy format)
            const itemDateParts = item.date.split("/"); // Split date to extract day, month, year
            const itemDate = new Date(`${itemDateParts[1]}/${itemDateParts[0]}/${itemDateParts[2]}`);
    
            // Convert 'fromDate' and 'toDate' to comparable date objects
            const fromDateObj = fromDate ? new Date(fromDate) : null;
            const toDateObj = toDate ? new Date(toDate) : null;
    
            // Check if item date is within the specified range
            const isDateInRange =
                (!fromDateObj || itemDate >= fromDateObj) && (!toDateObj || itemDate <= toDateObj);
    
            if (!isDateInRange) return false;
    
            // Filter by serialNumber and imeiNumber
            const matchesSerialNumber = 
                serialNumber ? item.serialNumber?.toUpperCase() === serialNumber.toUpperCase() : true;
            const matchesImeiNumber = 
                imeiNumber ? item.imeiNumber?.toUpperCase() === imeiNumber.toUpperCase() : true;
    
            return matchesSerialNumber && matchesImeiNumber;
        });
    
        if (filtered.length > 0) {
            setFilteredData(filtered); // Set the filtered results
            setIsSearchApplied(true);
            setError(null); // Clear previous errors
        } else {
            setFilteredData([]); // No matches found, clear filtered data
            setIsSearchApplied(true);
            setError('No data found for the provided filters.');
        }
    };
    
    // Export Data
    const exportData = () => {
        const dataToExport = isSearchApplied ? filteredData : channelHistory;
        console.log('Exporting data:', dataToExport);
    
        // Example: Convert to CSV format for export
        const csvData = [
          ['Index', 'Pump ID', 'Frequency', 'Latitude', 'Longitude', 'Power Factor', 'Voltage', 'Date-Time'],
          ...dataToExport.map((item, index) => [
            index + 1,
            item.pump_id || 'N/A',
            item.frequency || 'N/A',
            item.latitude || 'N/A',
            item.longitude || 'N/A',
            item.power_factor || 'N/A',
            item.voltage || 'N/A',
            item.date && item.time ? `${item.date} ${item.time}` : 'N/A',
          ]),
        ];
        const csvContent = csvData.map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'channel_history.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    // Print Data
    const printData = () => {
        const dataToPrint = isSearchApplied ? filteredData : channelHistory;
        console.log('Printing data:', dataToPrint);
    
        const printContent = `
          <html>
            <head><title>Channel History</title></head>
            <body>
              <h1>Channel History Report</h1>
              <table border="1" style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th>Index</th>
                    <th>Pump ID</th>
                    <th>Frequency</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Power Factor</th>
                    <th>Voltage</th>
                    <th>Date-Time</th>
                  </tr>
                </thead>
                <tbody>
                  ${dataToPrint.map((item, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${item.pump_id || 'N/A'}</td>
                      <td>${item.frequency || 'N/A'}</td>
                      <td>${item.latitude || 'N/A'}</td>
                      <td>${item.longitude || 'N/A'}</td>
                      <td>${item.power_factor || 'N/A'}</td>
                      <td>${item.voltage || 'N/A'}</td>
                      <td>${item.date && item.time ? `${item.date} ${item.time}` : 'N/A'}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </body>
          </html>`;
    
        const newWindow = window.open('', '', 'height=800,width=800');
        newWindow.document.write(printContent);
        newWindow.document.close();
        newWindow.print();
    };

  return {
    channelHistory, setCountdown, filteredData, loading, error, formData, imeiNumbers, serialNumbers, isSearchApplied, countdown, fetchChannelHistory, handleFilter,    handleInputChange, handleSubmit,     exportData, printData, 

  };
};
