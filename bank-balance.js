// Function to save form data to localStorage
function saveFormData(formData) {
    localStorage.setItem('formData', JSON.stringify(formData));
}

// Function to load form data from localStorage
function loadFormData() {
    const formData = localStorage.getItem('formData');
    return formData ? JSON.parse(formData) : null;
}

// Example usage
const formData = { name: 'John Doe', email: 'john@example.com' };
saveFormData(formData);

const loadedData = loadFormData();
console.log(loadedData); // Should log the saved form data