class BankTransactionsApp {
    constructor() {
        this.banks = this.loadBanks();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateBankSelect();
        this.setupNumberFormatting();
    }

    loadBanks() {
        const saved = localStorage.getItem('savedBanks');
        return saved ? JSON.parse(saved) : [
            'الراجحي',
            'الأهلي',
            'الإنماء',
            'السعودي الفرنسي',
            'ساب',
            'البلاد',
            'العربي',
            'الجزيرة'
        ];
    }

    setupEventListeners() {
        // نموذج إرسال المعاملة
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendToWhatsApp();
        });

        // تغيير نوع المعاملة
        const transactionTypeRadios = document.querySelectorAll('input[name="transactionType"]');
        transactionTypeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateTransactionType();
            });
        });
    }

    updateBankSelect() {
        const select = document.getElementById('bank');
        select.innerHTML = '<option value="">اختر البنك</option>';
        
        this.banks.forEach(bank => {
            const option = document.createElement('option');
            option.value = bank;
            option.textContent = bank;
            select.appendChild(option);
        });
    }

    setupNumberFormatting() {
        const amountInputs = document.querySelectorAll('#amount, #originalAmount');
        amountInputs.forEach(input => {
            input.addEventListener('input', (e) => this.formatNumberInput(e));
            input.addEventListener('blur', (e) => this.formatNumberInput(e));
        });
    }

    formatNumberInput(event) {
        let value = event.target.value.replace(/,/g, '');
        
        // السماح فقط بالأرقام والنقطة
        value = value.replace(/[^0-9.]/g, '');
        
        // منع أكثر من نقطة واحدة
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        
        // تحديد خانتين عشريتين كحد أقصى
        if (parts.length === 2 && parts[1].length > 2) {
            value = parts[0] + '.' + parts[1].substring(0, 2);
        }
        
        // إضافة الفواصل للآلاف
        if (value && !isNaN(value)) {
            const num = parseFloat(value);
            if (!isNaN(num)) {
                event.target.value = this.formatNumber(num);
            }
        } else if (value === '') {
            event.target.value = '';
        }
    }

    formatNumber(num) {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }

    parseNumber(formattedString) {
        return parseFloat(formattedString.replace(/,/g, ''));
    }

    updateTransactionType() {
        const transactionType = document.querySelector('input[name="transactionType"]:checked').value;
        const header = document.querySelector('.header h1');
        header.textContent = `${transactionType} البنوك`;
    }

    sendToWhatsApp() {
        const formData = new FormData(document.getElementById('transactionForm'));
        
        const transactionType = document.querySelector('input[name="transactionType"]:checked').value;
        const bank = formData.get('bank');
        const clientName = formData.get('clientName');
        const amount = this.parseNumber(formData.get('amount'));
        const currency = formData.get('currency');
        const originalAmountValue = formData.get('originalAmount');
        
        if (!bank || !clientName || !amount) {
            alert('الرجاء إدخال جميع البيانات المطلوبة');
            return;
        }

        // إنشاء رسالة الواتساب
        let message = `${transactionType} بنك ${bank}\n`;
        message += `العميل : ${clientName}\n`;
        message += `المبلغ : ${this.formatNumber(amount)} ${currency}\n`;
        
        // إضافة أصل المبلغ إذا تم إدخاله
        if (originalAmountValue && originalAmountValue.trim() !== '') {
            const originalAmount = this.parseNumber(originalAmountValue);
            const originalCurrency = formData.get('originalCurrency');
            message += `اصل المبلغ : ${this.formatNumber(originalAmount)} ${originalCurrency}\n`;
        }

        // إرسال إلى الواتساب
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }
}

// تهيئة التطبيق
const app = new BankTransactionsApp();
