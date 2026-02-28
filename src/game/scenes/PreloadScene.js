import Phaser from 'phaser';

/**
 * Preload Scene — loads all game assets before gameplay begins.
 * Creates simple colored rectangles as texture replacements
 * so the game works without external sprite files.
 */
export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        // Create a loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x2a2a3a, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 16, 320, 32);

        const loadingText = this.add.text(width / 2, height / 2 - 40, 'LOADING MONADSTRIKE...', {
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '14px',
            color: '#836ef9'
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x836ef9, 1);
            progressBar.fillRect(width / 2 - 156, height / 2 - 12, 312 * value, 24);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // Generate textures programmatically (no external assets needed)
        this._createTextures();
    }

    _createTextures() {
        // Player texture — 32x32 colored circle
        const playerCanvas = this.textures.createCanvas('player', 32, 32);
        const pCtx = playerCanvas.getContext();
        pCtx.fillStyle = '#00ff9d';
        pCtx.beginPath();
        pCtx.arc(16, 16, 14, 0, Math.PI * 2);
        pCtx.fill();
        pCtx.strokeStyle = '#10b981';
        pCtx.lineWidth = 2;
        pCtx.stroke();
        playerCanvas.refresh();

        // Enemy texture
        const enemyCanvas = this.textures.createCanvas('enemy', 32, 32);
        const eCtx = enemyCanvas.getContext();
        eCtx.fillStyle = '#ef4444';
        eCtx.beginPath();
        eCtx.arc(16, 16, 14, 0, Math.PI * 2);
        eCtx.fill();
        eCtx.strokeStyle = '#ff6666';
        eCtx.lineWidth = 2;
        eCtx.stroke();
        enemyCanvas.refresh();

        // Bullet texture — small circle
        const bulletCanvas = this.textures.createCanvas('bullet', 6, 6);
        const bCtx = bulletCanvas.getContext();
        bCtx.fillStyle = '#f59e0b';
        bCtx.beginPath();
        bCtx.arc(3, 3, 3, 0, Math.PI * 2);
        bCtx.fill();
        bulletCanvas.refresh();

        // Wall texture — dark block
        const wallCanvas = this.textures.createCanvas('wall', 32, 32);
        const wCtx = wallCanvas.getContext();
        wCtx.fillStyle = '#2a2a3a';
        wCtx.fillRect(0, 0, 32, 32);
        wCtx.strokeStyle = '#3a3a4a';
        wCtx.lineWidth = 1;
        wCtx.strokeRect(0, 0, 32, 32);
        wallCanvas.refresh();

        // Floor tile
        const floorCanvas = this.textures.createCanvas('floor', 32, 32);
        const fCtx = floorCanvas.getContext();
        fCtx.fillStyle = '#0d0d14';
        fCtx.fillRect(0, 0, 32, 32);
        fCtx.strokeStyle = '#151520';
        fCtx.lineWidth = 0.5;
        fCtx.strokeRect(0, 0, 32, 32);
        floorCanvas.refresh();

        // Crosshair
        const chCanvas = this.textures.createCanvas('crosshair', 24, 24);
        const chCtx = chCanvas.getContext();
        chCtx.strokeStyle = '#00ff9d';
        chCtx.lineWidth = 1.5;
        // Horizontal line
        chCtx.beginPath();
        chCtx.moveTo(0, 12); chCtx.lineTo(9, 12);
        chCtx.moveTo(15, 12); chCtx.lineTo(24, 12);
        // Vertical line
        chCtx.moveTo(12, 0); chCtx.lineTo(12, 9);
        chCtx.moveTo(12, 15); chCtx.lineTo(12, 24);
        chCtx.stroke();
        // Center dot
        chCtx.fillStyle = '#00ff9d';
        chCtx.beginPath();
        chCtx.arc(12, 12, 1.5, 0, Math.PI * 2);
        chCtx.fill();
        chCanvas.refresh();
    }

    create() {
        this.scene.start('GameScene');
    }
}
