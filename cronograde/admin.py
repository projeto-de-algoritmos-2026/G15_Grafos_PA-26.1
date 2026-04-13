from django.contrib import admin
from .models import Subject, ClassSection, Meeting


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("code", "name")
    search_fields = ("code", "name")


@admin.register(ClassSection)
class ClassSectionAdmin(admin.ModelAdmin):
    list_display = ("subject", "section_code", "professor", "schedule_code", "location")
    list_filter = ("subject",)
    search_fields = ("subject__code", "subject__name", "professor")


@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ("class_section", "slot_id")
    list_filter = ("slot_id",)
