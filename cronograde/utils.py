import re


def parse_schedule_code(schedule_code):
    shift_weights = {
        "M": 10,
        "T": 20,
        "N": 30,
    }

    slots = set()

    patterns = re.findall(r"([2-7]+)([MTN])([1-7]+)", schedule_code.upper())

    for days, shift, times in patterns:
        weight = shift_weights[shift]

        for day in days:
            for time in times:
                slot_id = (int(day) * 100) + weight + int(time)
                slots.add(slot_id)

    return slots
