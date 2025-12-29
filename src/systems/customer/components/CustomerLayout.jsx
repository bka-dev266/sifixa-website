import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import GlobalBackground from '../../../components/GlobalBackground';

const CustomerLayout = () => {
    return (
        <>
            <GlobalBackground />
            <Navbar />
            <main className="main-content">
                <Outlet />
            </main>
            <Footer />
        </>
    );
};

export default CustomerLayout;

