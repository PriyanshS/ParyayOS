// ═══════════════════════════════════════════════════════
//  CampusZero — LocalStorage Data Store
// ═══════════════════════════════════════════════════════

const Store = {
    _prefix: 'cz_',

    _get(key) {
        try { return JSON.parse(localStorage.getItem(this._prefix + key)); }
        catch { return null; }
    },
    _set(key, val) {
        localStorage.setItem(this._prefix + key, JSON.stringify(val));
    },
    _remove(key) {
        localStorage.removeItem(this._prefix + key);
    },

    // ── Auth ──
    getAdmin() { return this._get('admin'); },
    setAdmin(admin) { this._set('admin', admin); },
    isLoggedIn() { return !!this.getAdmin(); },
    logout() { this._remove('admin'); },

    // ── Campus Profile ──
    getCampus() { return this._get('campus') || null; },
    setCampus(campus) { this._set('campus', campus); },

    // ── Ingestion Mode ──
    getMode() { return this._get('mode') || null; }, // 'static' | 'dynamic'
    setMode(mode) { this._set('mode', mode); },

    // ── Sensor Readings (time-series) ──
    getReadings() {
        return this._get('readings') || { power: [], water: [], waste: [] };
    },
    addReading(pillar, entry) {
        const r = this.getReadings();
        if (!r[pillar]) r[pillar] = [];
        r[pillar].push({ ...entry, timestamp: entry.timestamp || Date.now() });
        // Keep last 365 days max
        if (r[pillar].length > 365) r[pillar] = r[pillar].slice(-365);
        this._set('readings', r);
    },
    setReadings(readings) { this._set('readings', readings); },

    // ── Game State ──
    getGameState() {
        return this._get('game') || {
            xp: 0,
            level: 1,
            streak: 0,
            bestStreak: 0,
            totalDays: 0,
            consumed: 0,
            generated: 0,
            history: [],
            lastPlayedDate: null
        };
    },
    setGameState(state) { this._set('game', state); },

    // ── Roadmap ──
    getRoadmap() {
        return this._get('roadmap') || [];
    },
    addRoadmapItem(item) {
        const r = this.getRoadmap();
        r.push({ ...item, id: 'rm_' + Date.now(), addedAt: Date.now(), completed: false });
        this._set('roadmap', r);
    },
    updateRoadmapItem(id, updates) {
        const r = this.getRoadmap();
        const idx = r.findIndex(i => i.id === id);
        if (idx >= 0) { Object.assign(r[idx], updates); this._set('roadmap', r); }
    },

    // ── Alerts ──
    getAlerts() { return this._get('alerts') || []; },
    addAlert(alert) {
        const a = this.getAlerts();
        a.unshift({ ...alert, id: 'al_' + Date.now(), time: Date.now(), read: false });
        if (a.length > 50) a.length = 50;
        this._set('alerts', a);
    },
    markAlertRead(id) {
        const a = this.getAlerts();
        const al = a.find(x => x.id === id);
        if (al) { al.read = true; this._set('alerts', a); }
    },
    getUnreadCount() {
        return this.getAlerts().filter(a => !a.read).length;
    },

    // ── Twin Config ──
    getTwinConfig() { return this._get('twin') || null; },
    setTwinConfig(config) { this._set('twin', config); },

    // ── Full Reset ──
    resetAll() {
        Object.keys(localStorage).forEach(k => {
            if (k.startsWith(this._prefix)) localStorage.removeItem(k);
        });
    },

    // ── Generate sample historical data for demo ──
    generateSampleData() {
        const readings = { power: [], water: [], waste: [] };
        const now = Date.now();
        const DAY = 86400000;

        for (let i = 89; i >= 0; i--) {
            const ts = now - i * DAY;
            const season = Math.sin((i / 90) * Math.PI * 2);

            readings.power.push({
                timestamp: ts,
                consumption_kwh: Math.round(1200 + season * 300 + (Math.random() - 0.5) * 200),
                generation_kwh: Math.round(600 + season * 150 + Math.random() * 100),
                peak_kw: Math.round(400 + Math.random() * 100),
                grid_import_kwh: Math.round(500 + (Math.random() - 0.5) * 150),
            });

            readings.water.push({
                timestamp: ts,
                consumption_liters: Math.round(45000 + season * 8000 + (Math.random() - 0.5) * 5000),
                recycled_liters: Math.round(15000 + Math.random() * 5000),
                harvested_liters: Math.round(season > 0 ? season * 10000 + Math.random() * 3000 : Math.random() * 2000),
            });

            readings.waste.push({
                timestamp: ts,
                total_kg: Math.round(800 + (Math.random() - 0.5) * 200),
                recycled_kg: Math.round(400 + Math.random() * 150),
                composted_kg: Math.round(200 + Math.random() * 100),
                landfill_kg: Math.round(100 + Math.random() * 80),
            });
        }
        this.setReadings(readings);
    }
};

// Make globally available
window.Store = Store;
