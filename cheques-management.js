class ChequesManagementApp {
    constructor() {
        this.cheques = this.loadCheques();
        this.banks = this.loadBanks();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateBankSelects();
        this.renderChequesList();
        this.setupNumberFormatting();
        this.setDefaultDate();
    }

    loadCheques() {
        const saved = localStorage.getItem('cheques');
        return saved ? JSON.parse(saved) : [];
    }

    saveCheques() {
        localStorage.setItem('cheques', JSON.stringify(this.cheques));
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
        // التبويبات
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // نموذج إضافة شيك
        document.getElementById('chequeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCheque();
        });

        // الفلاتر
        document.getElementById('statusFilter').addEventListener('change', () => this.renderChequesList());
        document.getElementById('bankFilter').addEventListener('change', () => this.renderChequesList());

        // المودال
        document.getElementById('closeDetails').addEventListener('click', () => this.closeModal());
        document.getElementById('cashCheque').addEventListener('click', () => this.showCashDateSection());
        document.getElementById('confirmCashDate').addEventListener('click', () => this.cashChequeWithDate());
        document.getElementById('cancelCashDate').addEventListener('click', () => this.hideCashDateSection());
        document.getElementById('cancelCheque').addEventListener('click', () => this.cancelCheque());
        document.getElementById('chequeDetailsModal').addEventListener('click', (e) => {
            if (e.target.id === 'chequeDetailsModal') {
                this.closeModal();
            }
        });

        // أزرار الطباعة
        document.getElementById('printPending').addEventListener('click', () => this.printCheques('pending'));
        document.getElementById('printCashed').addEventListener('click', () => this.printCheques('cashed'));
        document.getElementById('printAll').addEventListener('click', () => this.printCheques('all'));
        document.getElementById('sendWhatsApp').addEventListener('click', () => this.sendWhatsAppSingle());
        document.getElementById('sendWhatsAppOverdueToday').addEventListener('click', () => this.sendWhatsAppFiltered('overdue_today'));
        document.getElementById('sendWhatsAppFromToday').addEventListener('click', () => this.sendWhatsAppFiltered('from_today'));
    }

    updateBankSelects() {
        const selects = [document.getElementById('bankName'), document.getElementById('bankFilter')];
        
        selects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = select.id === 'bankFilter' ? 
                '<option value="all">الكل</option>' : 
                '<option value="">اختر البنك</option>';
            
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

    setupNumberFormatting() {
        const amountInput = document.getElementById('amount');
        amountInput.addEventListener('input', (e) => this.formatNumberInput(e));
        amountInput.addEventListener('blur', (e) => this.formatNumberInput(e));
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

    setDefaultDate() {
        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(today.getDate() + 30); // تاريخ الاستحقاق بعد 30 يوم افتراضي
        
        document.getElementById('dueDate').value = dueDate.toISOString().split('T')[0];
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
            this.renderChequesList();
            this.updateStatistics();
            this.updateTotals();
        }
    }

    addCheque() {
        const formData = new FormData(document.getElementById('chequeForm'));
        
        const cheque = {
            id: Date.now(),
            chequeNumber: formData.get('chequeNumber'),
            bankName: formData.get('bankName'),
            clientName: formData.get('clientName'),
            amount: this.parseNumber(formData.get('amount')),
            currency: formData.get('currency'),
            dueDate: formData.get('dueDate'),
            notes: formData.get('notes'),
            status: 'pending',
            createdAt: new Date().toISOString(),
            cashedAt: null
        };

        this.cheques.push(cheque);
        this.saveCheques();
        
        // إعادة تعيين النموذج
        document.getElementById('chequeForm').reset();
        this.setDefaultDate();
        
        alert('تم حفظ الشيك بنجاح!');
        
        // الانتقال إلى قائمة الشيكات
        this.switchTab('list');
        this.updateStatistics();
        this.updateTotals();
    }

    renderChequesList() {
        const container = document.getElementById('chequesList');
        const statusFilter = document.getElementById('statusFilter').value;
        const bankFilter = document.getElementById('bankFilter').value;
        
        let filteredCheques = this.cheques;
        
        // تطبيق الفلاتر
        if (statusFilter !== 'all') {
            filteredCheques = filteredCheques.filter(cheque => cheque.status === statusFilter);
        }
        
        if (bankFilter !== 'all') {
            filteredCheques = filteredCheques.filter(cheque => cheque.bankName === bankFilter);
        }

        // ترتيب حسب تاريخ الاستحقاق
        filteredCheques.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        if (filteredCheques.length === 0) {
            container.innerHTML = '<div class="no-cheques">لا توجد شيكات مطابقة</div>';
            return;
        }

        container.innerHTML = filteredCheques.map(cheque => {
            const status = this.getChequeStatus(cheque);
            const statusClass = this.getStatusClass(cheque);
            
            return `
                <div class="cheque-item ${statusClass}" onclick="app.showChequeDetails(${cheque.id})">
                    <div class="cheque-header">
                        <h4>شيك رقم: ${cheque.chequeNumber}</h4>
                        <span class="status-badge">${status}</span>
                    </div>
                    <div class="cheque-info">
                        <p><strong>البنك:</strong> ${cheque.bankName}</p>
                        <p><strong>العميل:</strong> ${cheque.clientName}</p>
                        <p><strong>المبلغ:</strong> ${this.formatNumber(cheque.amount)} ${cheque.currency}</p>
                        <p><strong>تاريخ الاستحقاق:</strong> ${new Date(cheque.dueDate).toLocaleDateString('ar-SA')}</p>
                        ${cheque.cashedAt ? `<p><strong>تاريخ الصرف:</strong> ${new Date(cheque.cashedAt).toLocaleDateString('ar-SA')}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        this.updateStatistics();
        this.updateTotals();
    }

    getChequeStatus(cheque) {
        if (cheque.status === 'cashed') return 'تم الصرف';
        if (cheque.status === 'cancelled') return 'ملغي';
        
        const today = new Date();
        const dueDate = new Date(cheque.dueDate);
        
        if (dueDate < today) return 'متأخر';
        return 'مستحق';
    }

    getStatusClass(cheque) {
        if (cheque.status === 'cashed') return 'cashed';
        if (cheque.status === 'cancelled') return 'cancelled';
        
        const today = new Date();
        const dueDate = new Date(cheque.dueDate);
        
        if (dueDate < today) return 'overdue';
        return 'pending';
    }

    showChequeDetails(chequeId) {
        const cheque = this.cheques.find(c => c.id === chequeId);
        if (!cheque) return;

        const status = this.getChequeStatus(cheque);
        
        document.getElementById('chequeDetails').innerHTML = `
            <div class="detail-row">
                <strong>رقم الشيك:</strong> ${cheque.chequeNumber}
            </div>
            <div class="detail-row">
                <strong>البنك:</strong> ${cheque.bankName}
            </div>
            <div class="detail-row">
                <strong>العميل:</strong> ${cheque.clientName}
            </div>
            <div class="detail-row">
                <strong>المبلغ:</strong> ${this.formatNumber(cheque.amount)} ${cheque.currency}
            </div>
            <div class="detail-row">
                <strong>تاريخ الاستحقاق:</strong> ${new Date(cheque.dueDate).toLocaleDateString('ar-SA')}
            </div>
            <div class="detail-row">
                <strong>الحالة:</strong> <span class="status-badge">${status}</span>
            </div>
            ${cheque.notes ? `
                <div class="detail-row">
                    <strong>ملاحظات:</strong> ${cheque.notes}
                </div>
            ` : ''}
            <div class="detail-row">
                <strong>تاريخ الإضافة:</strong> ${new Date(cheque.createdAt).toLocaleDateString('ar-SA')}
            </div>
            ${cheque.cashedAt ? `
                <div class="detail-row">
                    <strong>تاريخ الصرف:</strong> ${new Date(cheque.cashedAt).toLocaleDateString('ar-SA')}
                </div>
            ` : ''}
        `;

        // تحديث أزرار الإجراءات
        const cashBtn = document.getElementById('cashCheque');
        const cancelBtn = document.getElementById('cancelCheque');
        
        if (cheque.status === 'cashed' || cheque.status === 'cancelled') {
            cashBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
        } else {
            cashBtn.style.display = 'inline-block';
            cancelBtn.style.display = 'inline-block';
        }

        document.getElementById('chequeDetailsModal').style.display = 'flex';
    }

    closeModal() {
        document.getElementById('chequeDetailsModal').style.display = 'none';
    }

    cashCheque() {
        const modal = document.getElementById('chequeDetailsModal');
        const chequeId = this.getCurrentChequeId();
        
        if (!chequeId) return;

        if (confirm('هل أنت متأكد من صرف هذا الشيك؟')) {
            const cheque = this.cheques.find(c => c.id === chequeId);
            if (cheque) {
                cheque.status = 'cashed';
                cheque.cashedAt = new Date().toISOString();
                this.saveCheques();
                this.closeModal();
                this.renderChequesList();
                alert('تم صرف الشيك بنجاح!');
            }
        }
    }

    cancelCheque() {
        const chequeId = this.getCurrentChequeId();
        
        if (!chequeId) return;

        if (confirm('هل أنت متأكد من إلغاء هذا الشيك؟')) {
            const cheque = this.cheques.find(c => c.id === chequeId);
            if (cheque) {
                cheque.status = 'cancelled';
                this.saveCheques();
                this.closeModal();
                this.renderChequesList();
                alert('تم إلغاء الشيك بنجاح!');
            }
        }
    }

    getCurrentChequeId() {
        // هذه دالة مؤقتة للحصول على ID الشيك الحالي
        // في تطبيق حقيقي، يجب تخزين الـ ID بشكل أفضل
        const detailsHtml = document.getElementById('chequeDetails').innerHTML;
        const match = detailsHtml.match(/رقم الشيك:<\/strong> (\d+)/);
        if (match) {
            const chequeNumber = match[1];
            return this.cheques.find(c => c.chequeNumber === chequeNumber)?.id;
        }
        return null;
    }

    // دوال الإحصائيات
    updateStatistics() {
        const total = this.cheques.length;
        const pending = this.cheques.filter(c => c.status === 'pending').length;
        const overdue = this.cheques.filter(c => {
            if (c.status !== 'pending') return false;
            const today = new Date();
            const dueDate = new Date(c.dueDate);
            return dueDate < today;
        }).length;
        const cashed = this.cheques.filter(c => c.status === 'cashed').length;

        document.getElementById('totalCheques').textContent = total;
        document.getElementById('pendingCheques').textContent = pending;
        document.getElementById('overdueCheques').textContent = overdue;
        document.getElementById('cashedCheques').textContent = cashed;
    }

    updateTotals() {
        const pendingCheques = this.cheques.filter(c => c.status === 'pending');
        const totalsByCurrency = {};

        pendingCheques.forEach(cheque => {
            if (!totalsByCurrency[cheque.currency]) {
                totalsByCurrency[cheque.currency] = 0;
            }
            totalsByCurrency[cheque.currency] += cheque.amount;
        });

        const totalsGrid = document.getElementById('totalsGrid');
        if (Object.keys(totalsByCurrency).length === 0) {
            totalsGrid.innerHTML = '<div class="no-totals">لا توجد مبالغ مستحقة</div>';
        } else {
            totalsGrid.innerHTML = Object.entries(totalsByCurrency).map(([currency, total]) => `
                <div class="total-item">
                    <span class="total-amount">${this.formatNumber(total)}</span>
                    <span class="total-currency">${currency}</span>
                </div>
            `).join('');
        }
    }

    // دوال تاريخ الصرف
    showCashDateSection() {
        document.getElementById('cashDateSection').style.display = 'block';
        document.getElementById('cashDate').value = new Date().toISOString().split('T')[0];
        
        // إخفاء الأزرار الأصلية
        document.getElementById('cashCheque').style.display = 'none';
        document.getElementById('cancelCheque').style.display = 'none';
    }

    hideCashDateSection() {
        document.getElementById('cashDateSection').style.display = 'none';
        
        // إظهار الأزرار الأصلية
        document.getElementById('cashCheque').style.display = 'inline-block';
        document.getElementById('cancelCheque').style.display = 'inline-block';
    }

    cashChequeWithDate() {
        const chequeId = this.getCurrentChequeId();
        const cashDate = document.getElementById('cashDate').value;
        
        if (!chequeId || !cashDate) return;

        if (confirm('هل أنت متأكد من صرف هذا الشيك؟')) {
            const cheque = this.cheques.find(c => c.id === chequeId);
            if (cheque) {
                cheque.status = 'cashed';
                cheque.cashedAt = new Date(cashDate).toISOString();
                this.saveCheques();
                this.closeModal();
                this.renderChequesList();
                alert('تم صرف الشيك بنجاح!');
            }
        }
    }

    // دوال الطباعة
    printCheques(filter) {
        let chequesToPrint = this.cheques;
        
        if (filter === 'pending') {
            chequesToPrint = this.cheques.filter(c => c.status === 'pending');
        } else if (filter === 'cashed') {
            chequesToPrint = this.cheques.filter(c => c.status === 'cashed');
        }

        if (chequesToPrint.length === 0) {
            alert('لا توجد شيكات للطباعة');
            return;
        }

        const printWindow = window.open('', '_blank');
        const title = filter === 'pending' ? 'الشيكات المستحقة' : 
                     filter === 'cashed' ? 'الشيكات المنصرفة' : 'جميع الشيكات';
        
        let html = `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; }
                    h1 { text-align: center; color: #333; margin-bottom: 30px; }
                    .cheque { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
                    .cheque h3 { margin: 0 0 10px 0; color: #667eea; }
                    .cheque p { margin: 5px 0; }
                    .status { font-weight: bold; padding: 3px 8px; border-radius: 3px; color: white; }
                    .status.pending { background: #667eea; }
                    .status.cashed { background: #28a745; }
                    .status.overdue { background: #ffc107; color: #333; }
                    @media print { body { padding: 10px; } }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
        `;

        chequesToPrint.forEach(cheque => {
            const status = this.getChequeStatus(cheque);
            const statusClass = this.getStatusClass(cheque);
            
            html += `
                <div class="cheque">
                    <h3>شيك رقم: ${cheque.chequeNumber}</h3>
                    <p><strong>البنك:</strong> ${cheque.bankName}</p>
                    <p><strong>العميل:</strong> ${cheque.clientName}</p>
                    <p><strong>المبلغ:</strong> ${this.formatNumber(cheque.amount)} ${cheque.currency}</p>
                    <p><strong>تاريخ الاستحقاق:</strong> ${new Date(cheque.dueDate).toLocaleDateString('ar-SA')}</p>
                    ${cheque.cashedAt ? `<p><strong>تاريخ الصرف:</strong> ${new Date(cheque.cashedAt).toLocaleDateString('ar-SA')}</p>` : ''}
                    <p><strong>الحالة:</strong> <span class="status ${statusClass}">${status}</span></p>
                    ${cheque.notes ? `<p><strong>ملاحظات:</strong> ${cheque.notes}</p>` : ''}
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

    // دالة حساب أيام التأخير
    calculateOverdueDays(dueDate) {
        const today = new Date();
        const due = new Date(dueDate);
        if (due >= today) return 0;
        
        const diffTime = Math.abs(today - due);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    // إرسال تفاصيل شيك واحد عبر واتساب
    sendWhatsAppSingle() {
        const chequeId = this.getCurrentChequeId();
        if (!chequeId) return;

        const cheque = this.cheques.find(c => c.id === chequeId);
        if (!cheque) return;

        const overdueDays = this.calculateOverdueDays(cheque.dueDate);
        const status = this.getChequeStatus(cheque);

        let message = `*تفاصيل الشيك المستحق*\n\n`;
        message += `*اسم الشركة/العميل:* ${cheque.clientName}\n`;
        message += `*رقم الشيك:* ${cheque.chequeNumber}\n`;
        message += `*البنك:* ${cheque.bankName}\n`;
        message += `*قيمة الشيك:* ${this.formatNumber(cheque.amount)} ${cheque.currency}\n`;
        message += `*تاريخ الاستحقاق:* ${new Date(cheque.dueDate).toLocaleDateString('ar-SA')}\n`;
        message += `*الحالة:* ${status}\n`;
        
        if (overdueDays > 0) {
            message += `*أيام التأخير:* ${overdueDays} يوم\n`;
        }

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    }

    // إرسال الشيكات المفلترة عبر واتساب
    sendWhatsAppFiltered(type) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let filteredCheques = [];
        let title = "";

        if (type === 'overdue_today') {
            title = "المتأخر واستحقاق اليوم";
            filteredCheques = this.cheques.filter(c => {
                if (c.status !== 'pending') return false;
                // تحويل تاريخ الاستحقاق إلى كائن تاريخ مع تصفير الوقت للمقارنة الدقيقة
                const dueDate = new Date(c.dueDate);
                const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
                const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                return dueDateOnly <= todayOnly;
            });
        } else if (type === 'from_today') {
            title = "المستحق من اليوم فصاعداً";
            filteredCheques = this.cheques.filter(c => {
                if (c.status !== 'pending') return false;
                const dueDate = new Date(c.dueDate);
                const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
                const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                return dueDateOnly >= todayOnly;
            });
        }

        if (filteredCheques.length === 0) {
            alert(`لا توجد شيكات في قائمة (${title})`);
            return;
        }

        // ترتيب حسب تاريخ الاستحقاق
        filteredCheques.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        let message = `*تقرير الشيكات: ${title}*\n`;
        message += `*تاريخ التقرير:* ${new Date().toLocaleDateString('ar-SA')}\n\n`;

        filteredCheques.forEach((cheque, index) => {
            const overdueDays = this.calculateOverdueDays(cheque.dueDate);
            message += `${index + 1}. *${cheque.clientName}*\n`;
            message += `   - القيمة: ${this.formatNumber(cheque.amount)} ${cheque.currency}\n`;
            message += `   - الاستحقاق: ${new Date(cheque.dueDate).toLocaleDateString('ar-SA')}\n`;
            if (overdueDays > 0) {
                message += `   - التأخير: ${overdueDays} يوم\n`;
            }
            message += `-------------------\n`;
        });

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    }
}

// تهيئة التطبيق
const app = new ChequesManagementApp();
