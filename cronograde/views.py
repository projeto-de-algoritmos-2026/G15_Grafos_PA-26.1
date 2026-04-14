import json
from django.shortcuts import render, redirect
from django.db.models import Q
from .models import Subject, ClassSection
from .algorithms.scheduler import run_graph_scheduler


def home_view(request):
    return render(request, "cronograde/home.html")


def about_view(request):
    return render(request, "cronograde/about.html")


def planner_view(request):
    return render(request, "cronograde/planner.html")


def subjects_view(request):
    query = request.GET.get("q", "").strip()
    results = Subject.objects.all()

    if query:
        results = Subject.objects.filter(Q(code__icontains=query) | Q(name__icontains=query))

    context = {"subjects": results}
    return render(request, "cronograde/subjects.html", context)


def process_schedule(request):
    """
    Exclusive view to receive data, run the algorithm,
    and save results to the session.
    """
    if request.method == "POST":
        schedule_raw = request.POST.get("schedule_data", "{}")
        subjects_raw = request.POST.get("subjects_data", "[]")
        num_disciplinas_raw = request.POST.get("num_disciplinas", "5")

        try:
            schedule = json.loads(schedule_raw)
            subjects_list = json.loads(subjects_raw)
            num_disciplinas = int(num_disciplinas_raw)
        except (json.JSONDecodeError, ValueError):
            schedule = {}
            subjects_list = []
            num_disciplinas = 5

        selected_subject_ids = [s.get("id") for s in subjects_list if "id" in s]

        all_combinations = run_graph_scheduler(selected_subject_ids, schedule, num_disciplinas)

        request.session["processed_schedules"] = all_combinations

        return redirect("cronograde:results", rank=1)

    return redirect("cronograde:subjects")


def results_base_view(request):
    """
    Redirects to the top-ranked result.
    """
    return redirect("cronograde:results", rank=1)


def results_view(request, rank):
    """
    View that displays the combination at the given rank.
    """
    schedules = request.session.get("processed_schedules")

    if schedules is None:
        return render(request, "cronograde/results.html", {"error": True})

    total_schedules = len(schedules)

    if total_schedules == 0:
        return render(
            request,
            "cronograde/results.html",
            {"error": False, "no_results": True, "total_schedules": 0},
        )

    if rank < 1 or rank > total_schedules:
        return redirect("cronograde:results", rank=1)

    current_schedule = schedules[rank - 1]

    class_ids = current_schedule["classes"]

    classes = (
        ClassSection.objects.filter(id__in=class_ids)
        .select_related("subject")
        .prefetch_related("meetings")
    )

    class_scores = current_schedule.get("class_scores", {})
    colors = [
        "#3b82f6",
        "#10b981",
        "#8b5cf6",
        "#f59e0b",
        "#ec4899",
        "#ef4444",
        "#14b8a6",
        "#f43f5e",
        "#84cc16",
        "#6366f1",
    ]

    agenda_data = {}
    classes_info = []

    for i, c in enumerate(classes):
        display_text = f"{c.subject.code} - {c.section_code}"
        color = colors[i % len(colors)]

        c_points = class_scores.get(str(c.id), 0) or class_scores.get(c.id, 0)

        classes_info.append(
            {
                "subject_code": c.subject.code,
                "subject_name": c.subject.name,
                "section_code": c.section_code,
                "professor": c.professor if c.professor else "A definir",
                "points": c_points,
                "color": color,
            }
        )

        for m in c.meetings.all():
            agenda_data[str(m.slot_id)] = {"text": display_text, "color": color}

    context = {
        "error": False,
        "no_results": False,
        "agenda_data": agenda_data,
        "score": current_schedule["score"],
        "rank": rank,
        "total_schedules": total_schedules,
        "has_next": rank < total_schedules,
        "has_prev": rank > 1,
        "next_rank": rank + 1,
        "prev_rank": rank - 1,
        "classes": classes_info,
    }
    return render(request, "cronograde/results.html", context)
