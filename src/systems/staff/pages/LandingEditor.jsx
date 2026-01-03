import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { landingService, clearLandingCache } from '../../../services/landingService';
import {
    Save, Plus, Trash2, Edit2, X, ChevronDown, ChevronUp,
    ArrowLeft, Image, Type, FileText, Star, MessageSquare, HelpCircle,
    Layout, Smartphone, Laptop, Tablet, Settings, Megaphone, Layers,
    DollarSign, ImageIcon, Scale
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './LandingEditor.css';

const LandingEditor = () => {
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState('hero');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Data state
    const [hero, setHero] = useState(null);
    const [services, setServices] = useState([]);
    const [testimonials, setTestimonials] = useState([]);
    const [faq, setFaq] = useState([]);
    const [sections, setSections] = useState({});
    const [settings, setSettings] = useState({});
    const [pricing, setPricing] = useState([]);
    const [gallery, setGallery] = useState([]);
    const [legalPages, setLegalPages] = useState([]);

    // Edit state
    const [editingItem, setEditingItem] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [landingData, settingsData, pricingData, galleryData, legalData] = await Promise.all([
                landingService.getLanding(),
                landingService.getSettings(),
                landingService.getPricingAdmin(),
                landingService.getGalleryAdmin(),
                landingService.getLegalPages()
            ]);
            setHero(landingData.hero);
            setServices(landingData.services);
            setTestimonials(landingData.testimonials);
            setFaq(landingData.faq);
            setSections(landingData.sections);
            setSettings(settingsData);
            setPricing(pricingData);
            setGallery(galleryData);
            setLegalPages(legalData);
        } catch (error) {
            console.error('Failed to load landing data:', error);
            setMessage({ type: 'error', text: 'Failed to load data' });
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        // Clear landing cache on successful saves so changes appear immediately
        if (type === 'success') {
            clearLandingCache();
        }
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    // ========== HERO HANDLERS ==========
    const handleSaveHero = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await landingService.updateHero(hero);
            showMessage('success', 'Hero updated successfully!');
        } catch (error) {
            showMessage('error', 'Failed to update hero');
        }
        setSaving(false);
    };

    // ========== SERVICES HANDLERS ==========
    const handleSaveService = async (serviceData) => {
        setSaving(true);
        try {
            if (editingItem?.id) {
                await landingService.updateService(editingItem.id, serviceData);
            } else {
                await landingService.createService(serviceData);
            }
            await loadData();
            setShowModal(false);
            setEditingItem(null);
            showMessage('success', 'Service saved!');
        } catch (error) {
            showMessage('error', 'Failed to save service');
        }
        setSaving(false);
    };

    const handleDeleteService = async (id) => {
        if (!window.confirm('Delete this service?')) return;
        try {
            await landingService.deleteService(id);
            await loadData();
            showMessage('success', 'Service deleted');
        } catch (error) {
            showMessage('error', 'Failed to delete');
        }
    };

    // ========== TESTIMONIALS HANDLERS ==========
    const handleSaveTestimonial = async (data) => {
        setSaving(true);
        try {
            if (editingItem?.id) {
                await landingService.updateTestimonial(editingItem.id, data);
            } else {
                await landingService.createTestimonial(data);
            }
            await loadData();
            setShowModal(false);
            setEditingItem(null);
            showMessage('success', 'Testimonial saved!');
        } catch (error) {
            showMessage('error', 'Failed to save testimonial');
        }
        setSaving(false);
    };

    const handleDeleteTestimonial = async (id) => {
        if (!window.confirm('Delete this testimonial?')) return;
        try {
            await landingService.deleteTestimonial(id);
            await loadData();
            showMessage('success', 'Testimonial deleted');
        } catch (error) {
            showMessage('error', 'Failed to delete');
        }
    };

    // ========== FAQ HANDLERS ==========
    const handleSaveFaq = async (data) => {
        setSaving(true);
        try {
            if (editingItem?.id) {
                await landingService.updateFaq(editingItem.id, data);
            } else {
                await landingService.createFaq(data);
            }
            await loadData();
            setShowModal(false);
            setEditingItem(null);
            showMessage('success', 'FAQ saved!');
        } catch (error) {
            showMessage('error', 'Failed to save FAQ');
        }
        setSaving(false);
    };

    const handleDeleteFaq = async (id) => {
        if (!window.confirm('Delete this FAQ?')) return;
        try {
            await landingService.deleteFaq(id);
            await loadData();
            showMessage('success', 'FAQ deleted');
        } catch (error) {
            showMessage('error', 'Failed to delete');
        }
    };

    // ========== SECTIONS HANDLERS ==========
    const handleSaveSection = async (sectionKey) => {
        setSaving(true);
        try {
            const sectionData = sections[sectionKey];
            await landingService.updateSection(sectionKey, {
                title: sectionData?.title,
                subtitle: sectionData?.subtitle,
                content: sectionData?.content
            });
            showMessage('success', 'Section updated!');
        } catch (error) {
            showMessage('error', 'Failed to update section');
        }
        setSaving(false);
    };

    const updateSectionField = (sectionKey, field, value) => {
        setSections(prev => ({
            ...prev,
            [sectionKey]: {
                ...prev[sectionKey],
                [field]: value
            }
        }));
    };

    // ========== SETTINGS HANDLERS ==========
    const handleSaveSetting = async (key) => {
        setSaving(true);
        try {
            await landingService.updateSetting(key, settings[key]);
            showMessage('success', 'Settings saved!');
        } catch (error) {
            showMessage('error', 'Failed to save settings');
        }
        setSaving(false);
    };

    const updateSettingField = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    // ========== GALLERY HANDLERS ==========
    const handleSaveGallery = async (data) => {
        setSaving(true);
        try {
            if (editingItem?.id) {
                await landingService.updateGalleryItem(editingItem.id, data);
            } else {
                await landingService.createGalleryItem(data);
            }
            await loadData();
            setShowModal(false);
            setEditingItem(null);
            showMessage('success', 'Gallery item saved!');
        } catch (error) {
            showMessage('error', 'Failed to save gallery');
        }
        setSaving(false);
    };

    const handleDeleteGallery = async (id) => {
        if (!window.confirm('Delete this gallery item?')) return;
        try {
            await landingService.deleteGalleryItem(id);
            await loadData();
            showMessage('success', 'Gallery item deleted');
        } catch (error) {
            showMessage('error', 'Failed to delete');
        }
    };

    // ========== LEGAL HANDLERS ==========
    const handleSaveLegal = async (pageKey, updates) => {
        setSaving(true);
        try {
            await landingService.updateLegalPage(pageKey, updates);
            await loadData();
            showMessage('success', 'Legal page saved!');
        } catch (error) {
            showMessage('error', 'Failed to save legal page');
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="landing-editor">
                <div className="loading-state">Loading landing page content...</div>
            </div>
        );
    }

    const sidebarItems = [
        { id: 'hero', label: 'Hero Section', icon: Layout },
        { id: 'services', label: 'Services', icon: Smartphone },
        { id: 'how_it_works', label: 'How It Works', icon: Layers },
        { id: 'why_choose_us', label: 'Why Choose Us', icon: Star },
        { id: 'cta', label: 'CTA Sections', icon: Megaphone },
        { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
        { id: 'faq', label: 'FAQ', icon: HelpCircle },
        { id: 'pricing', label: 'Pricing', icon: DollarSign },
        { id: 'gallery', label: 'Gallery', icon: ImageIcon },
        { id: 'settings', label: 'Site Settings', icon: Settings },
        { id: 'legal', label: 'Legal Pages', icon: Scale },
    ];

    return (
        <div className="landing-editor">
            {/* Header */}
            <header className="editor-header">
                <div className="header-left">
                    <Link to="/admin" className="back-link">
                        <ArrowLeft size={20} /> Back to Admin
                    </Link>
                    <h1>Landing Page CMS</h1>
                </div>
                <div className="header-right">
                    <a href="/" target="_blank" rel="noopener noreferrer" className="preview-btn">
                        Preview Site
                    </a>
                </div>
            </header>

            {/* Message Toast */}
            {message.text && (
                <div className={`toast-message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="editor-layout">
                {/* Sidebar */}
                <aside className="editor-sidebar">
                    <nav className="sidebar-nav">
                        {sidebarItems.map(item => (
                            <button
                                key={item.id}
                                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                                onClick={() => setActiveSection(item.id)}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Content */}
                <main className="editor-content">
                    {/* Hero Section */}
                    {activeSection === 'hero' && hero && (
                        <section className="content-section">
                            <h2><Layout size={24} /> Hero Section</h2>
                            <form onSubmit={handleSaveHero} className="edit-form">
                                <div className="form-group">
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        value={hero.title || ''}
                                        onChange={(e) => setHero({ ...hero, title: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Subtitle</label>
                                    <textarea
                                        value={hero.subtitle || ''}
                                        onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Primary CTA Text</label>
                                        <input
                                            type="text"
                                            value={hero.cta_text || ''}
                                            onChange={(e) => setHero({ ...hero, cta_text: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Primary CTA Link</label>
                                        <input
                                            type="text"
                                            value={hero.cta_link || ''}
                                            onChange={(e) => setHero({ ...hero, cta_link: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Secondary CTA Text</label>
                                        <input
                                            type="text"
                                            value={hero.secondary_cta_text || ''}
                                            onChange={(e) => setHero({ ...hero, secondary_cta_text: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Secondary CTA Link</label>
                                        <input
                                            type="text"
                                            value={hero.secondary_cta_link || ''}
                                            onChange={(e) => setHero({ ...hero, secondary_cta_link: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="save-btn" disabled={saving}>
                                    <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </section>
                    )}

                    {/* Services Section */}
                    {activeSection === 'services' && (
                        <section className="content-section">
                            <div className="section-header-row">
                                <h2><Smartphone size={24} /> Services</h2>
                                <button
                                    className="add-btn"
                                    onClick={() => {
                                        setEditingItem({ title: '', description: '', icon: 'Smartphone', image: '', display_order: services.length + 1 });
                                        setShowModal(true);
                                    }}
                                >
                                    <Plus size={18} /> Add Service
                                </button>
                            </div>
                            <div className="items-list">
                                {services.map((service, index) => (
                                    <div key={service.id} className="list-item">
                                        <div className="item-info">
                                            <strong>{service.title}</strong>
                                            <span>{service.description}</span>
                                        </div>
                                        <div className="item-actions">
                                            <button onClick={() => { setEditingItem(service); setShowModal(true); }}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteService(service.id)} className="delete-btn">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Testimonials Section */}
                    {activeSection === 'testimonials' && (
                        <section className="content-section">
                            <div className="section-header-row">
                                <h2><Star size={24} /> Testimonials</h2>
                                <button
                                    className="add-btn"
                                    onClick={() => {
                                        setEditingItem({ customer_name: '', customer_title: '', content: '', rating: 5, device_repaired: '', display_order: testimonials.length + 1 });
                                        setShowModal(true);
                                    }}
                                >
                                    <Plus size={18} /> Add Testimonial
                                </button>
                            </div>
                            <div className="items-list">
                                {testimonials.map((t) => (
                                    <div key={t.id} className="list-item">
                                        <div className="item-info">
                                            <strong>{t.customer_name}</strong>
                                            <span>"{t.content?.substring(0, 60)}..."</span>
                                        </div>
                                        <div className="item-actions">
                                            <button onClick={() => { setEditingItem(t); setShowModal(true); }}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteTestimonial(t.id)} className="delete-btn">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* FAQ Section */}
                    {activeSection === 'faq' && (
                        <section className="content-section">
                            <div className="section-header-row">
                                <h2><HelpCircle size={24} /> FAQ</h2>
                                <button
                                    className="add-btn"
                                    onClick={() => {
                                        setEditingItem({ question: '', answer: '', category: 'General', display_order: faq.length + 1 });
                                        setShowModal(true);
                                    }}
                                >
                                    <Plus size={18} /> Add FAQ
                                </button>
                            </div>
                            <div className="items-list">
                                {faq.map((item) => (
                                    <div key={item.id} className="list-item">
                                        <div className="item-info">
                                            <strong>{item.question}</strong>
                                            <span>{item.answer?.substring(0, 80)}...</span>
                                        </div>
                                        <div className="item-actions">
                                            <button onClick={() => { setEditingItem(item); setShowModal(true); }}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteFaq(item.id)} className="delete-btn">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* How It Works Section */}
                    {activeSection === 'how_it_works' && (
                        <section className="content-section">
                            <h2><Layers size={24} /> How It Works</h2>
                            <form onSubmit={(e) => { e.preventDefault(); handleSaveSection('how_it_works'); }} className="edit-form">
                                <div className="form-group">
                                    <label>Section Title</label>
                                    <input
                                        type="text"
                                        value={sections.how_it_works?.title || ''}
                                        onChange={(e) => updateSectionField('how_it_works', 'title', e.target.value)}
                                        placeholder="How It Works"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Section Subtitle</label>
                                    <textarea
                                        value={sections.how_it_works?.subtitle || ''}
                                        onChange={(e) => updateSectionField('how_it_works', 'subtitle', e.target.value)}
                                        rows={2}
                                        placeholder="Choose the service option that works best for you"
                                    />
                                </div>
                                <p className="form-note">Note: The 3 service options (We Come To You, Visit Our Shop, Pickup & Delivery) are built into the component for the carousel experience.</p>
                                <button type="submit" className="save-btn" disabled={saving}>
                                    <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </section>
                    )}

                    {/* Why Choose Us Section */}
                    {activeSection === 'why_choose_us' && (
                        <section className="content-section">
                            <h2><Star size={24} /> Why Choose Us</h2>
                            <form onSubmit={(e) => { e.preventDefault(); handleSaveSection('why_choose_us'); }} className="edit-form">
                                <div className="form-group">
                                    <label>Section Title</label>
                                    <input
                                        type="text"
                                        value={sections.why_choose_us?.title || ''}
                                        onChange={(e) => updateSectionField('why_choose_us', 'title', e.target.value)}
                                        placeholder="Why Choose SIFIXA?"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Section Subtitle</label>
                                    <textarea
                                        value={sections.why_choose_us?.subtitle || ''}
                                        onChange={(e) => updateSectionField('why_choose_us', 'subtitle', e.target.value)}
                                        rows={2}
                                        placeholder="We are committed to providing the best repair experience"
                                    />
                                </div>
                                <p className="form-note">Note: Feature cards (Fast Turnaround, Warranty, etc.) are currently built into the component.</p>
                                <button type="submit" className="save-btn" disabled={saving}>
                                    <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </section>
                    )}

                    {/* CTA Sections */}
                    {activeSection === 'cta' && (
                        <section className="content-section">
                            <h2><Megaphone size={24} /> CTA Sections</h2>

                            {/* Main CTA */}
                            <div className="edit-form" style={{ marginBottom: '2rem' }}>
                                <h3 style={{ marginBottom: '1rem' }}>Main CTA (Book Repair)</h3>
                                <div className="form-group">
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        value={sections.cta?.title || ''}
                                        onChange={(e) => updateSectionField('cta', 'title', e.target.value)}
                                        placeholder="Ready to Get Your Device Fixed?"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Subtitle</label>
                                    <textarea
                                        value={sections.cta?.subtitle || ''}
                                        onChange={(e) => updateSectionField('cta', 'subtitle', e.target.value)}
                                        rows={2}
                                        placeholder="Book a repair now and get your device back in perfect condition."
                                    />
                                </div>
                                <button type="button" className="save-btn" disabled={saving} onClick={() => handleSaveSection('cta')}>
                                    <Save size={18} /> {saving ? 'Saving...' : 'Save Main CTA'}
                                </button>
                            </div>

                            {/* Sell CTA */}
                            <div className="edit-form">
                                <h3 style={{ marginBottom: '1rem' }}>Sell Device CTA</h3>
                                <div className="form-group">
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        value={sections.sell_cta?.title || ''}
                                        onChange={(e) => updateSectionField('sell_cta', 'title', e.target.value)}
                                        placeholder="Sell Your Old Device"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={sections.sell_cta?.subtitle || ''}
                                        onChange={(e) => updateSectionField('sell_cta', 'subtitle', e.target.value)}
                                        rows={2}
                                        placeholder="Got an old phone, tablet, or laptop? Get instant cash!"
                                    />
                                </div>
                                <button type="button" className="save-btn" disabled={saving} onClick={() => handleSaveSection('sell_cta')}>
                                    <Save size={18} /> {saving ? 'Saving...' : 'Save Sell CTA'}
                                </button>
                            </div>
                        </section>
                    )}

                    {/* Pricing Section */}
                    {activeSection === 'pricing' && (
                        <section className="content-section">
                            <h2><DollarSign size={24} /> Pricing</h2>
                            <p className="form-note">Manage pricing categories and their items. Changes are saved when you edit individual items.</p>

                            {pricing.map((category) => (
                                <div key={category.id} className="edit-form" style={{ marginBottom: '2rem' }}>
                                    <h3>{category.category}</h3>
                                    <table className="item-table">
                                        <thead>
                                            <tr>
                                                <th>Service Name</th>
                                                <th>Price</th>
                                                <th>Active</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(category.items || []).map((item) => (
                                                <tr key={item.id}>
                                                    <td>{item.name}</td>
                                                    <td>{item.price}</td>
                                                    <td>✓</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </section>
                    )}

                    {/* Gallery Section */}
                    {activeSection === 'gallery' && (
                        <section className="content-section">
                            <div className="section-header-actions">
                                <h2><ImageIcon size={24} /> Before/After Gallery</h2>
                                <button onClick={() => { setEditingItem({ type: 'gallery' }); setShowModal(true); }} className="add-btn">
                                    <Plus size={18} /> Add Gallery Item
                                </button>
                            </div>

                            <div className="items-grid">
                                {gallery.map((item) => (
                                    <div key={item.id} className="item-card">
                                        <div className="item-content">
                                            <h3>{item.title}</h3>
                                            <p>{item.description}</p>
                                            <div className="gallery-preview">
                                                <span>Before: {item.before_image || 'Not set'}</span>
                                                <span>After: {item.after_image || 'Not set'}</span>
                                            </div>
                                        </div>
                                        <div className="item-actions">
                                            <button onClick={() => { setEditingItem({ ...item, type: 'gallery' }); setShowModal(true); }}><Edit2 size={14} /></button>
                                            <button onClick={() => handleDeleteGallery(item.id)} className="delete-btn"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Settings Section */}
                    {activeSection === 'settings' && (
                        <section className="content-section">
                            <h2><Settings size={24} /> Site Settings</h2>

                            {/* Brand Settings */}
                            <div className="edit-form" style={{ marginBottom: '2rem' }}>
                                <h3>Brand</h3>
                                <div className="form-group">
                                    <label>Company Name</label>
                                    <input
                                        type="text"
                                        value={settings.brand?.name || ''}
                                        onChange={(e) => updateSettingField('brand', { ...settings.brand, name: e.target.value })}
                                        placeholder="SIFIXA"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tagline</label>
                                    <input
                                        type="text"
                                        value={settings.brand?.tagline || ''}
                                        onChange={(e) => updateSettingField('brand', { ...settings.brand, tagline: e.target.value })}
                                        placeholder="Premium Device Repair"
                                    />
                                </div>
                                <button type="button" className="save-btn" disabled={saving} onClick={() => handleSaveSetting('brand')}>
                                    <Save size={18} /> {saving ? 'Saving...' : 'Save Brand'}
                                </button>
                            </div>

                            {/* Contact Settings */}
                            <div className="edit-form" style={{ marginBottom: '2rem' }}>
                                <h3>Contact Info</h3>
                                <div className="form-group">
                                    <label>Address</label>
                                    <input
                                        type="text"
                                        value={settings.contact?.address || ''}
                                        onChange={(e) => updateSettingField('contact', { ...settings.contact, address: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input
                                        type="text"
                                        value={settings.contact?.phone || ''}
                                        onChange={(e) => updateSettingField('contact', { ...settings.contact, phone: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Support Email</label>
                                    <input
                                        type="email"
                                        value={settings.contact?.supportEmail || ''}
                                        onChange={(e) => updateSettingField('contact', { ...settings.contact, supportEmail: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Business Hours</label>
                                    <input
                                        type="text"
                                        value={settings.contact?.hours || ''}
                                        onChange={(e) => updateSettingField('contact', { ...settings.contact, hours: e.target.value })}
                                    />
                                </div>
                                <button type="button" className="save-btn" disabled={saving} onClick={() => handleSaveSetting('contact')}>
                                    <Save size={18} /> {saving ? 'Saving...' : 'Save Contact'}
                                </button>
                            </div>

                            {/* Social Links */}
                            <div className="edit-form">
                                <h3>Social Links</h3>
                                <div className="form-group">
                                    <label>Facebook URL</label>
                                    <input
                                        type="url"
                                        value={settings.social_links?.facebook || ''}
                                        onChange={(e) => updateSettingField('social_links', { ...settings.social_links, facebook: e.target.value })}
                                        placeholder="https://facebook.com/yourpage"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Instagram URL</label>
                                    <input
                                        type="url"
                                        value={settings.social_links?.instagram || ''}
                                        onChange={(e) => updateSettingField('social_links', { ...settings.social_links, instagram: e.target.value })}
                                        placeholder="https://instagram.com/yourpage"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Twitter/X URL</label>
                                    <input
                                        type="url"
                                        value={settings.social_links?.twitter || ''}
                                        onChange={(e) => updateSettingField('social_links', { ...settings.social_links, twitter: e.target.value })}
                                        placeholder="https://twitter.com/yourpage"
                                    />
                                </div>
                                <button type="button" className="save-btn" disabled={saving} onClick={() => handleSaveSetting('social_links')}>
                                    <Save size={18} /> {saving ? 'Saving...' : 'Save Social Links'}
                                </button>
                            </div>
                        </section>
                    )}

                    {/* Legal Pages Section */}
                    {activeSection === 'legal' && (
                        <section className="content-section">
                            <h2><Scale size={24} /> Legal Pages</h2>
                            <p className="form-note">Edit content for Privacy Policy, Terms, Refund, Warranty, and Cookie Policy pages.</p>

                            {legalPages.map((page) => (
                                <div key={page.page_key} className="edit-form" style={{ marginBottom: '2rem' }}>
                                    <h3>{page.title}</h3>
                                    <div className="form-group">
                                        <label>Title</label>
                                        <input
                                            type="text"
                                            defaultValue={page.title}
                                            onBlur={(e) => {
                                                if (e.target.value !== page.title) {
                                                    handleSaveLegal(page.page_key, { title: e.target.value, content: page.content });
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Content (Markdown)</label>
                                        <textarea
                                            rows={8}
                                            defaultValue={page.content}
                                            onBlur={(e) => {
                                                if (e.target.value !== page.content) {
                                                    handleSaveLegal(page.page_key, { title: page.title, content: e.target.value });
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </section>
                    )}
                </main>
            </div>

            {/* Modal */}
            {showModal && editingItem && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingItem.id ? 'Edit' : 'Add'} {editingItem.type === 'gallery' ? 'Gallery Item' : activeSection === 'services' ? 'Service' : activeSection === 'testimonials' ? 'Testimonial' : 'FAQ'}</h3>
                            <button onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>

                        {activeSection === 'services' && (
                            <ServiceForm
                                data={editingItem}
                                onSave={handleSaveService}
                                onCancel={() => setShowModal(false)}
                                saving={saving}
                            />
                        )}

                        {activeSection === 'testimonials' && (
                            <TestimonialForm
                                data={editingItem}
                                onSave={handleSaveTestimonial}
                                onCancel={() => setShowModal(false)}
                                saving={saving}
                            />
                        )}

                        {activeSection === 'faq' && (
                            <FaqForm
                                data={editingItem}
                                onSave={handleSaveFaq}
                                onCancel={() => setShowModal(false)}
                                saving={saving}
                            />
                        )}

                        {editingItem.type === 'gallery' && (
                            <GalleryForm
                                data={editingItem}
                                onSave={handleSaveGallery}
                                onCancel={() => setShowModal(false)}
                                saving={saving}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ========== FORM COMPONENTS ==========
const ServiceForm = ({ data, onSave, onCancel, saving }) => {
    const [form, setForm] = useState(data);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
                <label>Title</label>
                <input type="text" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
                <label>Description</label>
                <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Icon</label>
                    <select value={form.icon || 'Smartphone'} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
                        <option value="Smartphone">Smartphone</option>
                        <option value="Tablet">Tablet</option>
                        <option value="Laptop">Laptop</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Image URL</label>
                    <input type="text" value={form.image || ''} onChange={(e) => setForm({ ...form, image: e.target.value })} />
                </div>
            </div>
            <div className="form-group">
                <label>Link</label>
                <input type="text" value={form.link || '/services'} onChange={(e) => setForm({ ...form, link: e.target.value })} />
            </div>
            <div className="form-actions">
                <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
                <button type="submit" className="save-btn" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
        </form>
    );
};

const TestimonialForm = ({ data, onSave, onCancel, saving }) => {
    const [form, setForm] = useState(data);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-row">
                <div className="form-group">
                    <label>Customer Name</label>
                    <input type="text" value={form.customer_name || ''} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
                </div>
                <div className="form-group">
                    <label>Title/Role</label>
                    <input type="text" value={form.customer_title || ''} onChange={(e) => setForm({ ...form, customer_title: e.target.value })} placeholder="e.g. iPhone User" />
                </div>
            </div>
            <div className="form-group">
                <label>Testimonial Content</label>
                <textarea value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} required />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Rating</label>
                    <select value={form.rating || 5} onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })}>
                        {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Device Repaired</label>
                    <input type="text" value={form.device_repaired || ''} onChange={(e) => setForm({ ...form, device_repaired: e.target.value })} placeholder="e.g. iPhone 14 Pro" />
                </div>
            </div>
            <div className="form-actions">
                <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
                <button type="submit" className="save-btn" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
        </form>
    );
};

const FaqForm = ({ data, onSave, onCancel, saving }) => {
    const [form, setForm] = useState(data);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
                <label>Question</label>
                <input type="text" value={form.question || ''} onChange={(e) => setForm({ ...form, question: e.target.value })} required />
            </div>
            <div className="form-group">
                <label>Answer</label>
                <textarea value={form.answer || ''} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4} required />
            </div>
            <div className="form-group">
                <label>Category</label>
                <input type="text" value={form.category || 'General'} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="form-actions">
                <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
                <button type="submit" className="save-btn" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
        </form>
    );
};

const GalleryForm = ({ data, onSave, onCancel, saving }) => {
    const [form, setForm] = useState(data);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
                <label>Title</label>
                <input type="text" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
                <label>Description</label>
                <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="form-group">
                <label>Before Image URL</label>
                <input type="text" value={form.before_image || ''} onChange={(e) => setForm({ ...form, before_image: e.target.value })} placeholder="/gallery/phone-before.png" />
            </div>
            <div className="form-group">
                <label>After Image URL</label>
                <input type="text" value={form.after_image || ''} onChange={(e) => setForm({ ...form, after_image: e.target.value })} placeholder="/gallery/phone-after.png" />
            </div>
            <div className="form-group">
                <label>Display Order</label>
                <input type="number" value={form.display_order || 0} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) })} />
            </div>
            <div className="form-actions">
                <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
                <button type="submit" className="save-btn" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
        </form>
    );
};

export default LandingEditor;

