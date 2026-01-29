"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const http_1 = require("http");
const socket_1 = require("./socket");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const activity_routes_1 = __importDefault(require("./routes/activity.routes"));
const sync_routes_1 = __importDefault(require("./routes/sync.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const community_routes_1 = __importDefault(require("./routes/community.routes"));
const challenge_routes_1 = __importDefault(require("./routes/challenge.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const challenge_scheduler_1 = require("./services/challenge.scheduler");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Initialize Scheduler
const runStartupChecks = async () => {
    const now = new Date();
    await (0, challenge_scheduler_1.checkAndCreateMonthlyChallenges)(now);
    // Also check if we should create next month (5 days before)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (daysInMonth - now.getDate() <= 5) {
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        await (0, challenge_scheduler_1.checkAndCreateMonthlyChallenges)(nextMonth);
    }
};
runStartupChecks().catch(console.error);
// Create HTTP server
const server = (0, http_1.createServer)(app);
// Initialize Socket.IO
const io = (0, socket_1.initSocket)(server);
// Make io accessible in routes if needed (e.g. app.set('io', io))
app.set('io', io);
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static('uploads'));
app.use('/api/auth', auth_routes_1.default);
app.use('/api/activities', activity_routes_1.default);
app.use('/api/sync', sync_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api', community_routes_1.default); // Mount at /api root for groups
app.use('/api/challenges', challenge_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/upload', upload_routes_1.default);
app.use('/api/reports', report_routes_1.default);
app.get('/', (req, res) => {
    res.send('Cycling App API is running');
});
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
