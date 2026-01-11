import { assertEquals, assertThrows } from "https://deno.land/std@0.216.0/assert/mod.ts";
import { generateSchedule } from "./calculator.ts";

Deno.test("generateSchedule - basic even distribution", () => {
    const start = new Date("2024-01-01");
    const exam = new Date("2024-01-06"); // 5 days later
    const target = 100;

    const schedule = generateSchedule(start, exam, target);

    assertEquals(schedule.length, 5);
    assertEquals(schedule[0].target, 20);
    assertEquals(schedule[4].cumulative, 100);
    assertEquals(schedule[0].date.toISOString().split('T')[0], "2024-01-01");
    assertEquals(schedule[4].date.toISOString().split('T')[0], "2024-01-05");
});

Deno.test("generateSchedule - with remainder", () => {
    const start = new Date("2024-01-01");
    const exam = new Date("2024-01-04"); // 3 days
    const target = 10; // 10 / 3 = 3 remainder 1

    const schedule = generateSchedule(start, exam, target);

    assertEquals(schedule.length, 3);
    // Remainder distributed to first day
    assertEquals(schedule[0].target, 4);
    assertEquals(schedule[1].target, 3);
    assertEquals(schedule[2].target, 3);
    assertEquals(schedule[2].cumulative, 10);
});

Deno.test("generateSchedule - error if dates inverted", () => {
    const start = new Date("2024-01-10");
    const exam = new Date("2024-01-01");
    assertThrows(() => {
        generateSchedule(start, exam, 100);
    });
});

Deno.test("generateSchedule - error if target 0", () => {
    const start = new Date("2024-01-01");
    const exam = new Date("2024-01-10");
    assertThrows(() => {
        generateSchedule(start, exam, 0);
    });
});
