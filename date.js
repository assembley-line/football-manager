export function getNZDateString(offset = 0) {
    const serverDate = new Date();
    const serverDateOffset = serverDate.getTimezoneOffset(); // Offset in minutes
    const utcDate = new Date(serverDate.getTime() + serverDateOffset * 60 * 1000); // Add the offset, converting from minutes to milliseconds
    const nzDateOffset = 12 * 60 * 60 * 1000; // Gets offset in milliseconds for NZ (12 hours ahead)
    const nzDate = new Date(utcDate.getTime() + nzDateOffset + offset);

    return `${nzDate.getFullYear()}-${String(nzDate.getMonth() + 1).padStart(2, '0')}-${String(nzDate.getDate()).padStart(2, '0')}T${String(nzDate.getHours()).padStart(2, '0').padStart(2, '0')}:${String(nzDate.getMinutes()).padStart(2, '0').padStart(2, '0')}:${String(nzDate.getSeconds()).padStart(2, '0').padStart(2, '0')}`
    // Returns the date in the format YYYY-MM-DDTHH:MM:SS
}

export function getNZDate() {
    const serverDate = new Date();
    const serverDateOffset = serverDate.getTimezoneOffset(); // Offset in minutes
    const utcDate = new Date(serverDate.getTime() + serverDateOffset * 60 * 1000); // Add the offset, converting from minutes to milliseconds
    const nzDateOffset = 12 * 60 * 60 * 1000; // Gets offset in milliseconds for NZ (12 hours ahead)
    return new Date(utcDate.getTime() + nzDateOffset) // Get NZ Date
}