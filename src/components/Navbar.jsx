import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      height: '56px',
      background: '#1a73e8',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      fontFamily: "'Google Sans', Roboto, sans-serif"
    }}>
      
      {/* Brand & GCP Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <svg viewBox="0 0 192 192" width="26" height="26">
          <path fill="#4285F4" d="M168,96c0-5.8-0.5-11.4-1.5-16.7H96v31.7h40.4c-1.7,9.3-7,17.1-14.9,22.4v18.6h24.1C159.8,138.8,168,119,168,96z"/>
          <path fill="#34A853" d="M96,168c19.4,0,35.8-6.4,47.7-17.4l-24.1-18.6c-6.7,4.5-15.3,7.1-23.6,7.1c-18.2,0-33.6-12.3-39.1-28.8H32v19.2C43.8,153,68.2,168,96,168z"/>
          <path fill="#FBBC04" d="M56.9,110.3c-1.4-4.2-2.2-8.7-2.2-13.3s0.8-9.1,2.2-13.3V64.5H32C26.9,74.7,24,86,24,98s2.9,23.3,8,33.5L56.9,110.3z"/>
          <path fill="#EA4335" d="M96,54c10.6,0,20.1,3.6,27.6,10.8l20.7-20.7C131.8,32.7,115.4,26,96,26C68.2,26,43.8,41,32,64.5l24.9,19.2C62.4,66.3,77.8,54,96,54z"/>
        </svg>

        <Link to="/" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: '500', fontSize: '1.1rem', letterSpacing: '-0.2px' }}>
          Google Cloud <span style={{ opacity: 0.8, fontWeight: 'normal', fontSize: '0.95rem' }}>/ Storage Console</span>
        </Link>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link
          to="/"
          style={{
            color: '#ffffff',
            textDecoration: 'none',
            fontSize: '0.9rem',
            padding: '6px 14px',
            borderRadius: '4px',
            fontWeight: isActive('/') ? '600' : '500',
            background: isActive('/') ? 'rgba(255,255,255,0.2)' : 'transparent'
          }}
        >
          Upload Folders
        </Link>
        <Link
          to="/dashboard"
          style={{
            color: '#ffffff',
            textDecoration: 'none',
            fontSize: '0.9rem',
            padding: '6px 14px',
            borderRadius: '4px',
            fontWeight: isActive('/dashboard') ? '600' : '500',
            background: isActive('/dashboard') ? 'rgba(255,255,255,0.2)' : 'transparent'
          }}
        >
          Live Dashboard
        </Link>
        <Link
          to="/history"
          style={{
            color: '#ffffff',
            textDecoration: 'none',
            fontSize: '0.9rem',
            padding: '6px 14px',
            borderRadius: '4px',
            fontWeight: isActive('/history') ? '600' : '500',
            background: isActive('/history') ? 'rgba(255,255,255,0.2)' : 'transparent'
          }}
        >
          History
        </Link>

        {/* Live Status Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255,255,255,0.18)',
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '0.78rem',
          fontWeight: '600',
          marginLeft: '12px'
        }}>
          <span style={{ width: '7px', height: '7px', background: '#00e676', borderRadius: '50%' }}></span>
          <span>Cluster Active</span>
        </div>
      </div>

    </nav>
  );
}
