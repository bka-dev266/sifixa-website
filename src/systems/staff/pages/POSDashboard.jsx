import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
import { NotificationBell } from '../../../components/Notifications';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/apiClient';
import { mockApi } from '../../../services/mockApi'; // Keep for legacy operations
import {
    ShoppingCart, Plus, Minus, Trash2, DollarSign, CreditCard,
    Banknote, Search, Package, Wrench, BarChart3, Clock,
    CheckCircle, User, LogOut, LayoutDashboard, Receipt,
    X, ChevronRight, ChevronLeft, Phone, ArrowRight, Printer, RefreshCw, Timer
} from 'lucide-react';
import { getDeviceName, getCustomerName, getBookingDate } from '../../../utils/schemaHelpers';
import './POSDashboard.css';

const POSDashboard = () => {
    const { user, logout } = useAuth();
    const { addNotification } = useNotifications();
    const navigate = useNavigate();

    const [activeView, setActiveView] = useState('pos');
    const [products, setProducts] = useState([]);
    const [repairsReady, setRepairsReady] = useState([]);
    const [sales, setSales] = useState([]);
    const [stats, setStats] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Cart state
    const [cart, setCart] = useState([]);
    const [customerName, setCustomerName] = useState('Walk-in Customer');
    const [discount, setDiscount] = useState(0);

    // Checkout modal state
    const [showCheckout, setShowCheckout] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Credit Card');
    const [processing, setProcessing] = useState(false);

    // Receipt modal state
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastSale, setLastSale] = useState(null);

    const TAX_RATE = 0.08; // 8% tax

    useEffect(() => {
        loadData();
    }, []);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => {
            loadData(false);
        }, 30000);
        return () => clearInterval(interval);
    }, [autoRefresh]);

    const loadData = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const [productsData, repairsData, salesData, statsData] = await Promise.all([
                mockApi.getStoreProducts(),
                mockApi.getRepairsReadyForPickup(),
                mockApi.getSales(),
                mockApi.getSalesStats()
            ]);
            setProducts(productsData);
            setRepairsReady(repairsData);
            setSales(salesData);
            setStats(statsData);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error loading data:', error);
        }
        if (showLoading) setLoading(false);
    };


    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const categories = ['all', ...new Set(products.map(p => p.category))];

    const filteredProducts = products
        .filter(p => categoryFilter === 'all' || p.category === categoryFilter)
        .filter(p =>
            searchTerm === '' ||
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    // Cart functions
    const addToCart = (product) => {
        const existing = cart.find(item => item.productId === product.id && item.type === 'product');
        if (existing) {
            if (existing.quantity >= product.quantity) {
                alert('Not enough stock available');
                return;
            }
            setCart(cart.map(item =>
                item.productId === product.id && item.type === 'product'
                    ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
                    : item
            ));
        } else {
            if (product.quantity < 1) {
                alert('Product out of stock');
                return;
            }
            setCart([...cart, {
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                total: product.price,
                type: 'product'
            }]);
        }
    };

    const addRepairToCart = (repair) => {
        const existing = cart.find(item => item.bookingId === repair.id);
        if (existing) {
            alert('This repair is already in the cart');
            return;
        }
        // Calculate repair price (using average of service price range)
        const repairPrice = repair.costEstimate || 99; // Default price if not set
        const deviceName = getDeviceName(repair.device);
        const customerName = getCustomerName(repair.customer);
        setCart([...cart, {
            bookingId: repair.id,
            name: `${deviceName} - ${repair.issue || repair.notes || 'Repair'}`,
            price: repairPrice,
            quantity: 1,
            total: repairPrice,
            type: 'repair',
            customerName: customerName
        }]);
        // Auto-set customer name if not walk-in
        if (customerName !== 'Unknown Customer' && customerName !== 'Walk-in Customer') {
            setCustomerName(customerName);
        }
    };

    const updateCartQuantity = (index, change) => {
        const item = cart[index];
        if (item.type === 'repair') return; // Can't change repair quantity

        const newQuantity = item.quantity + change;
        if (newQuantity < 1) {
            removeFromCart(index);
            return;
        }

        const product = products.find(p => p.id === item.productId);
        if (product && newQuantity > product.quantity) {
            alert('Not enough stock available');
            return;
        }

        setCart(cart.map((cartItem, i) =>
            i === index
                ? { ...cartItem, quantity: newQuantity, total: newQuantity * cartItem.price }
                : cartItem
        ));
    };

    const removeFromCart = (index) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const clearCart = () => {
        setCart([]);
        setCustomerName('Walk-in Customer');
        setDiscount(0);
    };

    // Calculations
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * TAX_RATE;
    const total = taxableAmount + taxAmount;

    // Checkout
    const handleCheckout = async () => {
        if (cart.length === 0) return;

        setProcessing(true);
        try {
            // Determine sale type
            const hasRepair = cart.some(item => item.type === 'repair');
            const hasProduct = cart.some(item => item.type === 'product');
            const saleType = hasRepair && hasProduct ? 'mixed' : hasRepair ? 'repair-pickup' : 'retail';

            const saleData = {
                items: cart.map(item => ({
                    productId: item.productId || null,
                    bookingId: item.bookingId || null,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total
                })),
                subtotal,
                tax: parseFloat(taxAmount.toFixed(2)),
                discount: parseFloat(discountAmount.toFixed(2)),
                total: parseFloat(total.toFixed(2)),
                paymentMethod,
                employeeId: user.id,
                employeeName: user.name,
                customerId: null,
                customerName,
                type: saleType
            };

            const newSale = await mockApi.addSale(saleData);

            // Mark repairs as picked up
            for (const item of cart) {
                if (item.bookingId) {
                    await mockApi.markRepairPickedUp(item.bookingId);
                }
            }

            setLastSale(newSale);
            setShowCheckout(false);
            setShowReceipt(true);
            clearCart();
            await loadData(); // Refresh data

        } catch (error) {
            console.error('Error processing sale:', error);
            alert('Failed to process sale. Please try again.');
        }
        setProcessing(false);
    };

    const renderSidebar = () => (
        <aside className={`pos-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <button
                className="sidebar-toggle"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            <div className="sidebar-header">
                <div className="logo">
                    <ShoppingCart size={28} />
                    <span>POS</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <button
                    className={`nav-item ${activeView === 'pos' ? 'active' : ''}`}
                    onClick={() => setActiveView('pos')}
                >
                    <ShoppingCart size={20} />
                    <span>Point of Sale</span>
                </button>
                <button
                    className={`nav-item ${activeView === 'repairs' ? 'active' : ''}`}
                    onClick={() => setActiveView('repairs')}
                >
                    <Wrench size={20} />
                    <span>Repair Pickup</span>
                    {repairsReady.length > 0 && (
                        <span className="badge">{repairsReady.length}</span>
                    )}
                </button>
            </nav>


            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">
                        <User size={20} />
                    </div>
                    <div className="user-details">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-role">Cashier</span>
                    </div>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );

    const renderCart = () => (
        <aside className="pos-cart">
            <div className="cart-header">
                <h2>Current Sale</h2>
                {cart.length > 0 && (
                    <button className="clear-cart" onClick={clearCart}>
                        <Trash2 size={16} />
                        Clear
                    </button>
                )}
            </div>

            <div className="customer-input">
                <User size={18} />
                <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer name..."
                />
            </div>

            <div className="cart-items">
                {cart.length === 0 ? (
                    <div className="cart-empty">
                        <ShoppingCart size={48} />
                        <p>Cart is empty</p>
                        <span>Add products or repairs</span>
                    </div>
                ) : (
                    cart.map((item, index) => (
                        <div key={index} className={`cart-item ${item.type}`}>
                            <div className="item-info">
                                <span className="item-name">{item.name}</span>
                                <span className="item-price">${item.price.toFixed(2)}</span>
                            </div>
                            <div className="item-actions">
                                {item.type === 'product' ? (
                                    <div className="quantity-controls">
                                        <button onClick={() => updateCartQuantity(index, -1)}>
                                            <Minus size={14} />
                                        </button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateCartQuantity(index, 1)}>
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <span className="repair-badge">Repair</span>
                                )}
                                <span className="item-total">${item.total.toFixed(2)}</span>
                                <button className="remove-btn" onClick={() => removeFromCart(index)}>
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="cart-summary">
                <div className="summary-row">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row discount-row">
                    <div className="discount-input">
                        <span>Discount</span>
                        <input
                            type="number"
                            value={discount}
                            onChange={(e) => setDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                            min="0"
                            max="100"
                        />
                        <span>%</span>
                    </div>
                    <span>-${discountAmount.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                    <span>Tax (8%)</span>
                    <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                </div>
            </div>

            <button
                className="checkout-btn"
                onClick={() => setShowCheckout(true)}
                disabled={cart.length === 0}
            >
                <CreditCard size={20} />
                Checkout
            </button>
        </aside>
    );

    const renderPOS = () => (
        <div className="pos-content">
            <div className="pos-header">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="category-tabs">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`category-tab ${categoryFilter === cat ? 'active' : ''}`}
                        onClick={() => setCategoryFilter(cat)}
                    >
                        {cat === 'all' ? 'All' : cat.replace('-', ' ')}
                    </button>
                ))}
            </div>

            <div className="products-grid">
                {filteredProducts.map(product => (
                    <button
                        key={product.id}
                        className={`product-card ${product.quantity < 1 ? 'out-of-stock' : ''}`}
                        onClick={() => addToCart(product)}
                        disabled={product.quantity < 1}
                    >
                        <div className="product-icon">
                            <Package size={24} />
                        </div>
                        <h3>{product.name}</h3>
                        <p className="product-price">${product.price.toFixed(2)}</p>
                        <span className={`stock-badge ${product.quantity < 5 ? 'low' : ''}`}>
                            {product.quantity < 1 ? 'Out of stock' : `${product.quantity} in stock`}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderRepairs = () => (
        <div className="pos-content repairs-content">
            <div className="content-header">
                <h1>Repairs Ready for Pickup</h1>
                <button className="refresh-btn" onClick={loadData}>
                    <RefreshCw size={18} />
                    Refresh
                </button>
            </div>

            {repairsReady.length === 0 ? (
                <div className="empty-state">
                    <CheckCircle size={64} />
                    <h2>All Clear!</h2>
                    <p>No repairs awaiting pickup at this time.</p>
                </div>
            ) : (
                <div className="repairs-grid">
                    {repairsReady.map(repair => {
                        const deviceName = getDeviceName(repair.device);
                        const customerName = getCustomerName(repair.customer);
                        return (
                            <div key={repair.id} className="repair-card">
                                <div className="repair-header">
                                    <Wrench size={24} />
                                    <span className="repair-id">#{repair.id}</span>
                                </div>
                                <h3>{deviceName}</h3>
                                <p className="repair-issue">{repair.issue || repair.notes || ''}</p>
                                <div className="repair-customer">
                                    <User size={16} />
                                    <span>{customerName}</span>
                                </div>
                                <div className="repair-details">
                                    <div className="detail">
                                        <Clock size={14} />
                                        <span>Completed: {repair.completedDate || getBookingDate(repair)}</span>
                                    </div>
                                    <div className="detail">
                                        <DollarSign size={14} />
                                        <span>${repair.costEstimate || '99.00'}</span>
                                    </div>
                                </div>
                                <button
                                    className="add-to-cart-btn"
                                    onClick={() => addRepairToCart(repair)}
                                >
                                    <Plus size={18} />
                                    Add to Sale
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderHistory = () => (
        <div className="pos-content history-content">
            <div className="content-header">
                <h1>Sales History</h1>
            </div>

            <div className="sales-list">
                {sales.slice().reverse().map(sale => (
                    <div key={sale.id} className="sale-card">
                        <div className="sale-header">
                            <div className="sale-info">
                                <span className="sale-id">{sale.receiptNumber}</span>
                                <span className="sale-date">{sale.date} at {sale.time}</span>
                            </div>
                            <span className={`sale-type ${sale.type}`}>
                                {sale.type.replace('-', ' ')}
                            </span>
                        </div>
                        <div className="sale-details">
                            <div className="sale-customer">
                                <User size={16} />
                                <span>{sale.customerName}</span>
                            </div>
                            <div className="sale-items-count">
                                {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                            </div>
                            <div className="sale-payment">
                                <CreditCard size={16} />
                                <span>{sale.paymentMethod}</span>
                            </div>
                            <div className="sale-total">
                                ${sale.total.toFixed(2)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStats = () => (
        <div className="pos-content stats-content">
            <div className="content-header">
                <h1>Sales Statistics</h1>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon transactions">
                        <Receipt size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.totalTransactions || 0}</span>
                        <span className="stat-label">Total Transactions</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon revenue">
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">${stats?.totalRevenue?.toFixed(2) || '0.00'}</span>
                        <span className="stat-label">Total Revenue</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon retail">
                        <ShoppingCart size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.retailTransactions || 0}</span>
                        <span className="stat-label">Retail Sales</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon repairs">
                        <Wrench size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.repairPickups || 0}</span>
                        <span className="stat-label">Repair Pickups</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon average">
                        <BarChart3 size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">${stats?.averageTransactionValue?.toFixed(2) || '0.00'}</span>
                        <span className="stat-label">Avg Transaction</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon repair-rev">
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">${stats?.repairRevenue?.toFixed(2) || '0.00'}</span>
                        <span className="stat-label">Repair Revenue</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCheckoutModal = () => (
        <div className="modal-overlay" onClick={() => setShowCheckout(false)}>
            <div className="modal-content checkout-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Complete Sale</h2>
                    <button className="modal-close" onClick={() => setShowCheckout(false)}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="checkout-summary">
                        <h3>Order Summary</h3>
                        <div className="checkout-items">
                            {cart.map((item, index) => (
                                <div key={index} className="checkout-item">
                                    <span>{item.name} x{item.quantity}</span>
                                    <span>${item.total.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="checkout-totals">
                            <div className="total-row">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="total-row discount">
                                    <span>Discount ({discount}%)</span>
                                    <span>-${discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="total-row">
                                <span>Tax</span>
                                <span>${taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="total-row grand-total">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="payment-methods">
                        <h3>Payment Method</h3>
                        <div className="payment-options">
                            {['Credit Card', 'Debit Card', 'Cash', 'Apple Pay', 'Google Pay'].map(method => (
                                <button
                                    key={method}
                                    className={`payment-option ${paymentMethod === method ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod(method)}
                                >
                                    {method === 'Cash' ? <Banknote size={20} /> : <CreditCard size={20} />}
                                    <span>{method}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={() => setShowCheckout(false)}>
                        Cancel
                    </button>
                    <button
                        className="btn-complete"
                        onClick={handleCheckout}
                        disabled={processing}
                    >
                        {processing ? 'Processing...' : `Complete Sale - $${total.toFixed(2)}`}
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );

    const renderReceiptModal = () => (
        <div className="modal-overlay" onClick={() => setShowReceipt(false)}>
            <div className="modal-content receipt-modal" onClick={(e) => e.stopPropagation()}>
                <div className="receipt">
                    <div className="receipt-header">
                        <CheckCircle size={48} className="success-icon" />
                        <h2>Sale Complete!</h2>
                        <p className="receipt-number">{lastSale?.receiptNumber}</p>
                    </div>

                    <div className="receipt-body">
                        <div className="receipt-info">
                            <span>{lastSale?.date}</span>
                            <span>{lastSale?.time}</span>
                        </div>
                        <div className="receipt-customer">
                            <User size={16} />
                            <span>{lastSale?.customerName}</span>
                        </div>

                        <div className="receipt-items">
                            {lastSale?.items.map((item, index) => (
                                <div key={index} className="receipt-item">
                                    <span>{item.name} x{item.quantity}</span>
                                    <span>${item.total.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="receipt-totals">
                            <div className="receipt-row">
                                <span>Subtotal</span>
                                <span>${lastSale?.subtotal.toFixed(2)}</span>
                            </div>
                            {lastSale?.discount > 0 && (
                                <div className="receipt-row">
                                    <span>Discount</span>
                                    <span>-${lastSale?.discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="receipt-row">
                                <span>Tax</span>
                                <span>${lastSale?.tax.toFixed(2)}</span>
                            </div>
                            <div className="receipt-row total">
                                <span>Total</span>
                                <span>${lastSale?.total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="receipt-payment">
                            Paid with {lastSale?.paymentMethod}
                        </div>
                    </div>

                    <div className="receipt-footer">
                        <p>Thank you for choosing SIFIXA!</p>
                    </div>
                </div>

                <div className="receipt-actions">
                    <button className="btn-print">
                        <Printer size={18} />
                        Print Receipt
                    </button>
                    <button className="btn-done" onClick={() => setShowReceipt(false)}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="pos-loading">
                <div className="loader"></div>
                <p>Loading POS System...</p>
            </div>
        );
    }

    return (
        <div className="pos-dashboard">
            {renderSidebar()}
            <main className={`pos-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                {activeView === 'pos' && renderPOS()}
                {activeView === 'repairs' && renderRepairs()}
            </main>
            {(activeView === 'pos' || activeView === 'repairs') && renderCart()}
            {showCheckout && renderCheckoutModal()}
            {showReceipt && renderReceiptModal()}
        </div>
    );
};

export default POSDashboard;
