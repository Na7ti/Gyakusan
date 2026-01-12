/**
 * Represents a daily task item in the schedule
 */
export interface DailyTask {
    date: Date;
    target: number;
    cumulative: number;
}

/**
 * Calculates the daily quota and generates a schedule
 * @param startDate The starting date of the plan
 * @param examDate The date of the exam (deadline)
 * @param totalTarget The total amount to study (pages, hours, etc.)
 * @returns An array of DailyTask objects
 */
export function generateSchedule(startDate: Date, examDate: Date, totalTarget: number): DailyTask[] {
    // Normalize dates to start of day (UTC)
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(examDate);
    end.setUTCHours(0, 0, 0, 0);

    // Calculate total days (inclusive of start date, exclusive of exam date)
    const diffTime = end.getTime() - start.getTime();
    const totalDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    if (totalDays <= 0) {
        throw new Error("Exam date must be in the future relative to start date.");
    }

    if (totalTarget <= 0) {
         throw new Error("Total target must be greater than 0.");
    }

    // Determine base daily quota
    const baseQuota = Math.floor(totalTarget / totalDays);
    const remainder = totalTarget % totalDays;

    const schedule: DailyTask[] = [];
    let cumulative = 0;

    for (let i = 0; i < totalDays; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);

        // Distribute remainder over the first few days (or last, let's do first for front-loading)
        // Or maybe last to be safe? Let's spread it.
        // Simple approach: Add 1 to the first 'remainder' days.
        const dailyAmount = baseQuota + (i < remainder ? 1 : 0);
        cumulative += dailyAmount;

        schedule.push({
            date: currentDate,
            target: dailyAmount,
            cumulative: cumulative,
        });
    }

    return schedule;
}
