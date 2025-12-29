/**
 * PDF Generator Utility for SIFIXA Customer Portal
 * Uses browser print functionality to generate PDF receipts
 */

/**
 * Generate and download a PDF receipt for an invoice
 * @param {Object} invoice - The invoice object containing all receipt data
 * @param {Object} customer - Customer information
 */
export const generateInvoicePDF = (invoice, customer = {}) => {
    // Create a new window for the printable receipt
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (!printWindow) {
        alert('Please allow pop-ups to download PDF receipts');
        return;
    }

    const itemsHTML = invoice.items?.map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description || item.name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.price || item.amount || 0).toFixed(2)}</td>
        </tr>
    `).join('') || '';

    const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>SIFIXA Receipt - ${invoice.id}</title>
            <meta charset="UTF-8">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: #f8fafc;
                    padding: 40px;
                    color: #1e293b;
                }
                .receipt {
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }
                .header {
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }
                .logo {
                    font-size: 2rem;
                    font-weight: 800;
                    margin-bottom: 8px;
                }
                .header p {
                    opacity: 0.9;
                    font-size: 0.9rem;
                }
                .content {
                    padding: 30px;
                }
                .invoice-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #e5e7eb;
                }
                .invoice-info div {
                    text-align: left;
                }
                .invoice-info div:last-child {
                    text-align: right;
                }
                .label {
                    font-size: 0.75rem;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 4px;
                }
                .value {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #1e293b;
                }
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                .items-table th {
                    text-align: left;
                    padding: 12px;
                    background: #f1f5f9;
                    font-weight: 600;
                    color: #475569;
                    font-size: 0.85rem;
                }
                .items-table th:last-child {
                    text-align: right;
                }
                .total-row {
                    background: #f8fafc;
                }
                .total-row td {
                    padding: 16px 12px;
                    font-weight: 700;
                    font-size: 1.1rem;
                }
                .status {
                    display: inline-block;
                    padding: 6px 16px;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin-top: 20px;
                }
                .status.paid {
                    background: #dcfce7;
                    color: #16a34a;
                }
                .status.pending {
                    background: #fef3c7;
                    color: #d97706;
                }
                .footer {
                    text-align: center;
                    padding: 20px 30px 30px;
                    color: #64748b;
                    font-size: 0.85rem;
                    border-top: 1px solid #e5e7eb;
                }
                .security-notice {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 15px;
                    padding: 12px;
                    background: #f0fdf4;
                    border-radius: 8px;
                    color: #16a34a;
                    font-size: 0.8rem;
                }
                @media print {
                    body {
                        background: white;
                        padding: 0;
                    }
                    .receipt {
                        box-shadow: none;
                    }
                    .no-print {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="header">
                    <div class="logo">SIFIXA</div>
                    <p>Device Repair Services</p>
                </div>
                <div class="content">
                    <div class="invoice-info">
                        <div>
                            <div class="label">Invoice Number</div>
                            <div class="value">${invoice.id}</div>
                        </div>
                        <div>
                            <div class="label">Date</div>
                            <div class="value">${invoice.date || new Date().toLocaleDateString()}</div>
                        </div>
                    </div>
                    
                    ${customer.name ? `
                    <div class="invoice-info">
                        <div>
                            <div class="label">Customer</div>
                            <div class="value">${customer.name}</div>
                            ${customer.email ? `<div style="color: #64748b; font-size: 0.85rem;">${customer.email}</div>` : ''}
                        </div>
                    </div>
                    ` : ''}

                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHTML}
                            <tr class="total-row">
                                <td>Total</td>
                                <td style="text-align: right;">$${(invoice.total || 0).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style="text-align: center;">
                        <span class="status ${(invoice.status || 'paid').toLowerCase()}">${invoice.status || 'Paid'}</span>
                    </div>
                </div>
                <div class="footer">
                    <p>Thank you for choosing SIFIXA!</p>
                    <p style="margin-top: 8px;">Questions? Contact us at support@sifixa.com</p>
                    <div class="security-notice">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        Secure Payment • Verified Transaction
                    </div>
                </div>
            </div>
            <div class="no-print" style="text-align: center; margin-top: 30px;">
                <button onclick="window.print(); setTimeout(() => window.close(), 500);" 
                    style="padding: 12px 32px; font-size: 1rem; font-weight: 600; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Download PDF
                </button>
                <button onclick="window.close();" 
                    style="padding: 12px 32px; font-size: 1rem; font-weight: 600; background: #e5e7eb; color: #475569; border: none; border-radius: 8px; cursor: pointer; margin-left: 12px;">
                    Close
                </button>
            </div>
        </body>
        </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
};

export default { generateInvoicePDF };
