
import { checkAndCreateMonthlyChallenges } from './src/services/challenge.scheduler';
import prisma from './src/prisma'; // Ensure prisma instance is same or connection works

const main = async () => {
    console.log('--- Triggering Scheduler Logic Manually ---');
    const now = new Date();
    await checkAndCreateMonthlyChallenges(now);

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remaining = daysInMonth - now.getDate();
    console.log(`Days remaining in month: ${remaining}`);

    if (remaining <= 5) {
        console.log('Within 5 days of end of month. triggering Next Month creation...');
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        await checkAndCreateMonthlyChallenges(nextMonth);
    } else {
        console.log('Not within 5 days. Next month skipped.');
    }
};

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
