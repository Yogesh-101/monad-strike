import useWallet from '../../hooks/useWallet';

export default function NetworkBadge() {
    const { isConnected, isCorrectNetwork, chainId } = useWallet();

    if (!isConnected) return null;

    return (
        <div
            id="network-badge"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: isCorrectNetwork
                    ? 'rgba(131, 110, 249, 0.1)'
                    : 'rgba(245, 158, 11, 0.1)',
                border: `1px solid ${isCorrectNetwork ? '#836ef9' : '#f59e0b'}`,
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                color: isCorrectNetwork ? '#836ef9' : '#f59e0b'
            }}
        >
            <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isCorrectNetwork ? '#836ef9' : '#f59e0b',
                boxShadow: `0 0 6px ${isCorrectNetwork ? '#836ef9' : '#f59e0b'}`
            }} />
            {isCorrectNetwork ? '⟐ Monad Testnet' : `Wrong Network`}
        </div>
    );
}
