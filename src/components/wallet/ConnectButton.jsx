import { useState } from 'react';
import useWallet from '../../hooks/useWallet';

export default function ConnectButton() {
    const { address, isConnected, isCorrectNetwork, connect, switchNetwork, disconnect } = useWallet();
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        setLoading(true);
        try {
            await connect();
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleSwitch = async () => {
        setLoading(true);
        try {
            await switchNetwork();
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    if (!isConnected) {
        return (
            <button
                id="connect-wallet-btn"
                onClick={handleConnect}
                disabled={loading}
                style={{
                    background: 'linear-gradient(135deg, #836ef9 0%, #6b4de6 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: "'Inter', sans-serif",
                    cursor: loading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 15px rgba(131, 110, 249, 0.3)',
                    opacity: loading ? 0.7 : 1
                }}
                onMouseEnter={e => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(131, 110, 249, 0.5)';
                }}
                onMouseLeave={e => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(131, 110, 249, 0.3)';
                }}
            >
                <span style={{ fontSize: '18px' }}>🦊</span>
                {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
        );
    }

    if (!isCorrectNetwork) {
        return (
            <button
                id="switch-network-btn"
                onClick={handleSwitch}
                disabled={loading}
                style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: "'Inter', sans-serif",
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    animation: 'pulse-glow 2s ease-in-out infinite'
                }}
            >
                ⚠️ Switch to Monad
            </button>
        );
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        }}>
            <div style={{
                background: '#111118',
                border: '1px solid #2a2a3a',
                borderRadius: '12px',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px'
            }}>
                <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 8px #10b981'
                }} />
                <span style={{ color: '#a0a0b0' }}>
                    {address.slice(0, 6)}...{address.slice(-4)}
                </span>
            </div>
            <button
                id="disconnect-btn"
                onClick={disconnect}
                style={{
                    background: 'transparent',
                    border: '1px solid #2a2a3a',
                    borderRadius: '8px',
                    color: '#666',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.target.style.borderColor = '#ef4444'; e.target.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.target.style.borderColor = '#2a2a3a'; e.target.style.color = '#666'; }}
            >
                ✕
            </button>
        </div>
    );
}
