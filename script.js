// ملف JavaScript عام للتطبيق
document.addEventListener('DOMContentLoaded', function() {
    // إضافة تأثيرات حركية للأزرار
    const buttons = document.querySelectorAll('.btn:not(:disabled)');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // إنشاء تأثير النقرة
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            this.appendChild(ripple);
            
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // إضافة وظيفة تصدير جميع البيانات
    const exportBtn = document.getElementById('exportAllData');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportAllData);
    }
});

// دالة تصدير جميع بيانات الموقع
function exportAllData() {
    try {
        // جمع البيانات من جميع الأقسام
        const bankBalances = getBankBalances();
        const bankTransactions = getBankTransactions();
        const cheques = getCheques();
        const transfers = getTransfers();

        // إنشاء مصنف Excel متعدد الأوراق
        const wb = XLSX.utils.book_new();

        // ورقة أرصدة البنوك
        if (bankBalances.length > 0) {
            const balancesWs = XLSX.utils.json_to_sheet(bankBalances);
            XLSX.utils.book_append_sheet(wb, balancesWs, 'أرصدة البنوك');
        }

        // ورقة حركات البنوك
        if (bankTransactions.length > 0) {
            const transactionsWs = XLSX.utils.json_to_sheet(bankTransactions);
            XLSX.utils.book_append_sheet(wb, transactionsWs, 'حركات البنوك');
        }

        // ورقة الشيكات
        if (cheques.length > 0) {
            const chequesWs = XLSX.utils.json_to_sheet(cheques);
            XLSX.utils.book_append_sheet(wb, chequesWs, 'الشيكات');
        }

        // ورقة التحويلات
        if (transfers.length > 0) {
            const transfersWs = XLSX.utils.json_to_sheet(transfers);
            XLSX.utils.book_append_sheet(wb, transfersWs, 'التحويلات');
        }

        // تنزيل الملف
        const fileName = `تسهيلات_جميع_البيانات_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.xlsx`;
        XLSX.writeFile(wb, fileName);

    } catch (error) {
        console.error('Export error:', error);
        alert('حدث خطأ أثناء تصدير البيانات!');
    }
}

// دوال جلب البيانات من LocalStorage
function getBankBalances() {
    const saved = localStorage.getItem('bankBalances');
    if (!saved) return [];
    
    try {
        const balances = JSON.parse(saved);
        return balances.map((balance, index) => ({
            'م': index + 1,
            'البنك': balance.bankName,
            'الرصيد': balance.amount,
            'العملة': balance.currency,
            'التاريخ': new Date(balance.date).toLocaleDateString('ar-SA'),
            'ملاحظات': balance.notes || ''
        }));
    } catch (e) {
        return [];
    }
}

function getBankTransactions() {
    const saved = localStorage.getItem('bankTransactions');
    if (!saved) return [];
    
    try {
        const transactions = JSON.parse(saved);
        return transactions.map((transaction, index) => ({
            'م': index + 1,
            'النوع': transaction.type,
            'البنك': transaction.bankName,
            'المبلغ': transaction.amount,
            'العملة': transaction.currency,
            'التاريخ': new Date(transaction.date).toLocaleDateString('ar-SA'),
            'الوصف': transaction.description || '',
            'ملاحظات': transaction.notes || ''
        }));
    } catch (e) {
        return [];
    }
}

function getCheques() {
    const saved = localStorage.getItem('cheques');
    if (!saved) return [];
    
    try {
        const cheques = JSON.parse(saved);
        return cheques.map((cheque, index) => ({
            'م': index + 1,
            'رقم الشيك': cheque.chequeNumber,
            'البنك': cheque.bankName,
            'اسم العميل': cheque.clientName,
            'المبلغ': cheque.amount,
            'العملة': cheque.currency,
            'تاريخ الاستحقاق': new Date(cheque.dueDate).toLocaleDateString('ar-SA'),
            'الحالة': getChequeStatus(cheque),
            'ملاحظات': cheque.notes || '',
            'تاريخ الإضافة': new Date(cheque.createdAt).toLocaleDateString('ar-SA'),
            'تاريخ الصرف': cheque.cashedAt ? new Date(cheque.cashedAt).toLocaleDateString('ar-SA') : '',
            'طريقة الصرف': cheque.cashMethod || '',
            'جلب الأصل': cheque.originalCollected || ''
        }));
    } catch (e) {
        return [];
    }
}

function getTransfers() {
    const saved = localStorage.getItem('transfers');
    if (!saved) return [];
    
    try {
        const transfers = JSON.parse(saved);
        return transfers.map((transfer, index) => ({
            'م': index + 1,
            'التحويلة': transfer.transferNumber,
            'من': transfer.fromAccount,
            'إلى': transfer.toAccount,
            'المبلغ': transfer.amount,
            'العملة': transfer.currency,
            'تاريخ التحويلة': new Date(transfer.transferDate).toLocaleDateString('ar-SA'),
            'تاريخ الاستحقاق': new Date(transfer.dueDate).toLocaleDateString('ar-SA'),
            'الحالة': getTransferStatus(transfer),
            'ملاحظات': transfer.notes || ''
        }));
    } catch (e) {
        return [];
    }
}

function getChequeStatus(cheque) {
    if (cheque.status === 'cashed') return 'تم الصرف';
    if (cheque.status === 'cancelled') return 'ملغي';
    
    const today = new Date();
    const dueDate = new Date(cheque.dueDate);
    
    if (dueDate < today) return 'متأخر';
    return 'مستحق';
}

function getTransferStatus(transfer) {
    if (transfer.status === 'completed') return 'مكتمل';
    if (transfer.status === 'cancelled') return 'ملغي';
    return 'مستحق';
}

// إضافة كود CSS للتأثيرات
const style = document.createElement('style');
style.textContent = `
    .btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
