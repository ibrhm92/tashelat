class BankBalanceApp {
    constructor() {
        this.banks = this.loadBanks();
        this.bankCounter = 1;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderSavedBanks();
        this.updateBankSelects();
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

    saveBanks() {
        localStorage.setItem('savedBanks', JSON.stringify(this.banks));
    }

    setupNumberFormatting() {
        // إضافة مستمع الأحداث للحقول الموجودة
        this.addNumberFormattingListeners();
    }

    addNumberFormattingListeners() {
        const balanceInputs = document.querySelectorAll('input[name^="balance"]');
        balanceInputs.forEach(input => {
            // إزالة المستمعين الموجودين لتجنب التكرار
            input.removeEventListener('input', this.formatNumberInput);
            input.removeEventListener('blur', this.formatNumberInput);
            
            // إضافة مستمعين جدد
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

    setupEventListeners() {
        // نموذج إرسال رصيد البنك
        document.getElementById('balanceForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendToWhatsApp();
        });

        // زر إضافة بنك آخر في النموذج
        document.getElementById('addMoreBtn').addEventListener('click', () => {
            this.addBankField();
        });

        // زر فتح نافذة إضافة بنك جديد
        document.getElementById('addBankBtn').addEventListener('click', () => {
            this.openModal();
        });

        // إغلاق المودال
        document.getElementById('cancelAddBank').addEventListener('click', () => {
            this.closeModal();
        });

        // نموذج إضافة بنك جديد
        document.getElementById('addBankForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewBank();
        });

        // إغلاق المودال عند النقر خارجه
        document.getElementById('addBankModal').addEventListener('click', (e) => {
            if (e.target.id === 'addBankModal') {
                this.closeModal();
            }
        });
    }

    renderSavedBanks() {
        const container = document.getElementById('savedBanksList');
        container.innerHTML = '';

        this.banks.forEach((bank, index) => {
            const bankElement = document.createElement('div');
            bankElement.className = 'saved-bank-item';
            bankElement.innerHTML = `
                <span>${bank}</span>
                <button type="button" onclick="app.removeBank(${index})" class="remove-btn">×</button>
            `;
            container.appendChild(bankElement);
        });
    }

    updateBankSelects() {
        const selects = document.querySelectorAll('.bank-select');
        selects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">اختر البنك</option>';
            
            this.banks.forEach(bank => {
                const option = document.createElement('option');
                option.value = bank;
                option.textContent = bank;
                if (bank === currentValue) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        });
    }

    addBankField() {
        this.bankCounter++;
        const container = document.getElementById('banksContainer');
        const bankItem = document.createElement('div');
        bankItem.className = 'bank-item';
        bankItem.innerHTML = `
            <div class="form-group">
                <label for="bank${this.bankCounter}">البنك</label>
                <select id="bank${this.bankCounter}" name="bank${this.bankCounter}" class="bank-select" required>
                    <option value="">اختر البنك</option>
                </select>
            </div>
            <div class="form-group">
                <label for="balance${this.bankCounter}">الرصيد</label>
                <div class="balance-input-group">
                    <input type="text" id="balance${this.bankCounter}" name="balance${this.bankCounter}" placeholder="0.00" inputmode="decimal" required>
                    <select id="currency${this.bankCounter}" name="currency${this.bankCounter}" class="currency-select">
                        <option value="جنيه" selected>جنيه</option>
                        <option value="ريال">ريال</option>
                        <option value="دولار">دولار</option>
                        <option value="يورو">يورو</option>
                    </select>
                </div>
            </div>
            <button type="button" onclick="this.parentElement.remove()" class="remove-field-btn">حذف</button>
        `;
        container.appendChild(bankItem);
        this.updateBankSelects();
        
        // إضافة تنسيق الأرقام للحقل الجديد
        setTimeout(() => {
            this.addNumberFormattingListeners();
        }, 100);
    }

    openModal() {
        document.getElementById('addBankModal').style.display = 'flex';
        document.getElementById('newBankName').focus();
    }

    closeModal() {
        document.getElementById('addBankModal').style.display = 'none';
        document.getElementById('newBankName').value = '';
    }

    addNewBank() {
        const bankName = document.getElementById('newBankName').value.trim();
        if (bankName && !this.banks.includes(bankName)) {
            this.banks.push(bankName);
            this.saveBanks();
            this.renderSavedBanks();
            this.updateBankSelects();
            this.closeModal();
        }
    }

    removeBank(index) {
        this.banks.splice(index, 1);
        this.saveBanks();
        this.renderSavedBanks();
        this.updateBankSelects();
    }

    sendToWhatsApp() {
        const formData = new FormData(document.getElementById('balanceForm'));
        const banks = [];
        
        // جمع البيانات من النموذج
        for (let [key, value] of formData.entries()) {
            if (key.startsWith('bank') && value) {
                const index = key.replace('bank', '');
                const balanceValue = formData.get(`balance${index}`);
                const currency = formData.get(`currency${index}`);
                
                if (balanceValue) {
                    const balance = this.parseNumber(balanceValue);
                    banks.push({
                        name: value,
                        balance: balance,
                        currency: currency
                    });
                }
            }
        }

        if (banks.length === 0) {
            alert('الرجاء إدخال بيانات بنك واحد على الأقل');
            return;
        }

        // إنشاء رسالة الواتساب
        let message = 'أرصدة البنوك الآن\n';
        
        // إضافة البنوك
        banks.forEach(bank => {
            message += `البنك : ${bank.name}\n`;
            message += `الرصيد : ${this.formatNumber(bank.balance)} ${bank.currency}\n`;
        });

        // حساب الإجمالي لكل عملة
        const totals = {};
        banks.forEach(bank => {
            if (!totals[bank.currency]) {
                totals[bank.currency] = 0;
            }
            totals[bank.currency] += bank.balance;
        });

        // إضافة الإجماليات
        message += '\nالإجمالي:\n';
        for (const [currency, total] of Object.entries(totals)) {
            message += `${this.formatNumber(total)} ${currency}\n`;
        }

        // إرسال إلى الواتساب
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }
}

// تهيئة التطبيق
const app = new BankBalanceApp();
