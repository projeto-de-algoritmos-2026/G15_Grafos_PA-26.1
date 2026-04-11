import json
from pathlib import Path
from django.core.management.base import BaseCommand
from cronograde.models import Subject, ClassSection, Meeting
from cronograde.utils import parse_schedule_code

current_file = Path(__file__).resolve()
json_file_path = current_file.parents[3] / "scripts" / "classes_data.json"


class Command(BaseCommand):
    help = "Populate the database from a JSON file"

    def handle(self, *args, **kwargs):
        with open(json_file_path, "r") as file:
            data = json.load(file)

            for item in data:
                subject, _ = Subject.objects.get_or_create(
                    code=item["subject"].split("-")[0].strip(),
                    defaults={"name": item["subject"].split("-")[1].strip()},
                )

                class_section, _ = ClassSection.objects.update_or_create(
                    subject=subject,
                    section_code=item["class_number"],
                    defaults={
                        "professor": item["professor"],
                        "schedule_code": item["schedule"],
                        "location": item["location"],
                    },
                )

                slot_list = parse_schedule_code(item["schedule"])

                class_section.meetings.all().delete()
                for slot in slot_list:
                    Meeting.objects.create(class_section=class_section, slot_id=slot)
