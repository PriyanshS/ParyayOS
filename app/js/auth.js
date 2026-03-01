// ═══════════════════════════════════════════════════════
//  CampusZero — Auth & Registration Module
// ═══════════════════════════════════════════════════════

const Auth = {
    generateId() {
        return 'CZ-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    },

    register(data) {
        const admin = {
            id: this.generateId(),
            institutionName: data.institutionName,
            campusLat: data.campusLat,
            campusLng: data.campusLng,
            campusAddress: data.campusAddress || '',
            adminName: data.adminName,
            adminEmail: data.adminEmail,
            avatarUrl: data.avatarUrl || null,
            registeredAt: Date.now(),
            lastLogin: Date.now()
        };

        Store.setAdmin(admin);
        Store.setCampus({
            name: data.institutionName,
            lat: data.campusLat,
            lng: data.campusLng,
            address: data.campusAddress || '',
            bbox: data.bbox || null,
            buildings: [],
            sensorCount: 0
        });

        // Initialize game state
        Store.setGameState({
            xp: 0,
            level: 1,
            streak: 0,
            bestStreak: 0,
            totalDays: 0,
            consumed: 0,
            generated: 0,
            history: [],
            lastPlayedDate: null
        });

        return admin;
    },

    login(email) {
        const admin = Store.getAdmin();
        if (admin && admin.adminEmail === email) {
            admin.lastLogin = Date.now();
            Store.setAdmin(admin);
            return admin;
        }
        return null;
    },

    mockGoogleLogin(adminName, email) {
        // Simulated Google OAuth — auto-creates session
        const existingAdmin = Store.getAdmin();
        if (existingAdmin) {
            existingAdmin.lastLogin = Date.now();
            Store.setAdmin(existingAdmin);
            return existingAdmin;
        }
        return null;
    },

    isAuthenticated() {
        return Store.isLoggedIn();
    },

    getCurrentAdmin() {
        return Store.getAdmin();
    },

    logout() {
        Store.logout();
    }
};

window.Auth = Auth;
