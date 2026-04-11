from django.db import models
from .time_choices import TimeSlot


class Subject(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class ClassSection(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="classes")
    section_code = models.CharField(max_length=2)
    professor = models.CharField(max_length=200, blank=True)
    schedule_code = models.CharField(max_length=50, blank=True)
    location = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.subject.code} | Section {self.section_code} - {self.professor}"


class Meeting(models.Model):
    class_section = models.ForeignKey(
        ClassSection, on_delete=models.CASCADE, related_name="meetings"
    )
    slot_id = models.IntegerField(choices=TimeSlot.choices)

    def __str__(self):
        return f"{self.class_section.subject.code} -> {self.get_slot_id_display()}"
