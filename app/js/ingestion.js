// ═══════════════════════════════════════════════════════
//  CampusZero — CSV Ingestion & IoT Simulation
// ═══════════════════════════════════════════════════════

const Ingestion = {
    // ── CSV Parser ──
    parseCSV(text) {
        const lines = text.trim().split('\n');
        if (lines.length < 2) throw new Error('CSV must have header + at least 1 row');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const vals = lines[i].split(',').map(v => v.trim());
            if (vals.length !== headers.length) continue;
            const row = {};
            headers.forEach((h, idx) => {
                const v = vals[idx];
                row[h] = isNaN(v) ? v : parseFloat(v);
            });
            rows.push(row);
        }
        return { headers, rows };
    },

    // ── Validate & Ingest CSV for a pillar ──
    ingestCSV(pillar, csvText) {
        const { headers, rows } = this.parseCSV(csvText);
        const results = { success: 0, errors: [], warnings: [] };

        const requiredFields = {
            power: ['date', 'consumption_kwh'],
            water: ['date', 'consumption_liters'],
            waste: ['date', 'total_kg']
        };

        const req = requiredFields[pillar] || [];
        const missing = req.filter(f => !headers.includes(f));
        if (missing.length > 0) {
            results.errors.push(`Missing required columns: ${missing.join(', ')}`);
            return results;
        }

        rows.forEach((row, idx) => {
            try {
                const dateVal = row.date;
                let ts;
                if (typeof dateVal === 'string') {
                    ts = new Date(dateVal).getTime();
                    if (isNaN(ts)) {
                        // Try DD/MM/YYYY
                        const parts = dateVal.split(/[\/\-]/);
                        if (parts.length === 3) {
                            ts = new Date(parts[2], parts[1] - 1, parts[0]).getTime();
                        }
                    }
                } else {
                    ts = dateVal;
                }
                if (isNaN(ts)) {
                    results.warnings.push(`Row ${idx + 2}: Invalid date, skipped`);
                    return;
                }

                const entry = { timestamp: ts };
                headers.forEach(h => { if (h !== 'date') entry[h] = row[h]; });
                Store.addReading(pillar, entry);
                results.success++;
            } catch (e) {
                results.warnings.push(`Row ${idx + 2}: ${e.message}`);
            }
        });

        return results;
    },

    // ── Handle file upload ──
    handleFileUpload(file, pillar) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const result = this.ingestCSV(pillar, e.target.result);
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    },

    // ── Dynamic IoT Simulation ──
    _simInterval: null,
    _simCallbacks: [],

    startSimulation(callback) {
        if (callback) this._simCallbacks.push(callback);
        if (this._simInterval) return;

        this._simInterval = setInterval(() => {
            const now = Date.now();
            const hour = new Date().getHours();
            const isDay = hour >= 6 && hour <= 18;

            // Power
            const powerReading = {
                timestamp: now,
                consumption_kwh: Math.round(80 + Math.random() * 40 + (isDay ? 30 : -10)),
                generation_kwh: Math.round(isDay ? 40 + Math.random() * 30 : Math.random() * 5),
                peak_kw: Math.round(300 + Math.random() * 150),
                grid_import_kwh: Math.round(40 + Math.random() * 30),
            };
            Store.addReading('power', powerReading);

            // Water
            const waterReading = {
                timestamp: now,
                consumption_liters: Math.round(3000 + Math.random() * 2000),
                recycled_liters: Math.round(1000 + Math.random() * 800),
                harvested_liters: Math.round(Math.random() * 500),
            };
            Store.addReading('water', waterReading);

            // Waste
            const wasteReading = {
                timestamp: now,
                total_kg: Math.round(50 + Math.random() * 30),
                recycled_kg: Math.round(25 + Math.random() * 15),
                composted_kg: Math.round(10 + Math.random() * 10),
                landfill_kg: Math.round(5 + Math.random() * 10),
            };
            Store.addReading('waste', wasteReading);

            const data = { power: powerReading, water: waterReading, waste: wasteReading };
            this._simCallbacks.forEach(cb => cb(data));
        }, 5000); // Every 5 seconds
    },

    stopSimulation() {
        if (this._simInterval) {
            clearInterval(this._simInterval);
            this._simInterval = null;
        }
        this._simCallbacks = [];
    },

    // ── Daily Prompt (Static Mode) ──
    shouldPromptUpload() {
        const mode = Store.getMode();
        if (mode !== 'static') return false;
        const readings = Store.getReadings();
        if (!readings.power.length) return true;
        const lastTs = readings.power[readings.power.length - 1].timestamp;
        const daysSince = (Date.now() - lastTs) / 86400000;
        return daysSince >= 1;
    }
};

window.Ingestion = Ingestion;
