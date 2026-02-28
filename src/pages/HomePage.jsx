import ConnectButton from '../components/wallet/ConnectButton';
import NetworkBadge from '../components/wallet/NetworkBadge';
import useWallet from '../hooks/useWallet';
import { useNavigate } from 'react-router-dom';
import { DEMO_MODE } from '../config/demoMode';

/**
 * HomePage — Landing page with wallet connect.
 * Dark cyberpunk aesthetic with Monad branding.
 */
export default function HomePage() {
    const { isConnected, isCorrectNetwork } = useWallet();
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(131, 110, 249, 0.08) 0%, #0a0a0f 60%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', sans-serif",
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated background grid */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: `
          linear-gradient(rgba(131, 110, 249, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(131, 110, 249, 0.03) 1px, transparent 1px)
        `,
                backgroundSize: '40px 40px',
                pointerEvents: 'none'
            }} />

            {/* Network badge */}
            <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                <NetworkBadge />
            </div>

            {/* Main content */}
            <div style={{
                textAlign: 'center',
                maxWidth: '600px',
                padding: '0 20px',
                zIndex: 1
            }}>
                {/* Logo text */}
                <div style={{
                    fontSize: '14px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#836ef9',
                    letterSpacing: '4px',
                    textTransform: 'uppercase',
                    marginBottom: '12px'
                }}>
                    ⟐ Powered by Monad
                </div>

                <h1 style={{
                    fontSize: '64px',
                    fontWeight: '800',
                    margin: '0 0 8px',
                    background: 'linear-gradient(135deg, #fff 0%, #836ef9 50%, #00ff9d 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    lineHeight: 1.1
                }}>
                    MONAD<br />STRIKE
                </h1>

                <p style={{
                    fontSize: '18px',
                    color: '#888',
                    margin: '0 0 8px',
                    fontWeight: '300'
                }}>
                    On-Chain CS Economy Game
                </p>

                <p style={{
                    fontSize: '13px',
                    color: '#555',
                    fontFamily: "'JetBrains Mono', monospace",
                    margin: '0 0 40px',
                    lineHeight: 1.6
                }}>
                    Every weapon trade, kill bounty, and round settlement —<br />
                    confirmed on-chain before the next round starts.<br />
                    <span style={{ color: '#836ef9' }}>Watch the block explorer while you play.</span>
                </p>

                {/* CTA */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <ConnectButton />

                    {isConnected && (DEMO_MODE || isCorrectNetwork) && (
                        <button
                            id="play-now-btn"
                            onClick={() => navigate('/lobby')}
                            style={{
                                background: 'linear-gradient(135deg, #00ff9d 0%, #10b981 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                color: '#0a0a0f',
                                padding: '14px 40px',
                                fontSize: '16px',
                                fontWeight: '700',
                                fontFamily: "'Inter', sans-serif",
                                cursor: 'pointer',
                                boxShadow: '0 4px 20px rgba(0, 255, 157, 0.3)',
                                transition: 'all 0.2s ease',
                                textTransform: 'uppercase',
                                letterSpacing: '2px'
                            }}
                            onMouseEnter={e => {
                                e.target.style.transform = 'translateY(-3px)';
                                e.target.style.boxShadow = '0 8px 30px rgba(0, 255, 157, 0.5)';
                            }}
                            onMouseLeave={e => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 20px rgba(0, 255, 157, 0.3)';
                            }}
                        >
                            ▶ Play Now
                        </button>
                    )}
                </div>

                {/* Stats preview */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '32px',
                    marginTop: '60px'
                }}>
                    {[
                        { value: '10,000', label: 'TPS on Monad' },
                        { value: '<1s', label: 'Block Time' },
                        { value: '~$0.001', label: 'Per Transaction' }
                    ].map(stat => (
                        <div key={stat.label} style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                fontFamily: "'JetBrains Mono', monospace",
                                color: '#836ef9'
                            }}>
                                {stat.value}
                            </div>
                            <div style={{
                                fontSize: '11px',
                                color: '#555',
                                marginTop: '4px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div style={{
                position: 'absolute',
                bottom: '24px',
                fontSize: '11px',
                color: '#333',
                fontFamily: "'JetBrains Mono', monospace"
            }}>
                Built for Monad Hackathon 2026 ⟐
            </div>
        </div>
    );
}
