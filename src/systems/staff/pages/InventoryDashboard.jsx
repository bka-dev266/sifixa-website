import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
import { NotificationBell } from '../../../components/Notifications';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '../../../services/mockApi'; // Keep for legacy operations
import {
    Package, Plus, Search, AlertTriangle, TrendingUp, TrendingDown,
    Truck, ClipboardList, BarChart3, Edit2, Trash2, Save, X,
    ChevronDown, ChevronLeft, ChevronRight, RefreshCw, User, LogOut, LayoutDashboard,
    CheckCircle, Clock, Archive, Filter, Download, Timer
} from 'lucide-react';
import './InventoryDashboard.css';

const InventoryDashboard = () => {
    const { user, logout } = useAuth();
    useNotifications(); // Initialize notifications
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [inventory, setInventory] = useState([]);
    const [products, setProducts] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [lowStockAlerts, setLowStockAlerts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({});

    // PO modal state - reserved for future use
    const [, setShowPOModal] = useState(false);
    const [, setPOForm] = useState({
        supplier: '',
        items: [],
        notes: ''
    });

    const loadData = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const [inventoryData, productsData, posData, analyticsData, alertsData] = await Promise.all([
                mockApi.getInventory(),
                mockApi.getStoreProducts(),
                mockApi.getPurchaseOrders(),
                mockApi.getInventoryAnalytics(),
                mockApi.getReorderAlerts()
            ]);
            setInventory(inventoryData);
            setProducts(productsData);
            setPurchaseOrders(posData);
            setAnalytics(analyticsData);
            setLowStockAlerts(alertsData);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error loading data:', error);
        }
        if (showLoading) setLoading(false);
    };

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



    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // eslint-disable-next-line no-unused-vars
    const categories = [...new Set([
        ...inventory.map(i => i.category),
        ...products.map(p => p.category)
    ])];

    const filteredInventory = inventory
        .filter(item => categoryFilter === 'all' || item.category === categoryFilter)
        .filter(item =>
            searchTerm === '' ||
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const filteredProducts = products
        .filter(item => categoryFilter === 'all' || item.category === categoryFilter)
        .filter(item =>
            searchTerm === '' ||
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const getStockStatus = (item) => {
        if (item.quantity === 0) return 'out-of-stock';
        if (item.quantity <= item.minStock) return 'low-stock';
        if (item.quantity <= item.minStock * 2) return 'adequate';
        return 'good';
    };

    const openEditModal = (item, type) => {
        setEditingItem({ ...item, type });
        setEditForm({
            name: item.name,
            quantity: item.quantity,
            minStock: item.minStock,
            cost: item.cost,
            price: item.price || 0,
            supplier: item.supplier || ''
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        try {
            if (editingItem.type === 'inventory') {
                await mockApi.updateInventoryItem(editingItem.id, editForm);
            } else {
                await mockApi.updateStoreProduct(editingItem.id, editForm);
            }
            await loadData();
            setShowEditModal(false);
            setEditingItem(null);
        } catch (error) {
            console.error('Error updating item:', error);
            alert('Failed to update item');
        }
    };

    const handleQuickStockUpdate = async (item, change, type) => {
        try {
            if (type === 'inventory') {
                await mockApi.updateInventoryItem(item.id, {
                    quantity: Math.max(0, item.quantity + change)
                });
            } else {
                await mockApi.updateProductStock(item.id, change);
            }
            await loadData();
        } catch (error) {
            console.error('Error updating stock:', error);
        }
    };

    const handleReceivePO = async (orderId) => {
        try {
            const order = purchaseOrders.find(po => po.id === orderId);
            if (order) {
                // Update inventory quantities
                for (const item of order.items) {
                    const invItem = inventory.find(i => i.id === item.itemId);
                    if (invItem) {
                        await mockApi.updateInventoryItem(invItem.id, {
                            quantity: invItem.quantity + item.quantity,
                            lastRestocked: new Date().toISOString().split('T')[0]
                        });
                    }
                }
                // Mark PO as received
                await mockApi.updatePurchaseOrder(orderId, {
                    status: 'Received',
                    receivedDate: new Date().toISOString().split('T')[0]
                });
                await loadData();
                alert('Purchase order received successfully!');
            }
        } catch (error) {
            console.error('Error receiving PO:', error);
            alert('Failed to receive purchase order');
        }
    };

    const renderSidebar = () => (
        <aside className={`inventory-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <button
                className="sidebar-toggle"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            <div className="sidebar-header">
                <div className="logo">
                    <Package size={28} />
                    <span>Inventory</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <button
                    className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </button>
                <button
                    className={`nav-item ${activeTab === 'parts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('parts')}
                >
                    <Archive size={20} />
                    <span>Repair Parts</span>
                </button>
                <button
                    className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
                    onClick={() => setActiveTab('products')}
                >
                    <Package size={20} />
                    <span>Store Products</span>
                </button>
                <button
                    className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    <Truck size={20} />
                    <span>Purchase Orders</span>
                </button>
                <button
                    className={`nav-item ${activeTab === 'alerts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('alerts')}
                >
                    <AlertTriangle size={20} />
                    <span>Low Stock</span>
                    {lowStockAlerts.length > 0 && (
                        <span className="alert-badge">{lowStockAlerts.length}</span>
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
                        <span className="user-role">Data Entry</span>
                    </div>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );

    const renderDashboard = () => (
        <div className="inventory-dashboard-content">
            <div className="dashboard-header">
                <h1>Inventory Dashboard</h1>
                <div className="header-actions">
                    <div className="refresh-controls">
                        <button className="refresh-btn" onClick={() => loadData(false)} title="Refresh now">
                            <RefreshCw size={18} />
                        </button>
                        <button
                            className={`auto-refresh-btn ${autoRefresh ? 'active' : ''}`}
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
                        >
                            <Timer size={18} />
                        </button>
                        <span className="last-update">
                            Updated: {lastUpdate.toLocaleTimeString()}
                        </span>
                    </div>
                    <NotificationBell />
                </div>
            </div>


            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon total">
                        <Package size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{analytics?.totalItems || 0}</span>
                        <span className="stat-label">Total Items</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon value">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">${analytics?.totalValue?.toLocaleString() || 0}</span>
                        <span className="stat-label">Inventory Value</span>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon low">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{analytics?.stockLevels?.low || 0}</span>
                        <span className="stat-label">Low Stock</span>
                    </div>
                </div>
                <div className="stat-card danger">
                    <div className="stat-icon critical">
                        <TrendingDown size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{analytics?.stockLevels?.critical || 0}</span>
                        <span className="stat-label">Out of Stock</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon pending">
                        <Truck size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{analytics?.pendingOrders || 0}</span>
                        <span className="stat-label">Pending Orders</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon spent">
                        <ClipboardList size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">${analytics?.totalSpent?.toLocaleString() || 0}</span>
                        <span className="stat-label">Total Spent</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-sections">
                <section className="dashboard-section">
                    <h2>Stock by Category</h2>
                    <div className="category-list">
                        {analytics?.valueByCategory?.map(cat => (
                            <div key={cat.name} className="category-item">
                                <div className="category-info">
                                    <span className="category-name">{cat.name}</span>
                                    <span className="category-count">{cat.count} items</span>
                                </div>
                                <span className="category-value">${cat.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="dashboard-section">
                    <h2>Top Moving Items</h2>
                    <div className="moving-list">
                        {analytics?.topMoving?.map((item, idx) => (
                            <div key={item.name} className="moving-item">
                                <span className="moving-rank">#{idx + 1}</span>
                                <span className="moving-name">{item.name}</span>
                                <span className="moving-usage">{item.avgUsage.toFixed(1)}/month</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="dashboard-section full-width">
                    <h2>Reorder Alerts</h2>
                    {lowStockAlerts.length === 0 ? (
                        <p className="no-alerts">All stock levels are adequate! ✓</p>
                    ) : (
                        <div className="alerts-list">
                            {lowStockAlerts.slice(0, 5).map(alert => (
                                <div key={alert.id} className={`alert-item ${alert.urgency}`}>
                                    <div className="alert-icon">
                                        <AlertTriangle size={20} />
                                    </div>
                                    <div className="alert-info">
                                        <span className="alert-name">{alert.name}</span>
                                        <span className="alert-stock">
                                            {alert.quantity} in stock (min: {alert.minStock})
                                        </span>
                                    </div>
                                    <span className={`urgency-badge ${alert.urgency}`}>
                                        {alert.urgency}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );

    const renderInventoryTable = (items, type) => (
        <div className="inventory-table-container">
            <table className="inventory-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>SKU</th>
                        <th>Category</th>
                        <th>Stock</th>
                        <th>Min</th>
                        <th>Cost</th>
                        {type === 'product' && <th>Price</th>}
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id} className={getStockStatus(item)}>
                            <td className="item-name">{item.name}</td>
                            <td className="item-sku">{item.sku}</td>
                            <td className="item-category">{item.category}</td>
                            <td className="item-stock">
                                <div className="stock-controls">
                                    <button
                                        className="stock-btn minus"
                                        onClick={() => handleQuickStockUpdate(item, -1, type === 'product' ? 'product' : 'inventory')}
                                    >
                                        -
                                    </button>
                                    <span>{item.quantity}</span>
                                    <button
                                        className="stock-btn plus"
                                        onClick={() => handleQuickStockUpdate(item, 1, type === 'product' ? 'product' : 'inventory')}
                                    >
                                        +
                                    </button>
                                </div>
                            </td>
                            <td>{item.minStock}</td>
                            <td>${item.cost}</td>
                            {type === 'product' && <td>${item.price}</td>}
                            <td>
                                <span className={`status-badge ${getStockStatus(item)}`}>
                                    {getStockStatus(item).replace('-', ' ')}
                                </span>
                            </td>
                            <td className="actions">
                                <button
                                    className="action-btn edit"
                                    onClick={() => openEditModal(item, type === 'product' ? 'product' : 'inventory')}
                                >
                                    <Edit2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderParts = () => (
        <div className="inventory-content">
            <div className="content-header">
                <h1>Repair Parts Inventory</h1>
                <div className="header-actions">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search parts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="filter-select"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        {[...new Set(inventory.map(i => i.category))].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>
            {renderInventoryTable(filteredInventory, 'inventory')}
        </div>
    );

    const renderProducts = () => (
        <div className="inventory-content">
            <div className="content-header">
                <h1>Store Products</h1>
                <div className="header-actions">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="filter-select"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        {[...new Set(products.map(p => p.category))].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>
            {renderInventoryTable(filteredProducts, 'product')}
        </div>
    );

    const renderOrders = () => (
        <div className="inventory-content">
            <div className="content-header">
                <h1>Purchase Orders</h1>
            </div>

            <div className="orders-list">
                {purchaseOrders.map(order => (
                    <div key={order.id} className="order-card">
                        <div className="order-header">
                            <div className="order-id">
                                <ClipboardList size={20} />
                                <span>{order.id}</span>
                            </div>
                            <span className={`status-badge ${order.status.toLowerCase().replace(' ', '-')}`}>
                                {order.status}
                            </span>
                        </div>

                        <div className="order-details">
                            <div className="detail">
                                <span className="label">Supplier:</span>
                                <span className="value">{order.supplier}</span>
                            </div>
                            <div className="detail">
                                <span className="label">Date:</span>
                                <span className="value">{order.date}</span>
                            </div>
                            <div className="detail">
                                <span className="label">Total:</span>
                                <span className="value">${order.total}</span>
                            </div>
                        </div>

                        <div className="order-items">
                            <h4>Items:</h4>
                            {order.items.map((item, idx) => (
                                <div key={idx} className="order-item">
                                    <span>{item.name}</span>
                                    <span>x{item.quantity}</span>
                                    <span>${item.cost * item.quantity}</span>
                                </div>
                            ))}
                        </div>

                        {order.status === 'Submitted' && (
                            <div className="order-actions">
                                <button
                                    className="btn-receive"
                                    onClick={() => handleReceivePO(order.id)}
                                >
                                    <CheckCircle size={16} />
                                    Mark as Received
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAlerts = () => (
        <div className="inventory-content">
            <div className="content-header">
                <h1>Low Stock Alerts</h1>
            </div>

            {lowStockAlerts.length === 0 ? (
                <div className="empty-state">
                    <CheckCircle size={64} />
                    <h2>All Good!</h2>
                    <p>All inventory levels are adequate.</p>
                </div>
            ) : (
                <div className="alerts-grid">
                    {lowStockAlerts.map(alert => (
                        <div key={alert.id} className={`alert-card ${alert.urgency}`}>
                            <div className="alert-header">
                                <AlertTriangle size={24} />
                                <span className={`urgency-tag ${alert.urgency}`}>
                                    {alert.urgency}
                                </span>
                            </div>
                            <h3>{alert.name}</h3>
                            <div className="alert-stats">
                                <div className="stat">
                                    <span className="stat-value">{alert.quantity}</span>
                                    <span className="stat-label">In Stock</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">{alert.minStock}</span>
                                    <span className="stat-label">Minimum</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">{alert.shortfall}</span>
                                    <span className="stat-label">Suggested Order</span>
                                </div>
                            </div>
                            <div className="alert-meta">
                                <span>SKU: {alert.sku}</span>
                                <span>Supplier: {alert.supplier}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderEditModal = () => (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Edit {editingItem?.name}</h2>
                    <button className="modal-close" onClick={() => setShowEditModal(false)}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Quantity</label>
                            <input
                                type="number"
                                value={editForm.quantity}
                                onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Min Stock</label>
                            <input
                                type="number"
                                value={editForm.minStock}
                                onChange={(e) => setEditForm({ ...editForm, minStock: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Cost ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={editForm.cost}
                                onChange={(e) => setEditForm({ ...editForm, cost: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        {editingItem?.type === 'product' && (
                            <div className="form-group">
                                <label>Price ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editForm.price}
                                    onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        )}
                    </div>
                    <div className="form-group">
                        <label>Supplier</label>
                        <input
                            type="text"
                            value={editForm.supplier}
                            onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={() => setShowEditModal(false)}>
                        Cancel
                    </button>
                    <button className="btn-save" onClick={handleSaveEdit}>
                        <Save size={16} />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="inventory-loading">
                <div className="loader"></div>
                <p>Loading Inventory Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="inventory-dashboard">
            {renderSidebar()}
            <main className={`inventory-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'parts' && renderParts()}
                {activeTab === 'products' && renderProducts()}
                {activeTab === 'orders' && renderOrders()}
                {activeTab === 'alerts' && renderAlerts()}
            </main>
            {showEditModal && renderEditModal()}
        </div>
    );
};

export default InventoryDashboard;
