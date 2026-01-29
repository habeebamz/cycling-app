"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndCreateMonthlyChallenges = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = __importDefault(require("../prisma"));
const challengeTemplates = [
    { type: 'DISTANCE', goal: 50, condition: 'SINGLE', title: '50km Milestone (Single Ride)' },
    { type: 'DISTANCE', goal: 100, condition: 'SINGLE', title: '100km Century (Single Ride)' },
    { type: 'DISTANCE', goal: 200, condition: 'ACCUMULATIVE', title: 'Monthly Commuter (200km)' },
    { type: 'DISTANCE', goal: 500, condition: 'ACCUMULATIVE', title: 'Endurance Master (500km)' },
    { type: 'TIME', goal: 20, condition: 'ACCUMULATIVE', title: 'Time Dedication (20 Hours)' },
    { type: 'RIDES', goal: 15, condition: 'ACCUMULATIVE', title: 'Frequent Rider (15 Rides)' }
];
const checkAndCreateMonthlyChallenges = async (targetDate = new Date()) => {
    const month = targetDate.toLocaleString('default', { month: 'long' });
    const year = targetDate.getFullYear();
    const startDate = new Date(year, targetDate.getMonth(), 1, 0, 0, 0);
    const endDate = new Date(year, targetDate.getMonth() + 1, 0, 23, 59, 59);
    console.log(`[Scheduler] Checking monthly challenges for ${month} ${year}...`);
    const creator = await prisma_1.default.user.findFirst({
        where: { role: 'ADMIN' }
    }) || await prisma_1.default.user.findFirst();
    if (!creator) {
        console.error('[Scheduler] No user found to create challenges. Skipping.');
        return;
    }
    for (const template of challengeTemplates) {
        const title = `${month} ${year} ${template.title}`;
        const exists = await prisma_1.default.challenge.findFirst({
            where: {
                title: title,
                groupId: null
            }
        });
        if (!exists) {
            console.log(`[Scheduler] Creating: ${title}`);
            const id = Math.floor(100000 + Math.random() * 900000).toString();
            await prisma_1.default.challenge.create({
                data: {
                    id,
                    title,
                    type: template.type,
                    condition: template.condition,
                    goal: template.goal,
                    startDate,
                    endDate,
                    creatorId: creator.id,
                    description: `Join the ${title}! ${template.condition === 'SINGLE' ? `Complete ${template.goal}km in a single ride` : `Complete ${template.goal} ${template.type === 'RIDES' ? 'rides' : (template.type === 'TIME' ? 'hours' : 'km')} in total`} this month.`
                }
            });
        }
    }
};
exports.checkAndCreateMonthlyChallenges = checkAndCreateMonthlyChallenges;
// Run daily at 00:00
node_cron_1.default.schedule('0 0 * * *', () => {
    const now = new Date();
    // 1. Ensure current month
    (0, exports.checkAndCreateMonthlyChallenges)(now);
    // 2. Check if we should create next month (5 days before end of month)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    // If today is e.g. 26th of 30 days => 30 - 26 = 4 <= 5. Create.
    // If today is 25th of 30 days => 30 - 25 = 5 <= 5. Create.
    if (daysInMonth - now.getDate() <= 5) {
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        (0, exports.checkAndCreateMonthlyChallenges)(nextMonth);
    }
});
