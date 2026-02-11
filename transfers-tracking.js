class TransfersTrackingApp {
    constructor() {
        this.transfers = this.loadTransfers();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDate();
        this.setupNumberFormatting();
        this.setupExchangeRateCalculation();
    }

    loadTransfers() {
        const saved = localStorage.getItem('transfers');
        return saved ? JSON.parse(saved) : [];
    }

    saveTransfers() {
        localStorage.setItem('transfers', JSON.stringify(this.transfers));
    }

    setupEventListeners() {
        // التبويبات
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // نموذج إضافة تحويلة
        document.getElementById('transferForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransfer();
        });

        // حساب المبلغ المحلي
        document.getElementById('transferAmount').addEventListener('input', () => this.calculateLocalAmount());
        document.getElementById('exchangeRate').addEventListener('input', () => this.calculateLocalAmount());

        // الفلاتر
        document.getElementById('monthFilter').addEventListener('change', () => this.renderTransfersList());
        document.getElementById('countryFilter').addEventListener('change', () => this.renderTransfersList());

        // المودال
        document.getElementById('closeTransferDetails').addEventListener('click', () => this.closeModal());
        document.getElementById('deleteTransfer').addEventListener('click', () => this.deleteTransfer());
        document.getElementById('transferDetailsModal').addEventListener('click', (e) => {
            if (e.target.id === 'transferDetailsModal') {
                this.closeModal();
            }
        });

        // أزرار الطباعة والتصدير
        document.getElementById('printTransfers').addEventListener('click', () => this.printTransfers());
        document.getElementById('exportData').addEventListener('click', () => this.exportData());
    }

    setupNumberFormatting() {
        const amountInputs = document.querySelectorAll('#transferAmount, #exchangeRate, #localAmount');
        amountInputs.forEach(input => {
            input.addEventListener('input', (e) => this.formatNumberInput(e));
            input.addEventListener('blur', (e) => this.formatNumberInput(e));
        });
    }

    formatNumberInput(event) {
        let value = event.target.value.replace(/,/g, '');
        
        value = value.replace(/[^0-9.]/g, '');
        
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        
        if (parts.length === 2 && parts[1].length > 2) {
            value = parts[0] + '.' + parts[1].substring(0, 2);
        }
        
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

    setupExchangeRateCalculation() {
        // يمكن إضافة سعر صرف افتراضي أو جلبه من API
        document.getElementById('exchangeRate').value = '30.90'; // سعر صرف افتراضي
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('transferDate').value = today;
    }

    calculateLocalAmount() {
        const dollarAmount = this.parseNumber(document.getElementById('transferAmount').value) || 0;
        const exchangeRate = this.parseNumber(document.getElementById('exchangeRate').value) || 0;
        const localAmount = dollarAmount * exchangeRate;
        
        document.getElementById('localAmount').value = this.formatNumber(localAmount);
    }

    switchTab(tabName) {
        // تحديث الأزرار
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // تحديث المحتوى
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // تحديث القائمة عند الانتقال إليها
        if (tabName === 'list') {
            this.renderTransfersList();
            this.updateStatistics();
            this.updateFilters();
        }
    }

    addTransfer() {
        const formData = new FormData(document.getElementById('transferForm'));
        
        const transfer = {
            id: Date.now(),
            transferDate: formData.get('transferDate'),
            senderName: formData.get('senderName'),
            senderCountry: formData.get('senderCountry'),
            transferAmount: this.parseNumber(formData.get('transferAmount')),
            exchangeRate: this.parseNumber(formData.get('exchangeRate')),
            localAmount: this.parseNumber(formData.get('localAmount')),
            recipientName: formData.get('recipientName'),
            transferPurpose: formData.get('transferPurpose'),
            transferCompany: formData.get('transferCompany'),
            referenceNumber: formData.get('referenceNumber'),
            notes: formData.get('notes'),
            createdAt: new Date().toISOString()
        };

        this.transfers.push(transfer);
        this.saveTransfers();
        
        // إعادة تعيين النموذج
        document.getElementById('transferForm').reset();
        this.setDefaultDate();
        this.setupExchangeRateCalculation();
        
        alert('تم حفظ التحويلة بنجاح!');
        
        // الانتقال إلى قائمة التحويلات
        this.switchTab('list');
    }

    updateFilters() {
        // تحديث فلتر الشهور
        const monthFilter = document.getElementById('monthFilter');
        const months = [...new Set(this.transfers.map(t => {
            const date = new Date(t.transferDate);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }))].sort().reverse();

        monthFilter.innerHTML = '<option value="all">كل الأشهر</option>';
        months.forEach(month => {
            const [year, monthNum] = month.split('-');
            const monthName = new Date(year, monthNum - 1).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });
            const option = document.createElement('option');
            option.value = month;
            option.textContent = monthName;
            monthFilter.appendChild(option);
        });

        // تحديث فلتر البلدان
        const countryFilter = document.getElementById('countryFilter');
        const countries = [...new Set(this.transfers.map(t => t.senderCountry))].sort();
        
        countryFilter.innerHTML = '<option value="all">كل البلدان</option>';
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countryFilter.appendChild(option);
        });
    }

    renderTransfersList() {
        const container = document.getElementById('transfersList');
        const monthFilter = document.getElementById('monthFilter').value;
        const countryFilter = document.getElementById('countryFilter').value;
        
        let filteredTransfers = this.transfers;
        
        // تطبيق الفلاتر
        if (monthFilter !== 'all') {
            filteredTransfers = filteredTransfers.filter(transfer => {
                const transferDate = new Date(transfer.transferDate);
                const filterDate = new Date(monthFilter + '-01');
                return transferDate.getMonth() === filterDate.getMonth() && 
                       transferDate.getFullYear() === filterDate.getFullYear();
            });
        }
        
        if (countryFilter !== 'all') {
            filteredTransfers = filteredTransfers.filter(transfer => 
                transfer.senderCountry === countryFilter
            );
        }

        // ترتيب حسب التاريخ (الأحدث أولاً)
        filteredTransfers.sort((a, b) => new Date(b.transferDate) - new Date(a.transferDate));

        if (filteredTransfers.length === 0) {
            container.innerHTML = '<div class="no-transfers">لا توجد تحويلات مطابقة</div>';
            return;
        }

        container.innerHTML = filteredTransfers.map(transfer => `
            <div class="transfer-item" onclick="app.showTransferDetails(${transfer.id})">
                <div class="transfer-header">
                    <h4>$${this.formatNumber(transfer.transferAmount)}</h4>
                    <span class="date-badge">${new Date(transfer.transferDate).toLocaleDateString('ar-SA')}</span>
                </div>
                <div class="transfer-info">
                    <p><strong>المرسل:</strong> ${transfer.senderName}</p>
                    <p><strong>البلد:</strong> ${transfer.senderCountry}</p>
                    <p><strong>المستلم:</strong> ${transfer.recipientName}</p>
                    <p><strong>المبلغ المحلي:</strong> ${this.formatNumber(transfer.localAmount)} ج.م</p>
                    <p><strong>الشركة:</strong> ${transfer.transferCompany}</p>
                </div>
            </div>
        `).join('');
    }

    updateStatistics() {
        const total = this.transfers.length;
        const totalDollars = this.transfers.reduce((sum, t) => sum + t.transferAmount, 0);
        const totalLocal = this.transfers.reduce((sum, t) => sum + t.localAmount, 0);
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const thisMonth = this.transfers.filter(t => {
            const date = new Date(t.transferDate);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).length;

        document.getElementById('totalTransfers').textContent = total;
        document.getElementById('totalDollars').textContent = `$${this.formatNumber(totalDollars)}`;
        document.getElementById('totalLocal').textContent = `${this.formatNumber(totalLocal)} ج.م`;
        document.getElementById('thisMonth').textContent = thisMonth;
    }

    showTransferDetails(transferId) {
        const transfer = this.transfers.find(t => t.id === transferId);
        if (!transfer) return;

        document.getElementById('transferDetails').innerHTML = `
            <div class="detail-row">
                <strong>تاريخ التحويلة:</strong> ${new Date(transfer.transferDate).toLocaleDateString('ar-SA')}
            </div>
            <div class="detail-row">
                <strong>اسم المرسل:</strong> ${transfer.senderName}
            </div>
            <div class="detail-row">
                <strong>بلد المرسل:</strong> ${transfer.senderCountry}
            </div>
            <div class="detail-row">
                <strong>المبلغ بالدولار:</strong> $${this.formatNumber(transfer.transferAmount)}
            </div>
            <div class="detail-row">
                <strong>سعر الصرف:</strong> ${this.formatNumber(transfer.exchangeRate)} ج.م/دولار
            </div>
            <div class="detail-row">
                <strong>المبلغ بالجنيه:</strong> ${this.formatNumber(transfer.localAmount)} ج.م
            </div>
            <div class="detail-row">
                <strong>اسم المستلم:</strong> ${transfer.recipientName}
            </div>
            <div class="detail-row">
                <strong>غرض التحويل:</strong> ${transfer.transferPurpose}
            </div>
            <div class="detail-row">
                <strong>شركة التحويل:</strong> ${transfer.transferCompany}
            </div>
            ${transfer.referenceNumber ? `
                <div class="detail-row">
                    <strong>رقم المرجع:</strong> ${transfer.referenceNumber}
                </div>
            ` : ''}
            ${transfer.notes ? `
                <div class="detail-row">
                    <strong>ملاحظات:</strong> ${transfer.notes}
                </div>
            ` : ''}
            <div class="detail-row">
                <strong>تاريخ الإضافة:</strong> ${new Date(transfer.createdAt).toLocaleDateString('ar-SA')}
            </div>
        `;

        // تخزين الـ ID للحذف
        this.currentTransferId = transferId;
        document.getElementById('transferDetailsModal').style.display = 'flex';
    }

    closeModal() {
        document.getElementById('transferDetailsModal').style.display = 'none';
        this.currentTransferId = null;
    }

    deleteTransfer() {
        if (!this.currentTransferId) return;

        if (confirm('هل أنت متأكد من حذف هذه التحويلة؟')) {
            this.transfers = this.transfers.filter(t => t.id !== this.currentTransferId);
            this.saveTransfers();
            this.closeModal();
            this.renderTransfersList();
            this.updateStatistics();
            alert('تم حذف التحويلة بنجاح!');
        }
    }

    printTransfers() {
        const monthFilter = document.getElementById('monthFilter').value;
        const countryFilter = document.getElementById('countryFilter').value;
        
        let transfersToPrint = this.transfers;
        
        if (monthFilter !== 'all') {
            transfersToPrint = transfersToPrint.filter(transfer => {
                const transferDate = new Date(transfer.transferDate);
                const filterDate = new Date(monthFilter + '-01');
                return transferDate.getMonth() === filterDate.getMonth() && 
                       transferDate.getFullYear() === filterDate.getFullYear();
            });
        }
        
        if (countryFilter !== 'all') {
            transfersToPrint = transfersToPrint.filter(transfer => 
                transfer.senderCountry === countryFilter
            );
        }

        if (transfersToPrint.length === 0) {
            alert('لا توجد تحويلات للطباعة');
            return;
        }

        const printWindow = window.open('', '_blank');
        
        let html = `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>تقرير التحويلات الواردة</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; }
                    h1 { text-align: center; color: #333; margin-bottom: 30px; }
                    .transfer { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
                    .transfer h3 { margin: 0 0 10px 0; color: #667eea; }
                    .transfer p { margin: 5px 0; }
                    .summary { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 30px; }
                    .summary h2 { color: #333; margin-top: 0; }
                    @media print { body { padding: 10px; } }
                </style>
            </head>
            <body>
                <h1>تقرير التحويلات الواردة</h1>
                <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
                
                <div class="summary">
                    <h2>ملخص التحويلات</h2>
                    <p><strong>عدد التحويلات:</strong> ${transfersToPrint.length}</p>
                    <p><strong>إجمالي الدولار:</strong> $${this.formatNumber(transfersToPrint.reduce((sum, t) => sum + t.transferAmount, 0))}</p>
                    <p><strong>إجمالي الجنيه:</strong> ${this.formatNumber(transfersToPrint.reduce((sum, t) => sum + t.localAmount, 0))} ج.م</p>
                </div>
        `;

        transfersToPrint.forEach(transfer => {
            html += `
                <div class="transfer">
                    <h3>$${this.formatNumber(transfer.transferAmount)} - ${transfer.senderName}</h3>
                    <p><strong>التاريخ:</strong> ${new Date(transfer.transferDate).toLocaleDateString('ar-SA')}</p>
                    <p><strong>المرسل:</strong> ${transfer.senderName} (${transfer.senderCountry})</p>
                    <p><strong>المستلم:</strong> ${transfer.recipientName}</p>
                    <p><strong>المبلغ بالدولار:</strong> $${this.formatNumber(transfer.transferAmount)}</p>
                    <p><strong>سعر الصرف:</strong> ${this.formatNumber(transfer.exchangeRate)} ج.م/دولار</p>
                    <p><strong>المبلغ بالجنيه:</strong> ${this.formatNumber(transfer.localAmount)} ج.م</p>
                    <p><strong>الشركة:</strong> ${transfer.transferCompany}</p>
                    <p><strong>الغرض:</strong> ${transfer.transferPurpose}</p>
                    ${transfer.referenceNumber ? `<p><strong>رقم المرجع:</strong> ${transfer.referenceNumber}</p>` : ''}
                    ${transfer.notes ? `<p><strong>ملاحظات:</strong> ${transfer.notes}</p>` : ''}
                </div>
            `;
        });

        html += `
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    }

    exportData() {
        const dataStr = JSON.stringify(this.transfers, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `transfers_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        alert('تم تصدير البيانات بنجاح!');
    }
}

// تهيئة التطبيق
const app = new TransfersTrackingApp();
