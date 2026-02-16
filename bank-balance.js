class BankBalanceApp {
    constructor() {
        this.form = document.getElementById('bank-balance-form');
        this.loadFormData();  // Load data on initialization
        this.form.addEventListener('change', () => this.saveFormData());
    }

    // Method to save form data to localStorage
    saveFormData() {
        const formData = new FormData(this.form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });
        localStorage.setItem('bankBalanceFormData', JSON.stringify(data));
    }

    // Method to load form data from localStorage
    loadFormData() {
        const savedData = localStorage.getItem('bankBalanceFormData');
        if (savedData) {
            const data = JSON.parse(savedData);
            for (const key in data) {
                if (data.hasOwnProperty(key) && this.form.elements[key]) {
                    this.form.elements[key].value = data[key];
                }
            }
        }
    }
}

// Assuming the rest of your existing code follows...