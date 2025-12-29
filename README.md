# SIFIXA - Mobile & Computer Repair Shop

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)

A modern, full-featured web application for a mobile and computer repair shop business. Built with React and Vite, featuring a customer-facing website and staff management portal.

## ✨ Features

### Customer Portal
- 🏠 **Landing Page** - Beautiful hero section with animations, services, testimonials, and more
- 📅 **Book Repairs** - Multi-step booking form for repair services
- 🔍 **Track Repairs** - Real-time repair status tracking with timeline
- 📱 **Sell Devices** - Device buyback submission system
- 👤 **Customer Dashboard** - View bookings, history, rewards & referrals
- 🌙 **Dark/Light Mode** - Full theme support

### Staff Portal
- 👨‍💼 **Admin Dashboard** - Business analytics and management
- 👷 **Employee Dashboard** - Assigned repairs and task management
- 📦 **Inventory Management** - Parts and stock tracking
- 📊 **Analytics** - Business insights and reporting
- 📝 **CMS** - Content management for website sections

### Technical Features
- ⚡ **Vite** - Lightning fast build tool
- 🔐 **Supabase Auth** - Secure authentication with role-based access
- 📱 **Responsive Design** - Mobile-first approach
- 🎨 **Modern UI** - Glassmorphism, animations, and premium aesthetics

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/bka-dev266/sifixa-website.git
cd sifixa-website
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Add your Supabase credentials to `.env`

4. Start the development server:
```bash
npm run dev
```

5. Open http://localhost:5173 in your browser

## 📁 Project Structure

```
src/
├── components/       # Shared components
├── context/          # React context providers
├── services/         # API services
├── systems/
│   ├── customer/     # Customer-facing pages & components
│   └── staff/        # Staff portal pages & components
├── styles/           # Global styles
└── utils/            # Utility functions
```

## 🛠️ Tech Stack

- **Frontend:** React 18, React Router
- **Build Tool:** Vite
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Styling:** CSS with CSS Variables
- **Icons:** Lucide React

## 🌐 Deployment

This project is deployed using GitHub Pages with GitHub Actions.

**Live Site:** https://bka-dev266.github.io/sifixa-website/

## 📄 License

This project is proprietary software for SIFIXA.

## 👥 Contact

For inquiries, visit [SIFIXA](https://sifixa.com)
