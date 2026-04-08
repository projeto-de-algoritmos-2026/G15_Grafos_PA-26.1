"""
TIME SLOT GENERATOR SCRIPT
--------------------------
DO NOT EDIT 'cronograde/time_choices.py' MANUALLY!

This script generates the exact Python code for the 'TimeSlot' IntegerChoices
class based on the specific schedule rules of the University of Brasília (UnB).

Usage:
1. Run this script in the terminal: python scripts/generate_timeslots.py
2. Copy the output.
3. Paste the output into 'cronograde/time_choices.py'

Rules applied:
- Morning (M): 55-min classes, 10-min break after the 2nd and 4th classes.
- Afternoon (T): 55-min classes, 10-min break after the 1st, 3rd, and 5th classes.
- Night (N): 50-min classes, 10-min break after the 2nd class.
"""

from datetime import datetime, timedelta

WEEKDAYS = {
    2: ("MON", "Monday"),
    3: ("TUE", "Tuesday"),
    4: ("WED", "Wednesday"),
    5: ("THU", "Thursday"),
    6: ("FRI", "Friday"),
    7: ("SAT", "Saturday"),
}

SHIFTS = {"M": (10, "Morning"), "T": (20, "Afternoon"), "N": (30, "Night")}


def generate_shift_schedule(
    class_count: int,
    start_hour: int,
    start_minute: int,
    class_duration_mins: int,
    break_after_classes: list,
):
    schedule_blocks = {}
    current_time = datetime(2024, 1, 1, start_hour, start_minute)

    for class_index in range(1, class_count + 1):
        end_time = current_time + timedelta(minutes=class_duration_mins)

        start_str = current_time.strftime("%H:%M")
        end_str = end_time.strftime("%H:%M")

        schedule_blocks[class_index] = f"{start_str} to {end_str}"
        current_time = end_time

        if class_index in break_after_classes:
            current_time += timedelta(minutes=10)

    return schedule_blocks


def main():
    morning_schedule = generate_shift_schedule(
        class_count=5,
        start_hour=8,
        start_minute=0,
        class_duration_mins=55,
        break_after_classes=[2, 4],
    )
    afternoon_schedule = generate_shift_schedule(
        class_count=7,
        start_hour=12,
        start_minute=55,
        class_duration_mins=55,
        break_after_classes=[1, 3, 5],
    )
    night_schedule = generate_shift_schedule(
        class_count=4,
        start_hour=19,
        start_minute=0,
        class_duration_mins=50,
        break_after_classes=[2],
    )

    print("from django.db import models\n")
    print("class TimeSlot(models.IntegerChoices):")

    for day_number, (day_prefix, day_name) in WEEKDAYS.items():
        for shift_prefix, (shift_weight, shift_name) in SHIFTS.items():
            if shift_prefix == "M":
                active_schedule = morning_schedule
            elif shift_prefix == "T":
                active_schedule = afternoon_schedule
            elif shift_prefix == "N":
                active_schedule = night_schedule

            for class_index, time_interval in active_schedule.items():
                math_id = (day_number * 100) + shift_weight + class_index
                variable_name = f"{day_prefix}_{shift_prefix}{class_index}"
                description = f"{day_name} - {time_interval}"

                print(f'    {variable_name} = {math_id}, "{description}"')

        print("")


if __name__ == "__main__":
    main()
