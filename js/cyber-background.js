/**
 * Cybersecurity Scrolling Text Background
 * Creates random cybersecurity-themed text that scrolls horizontally
 * Text changes when mouse hovers over it
 */
class CyberBackground {
    constructor() {
        this.canvas = document.getElementById('cyber-canvas');
        if (!this.canvas) {
            console.error('Cyber canvas not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.texts = [];
        this.animationId = null;
        this.pulsePhase = 0;
        this.glitchTimer = 0;
        this.systemLoad = 0;
        
        this.cyberTexts = [
            'ACCESSGRANTED', 'SYSTEMSECURE', 'PENTESTMODE',
            'VULNERABILITYSCAN', 'FIREWALLACTIVE', 'ENCRYPTIONENABLED',
            'DDOSMITIGATED', 'INTRUSIONDETECTED', 'HASHVERIFIED',
            'SSLCERTVALID', 'MALWAREQUARANTINED', 'BACKUPCOMPLETE',
            'LOGANALYZED', 'AUTHSUCCESS', 'BREACHPREVENTED',
            'PHISHINGBLOCKED', 'SPAMFILTERED', 'RANSOMWARESTOPPED',
            'ZERODAYPATCHED', 'SQLINJECTIONFOILED', 'XSSBLOCKED',
            'CSRFTOKENVALID', 'CREDENTIALSTRENGTHHIGH', 'SESSIONSECURE',
            '2FAENABLED', 'KEYSROTATED', 'PROTOCOLSECURE',
            'PORTSCANDETECTED', 'SOCACTIVE', 'SIEMALERT',
            'IDSTRIGGERED', 'IPSBLOCKED', 'WAFENFORCED',
            'HONEYPOTACTIVE', 'THREATINTELUPDATED', 'PATCHAPPLIED',
            'NMAPSCAN', 'METASPLOITARMED', 'BURPSUITERUNNING',
            'CVEFOUND', 'EXPLOITPREVENTED', 'AUTHBYPASSBLOCKED',
            'LATERALMOVEMENTDETECTED', 'PRIVILEGEESCALATIONFAILED',
            'ENDSPOINTPROTECTED', 'EDRACTIVE', 'SIEMMONITORING',
            'SOARTRIGGERED', 'THREATHUNTING', 'IOCMATCHED',
            'SANDBOXANALYZING', 'NETWORKTRAFFICANOMALY', 'BEHAVIORBASEDDETECTION',
            'FILEINTEGRITYCHECK', 'BASELINECOMPLIANCE', 'POLICYENFORCED',
            'SECRETROTATED', 'CLOUDSECURITYSCAN', 'CONTAINERSECURED',
            'KUBERNETESHARDENED', 'APISECURED', 'OAUTHVALID',
            'JWTVERIFIED', 'MFAREQUIRED', 'RBACENFORCED',
            'ZEROTRUSTACTIVE', 'VPNCONNECTED', 'PROXYFILTERING',
            'DLPACTIVE', 'CASBRUNNING', 'IAMENFORCED'
        ];
        
        this.init();
    }
    
    init() {
        this.resize();
        this.createTexts();
        this.animate();
        
        // Handle mouse/touch
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createTexts() {
        this.texts = [];
        // Matrix-style: Vertical falling characters
        const columns = 40; // Number of vertical columns
        
        for (let i = 0; i < columns; i++) {
            const x = (this.canvas.width / columns) * i;
            const y = Math.random() * this.canvas.height;
            
            // Matrix rain effect - vertical scrolling (2x faster)
            const speed = 4 + Math.random() * 6; // Doubled speed
            const fontSize = 15 + Math.random() * 4;
            
            const phrase = this.getRandomPhrase();
            const formatted = this.formatPhraseForColumn(phrase);

            this.texts.push({
                x,
                y,
                text: formatted,
                originalText: formatted,
                speed,
                fontSize,
                alpha: 0.3 + Math.random() * 0.4,
                columnLength: formatted.split('\n').length,
                hue: 180, // Cyan/teal color
                hovered: false
            });
        }
    }

    getRandomPhrase() {
        if (!Array.isArray(this.cyberTexts) || !this.cyberTexts.length) {
            return 'SECURE_SIGNAL';
        }
        const index = Math.floor(Math.random() * this.cyberTexts.length);
        return this.cyberTexts[index];
    }

    formatPhraseForColumn(phrase) {
        if (!phrase || typeof phrase !== 'string') {
            return 'SECURE';
        }
        return phrase.split('').join('\n');
    }

    refreshColumnText(textObj) {
        const phrase = this.getRandomPhrase();
        const formatted = this.formatPhraseForColumn(phrase);
        textObj.text = formatted;
        textObj.originalText = formatted;
        textObj.columnLength = formatted.split('\n').length;
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const columnWidth = this.canvas.width / 40;

        this.texts.forEach(textObj => {
            textObj.hovered = Math.abs(mouseX - textObj.x) < columnWidth;
        });
    }
    
    handleMouseLeave() {
        this.texts.forEach(textObj => {
            textObj.hovered = false;
        });
    }
    
    animate() {
        // Pulse effect (breathing/heartbeat)
        this.pulsePhase += 0.05;
        const pulse = Math.sin(this.pulsePhase) * 0.2 + 0.8; // Oscillates between 0.6 and 1.0
        
        // System load simulation
        this.systemLoad = 85 + Math.sin(this.pulsePhase * 2) * 15; // 70-100%
        
        // Glitch effect every ~20 seconds
        this.glitchTimer++;
        const shouldGlitch = this.glitchTimer % 1200 === 0; // ~20 seconds at 60fps
        
        if (shouldGlitch) {
            this.triggerGlitch();
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.textBaseline = 'top';
        this.ctx.textAlign = 'center';
        
        this.texts.forEach(textObj => {
            // Move text vertically (Matrix rain effect)
            textObj.y += textObj.speed;
            
            // Wrap around when column reaches bottom
            if (textObj.y > this.canvas.height + 50) {
                textObj.y = -500;
                this.refreshColumnText(textObj);
            }
            
            // Determine color: bright red if hovered, cyan/teal if not (with pulse)
            let color;
            if (textObj.hovered) {
                // Bright red for hover
                color = `rgba(255, 0, 0, ${Math.min(1, (textObj.alpha + 0.5) * pulse)})`;
            } else {
                // Cyan/teal for normal state with pulse
                color = `rgba(0, 255, 255, ${textObj.alpha * pulse})`;
            }
            
            this.ctx.font = `bold ${textObj.fontSize}px 'Courier New', monospace`;
            this.ctx.fillStyle = color;
            
            // Draw text in multiple lines (column effect)
            const lines = textObj.text.split('\n');
            let yPos = textObj.y;
            lines.forEach((char, idx) => {
                if (char) {
                    // Fade effect - top is brighter, bottom is dimmer (with pulse)
                    const fade = 1 - (idx / textObj.columnLength);
                    this.ctx.fillStyle = textObj.hovered ? 
                        `rgba(255, 0, 0, ${Math.min(1, (textObj.alpha + 0.5) * fade * pulse)})` : 
                        `rgba(0, 255, 255, ${textObj.alpha * fade * pulse})`;
                    this.ctx.fillText(char, textObj.x, yPos);
                }
                yPos += textObj.fontSize + 2;
            });
        });
        
        this.ctx.restore();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    triggerGlitch() {
        // Screen flicker effect - green flash for 300ms
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 255, 0, 0.15);
            pointer-events: none;
            z-index: 9999;
            animation: glitchFlash 0.3s ease-out;
        `;
        
        document.body.appendChild(overlay);
        
        // Random screen shift during glitch
        const shift = Math.random() < 0.5 ? 1 : -1;
        this.canvas.style.transform = `translate(${shift * 3}px, 0)`;
        
        setTimeout(() => {
            document.body.removeChild(overlay);
            this.canvas.style.transform = 'translate(0, 0)';
        }, 300);
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.cyberBackground = new CyberBackground();
});

window.CyberBackground = CyberBackground;
