// bank-balance.js

// Function to save form data automatically when changed
function saveData() {
    const balanceInput = document.getElementById('balance');
    localStorage.setItem('bankBalance', balanceInput.value);
}

// Function to load saved data on page load
function loadData() {
    const savedBalance = localStorage.getItem('bankBalance');
    if (savedBalance) {
        document.getElementById('balance').value = savedBalance;
    }
}

// Event listener to save data automatically
document.getElementById('balance').addEventListener('input', saveData);

// Load data on window load
window.onload = loadData;