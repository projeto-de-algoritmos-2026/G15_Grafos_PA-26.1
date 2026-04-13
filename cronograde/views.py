from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from .models import Subject, ClassSection, Meeting
from .time_choices import TimeSlot
from .graph import build_conflict_graph, find_optimal_schedule


def home_view(request):
    time_slots = TimeSlot.choices
    days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]
    day_numbers = [2, 3, 4, 5, 6, 7]

    # Slot offsets within a day (shift_weight + class_number)
    # Morning: M1=11, M2=12, M3=13, M4=14, M5=15
    # Afternoon: T1=21, T2=22, T3=23, T4=24, T5=25, T6=26, T7=27
    # Night: N1=31, N2=32, N3=33, N4=34
    periods = [
        ("Manha", [
            (11, "08:00 - 08:55"),
            (12, "08:55 - 09:50"),
            (13, "10:00 - 10:55"),
            (14, "10:55 - 11:50"),
            (15, "12:00 - 12:55"),
        ]),
        ("Tarde", [
            (21, "12:55 - 13:50"),
            (22, "14:00 - 14:55"),
            (23, "14:55 - 15:50"),
            (24, "16:00 - 16:55"),
            (25, "16:55 - 17:50"),
            (26, "18:00 - 18:55"),
            (27, "18:55 - 19:50"),
        ]),
        ("Noite", [
            (31, "19:00 - 19:50"),
            (32, "19:50 - 20:40"),
            (33, "20:50 - 21:40"),
            (34, "21:40 - 22:30"),
        ]),
    ]

    organized_rows = []
    for period_name, slots in periods:
        organized_rows.append({"type": "separator", "label": period_name})
        for offset, label in slots:
            codes = [day_num * 100 + offset for day_num in day_numbers]
            organized_rows.append({
                "type": "slot",
                "label": label,
                "codes": codes,
            })

    context = {
        "organized_rows": organized_rows,
        "days": days,
        "day_numbers": day_numbers,
        "periods": periods,
    }
    return render(request, "cronograde/home.html", context)


def api_subjects(request):
    q = request.GET.get("q", "").strip()
    subjects = Subject.objects.all()
    if q:
        subjects = subjects.filter(name__icontains=q) | subjects.filter(code__icontains=q)
    subjects = subjects.order_by("code")[:50]

    data = []
    for s in subjects:
        num_sections = s.classes.count()
        data.append({
            "id": s.id,
            "code": s.code,
            "name": s.name,
            "num_sections": num_sections,
        })
    return JsonResponse({"subjects": data})


@csrf_exempt
def api_optimize(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    body = json.loads(request.body)
    subject_ids = body.get("subject_ids", [])
    schedule = body.get("schedule", [])

    if not subject_ids:
        return JsonResponse({"error": "Nenhuma materia selecionada"}, status=400)

    # Mapa de score por slot_id a partir da disponibilidade do usuario
    score_map = {}
    for item in schedule:
        score_map[int(item["code"])] = item["score"]

    # Carregar turmas das materias selecionadas
    sections = ClassSection.objects.filter(
        subject_id__in=subject_ids
    ).select_related("subject").prefetch_related("meetings")

    sections_with_weights = []
    for section in sections:
        slots = set(m.slot_id for m in section.meetings.all())
        weight = sum(score_map.get(slot, 0) for slot in slots)

        if weight == 0:
            continue

        sections_with_weights.append({
            "id": section.pk,
            "subject_id": section.subject_id,
            "label": f"{section.subject.code} T{section.section_code}",
            "weight": weight,
            "slots": slots,
            "professor": section.professor,
            "location": section.location,
            "schedule_code": section.schedule_code,
        })

    if not sections_with_weights:
        return JsonResponse({
            "error": "Nenhuma turma compativel com sua disponibilidade",
            "graph": {"nodes": [], "edges": []},
            "selected": [],
            "total_weight": 0,
        })

    # Construir grafo de conflitos
    graph = build_conflict_graph(sections_with_weights)

    # Encontrar solucao otima
    result = find_optimal_schedule(graph)
    selected_ids = set(result["selected"])

    # Marcar nos selecionados
    for node_id in graph.nodes:
        graph.nodes[node_id]["selected"] = node_id in selected_ids

    # Montar detalhes das turmas selecionadas
    selected_details = []
    for section in sections_with_weights:
        if section["id"] in selected_ids:
            slot_labels = []
            for slot in sorted(section["slots"]):
                for value, label in TimeSlot.choices:
                    if value == slot:
                        slot_labels.append({"id": slot, "label": label})
                        break
            selected_details.append({
                "id": section["id"],
                "subject_id": section["subject_id"],
                "label": section["label"],
                "professor": section["professor"],
                "location": section["location"],
                "schedule_code": section["schedule_code"],
                "weight": section["weight"],
                "slots": slot_labels,
            })

    graph_data = graph.to_dict()

    return JsonResponse({
        "selected": selected_details,
        "graph": graph_data,
        "total_weight": result["total_weight"],
        "num_conflicts": len(graph_data["edges"]),
        "num_nodes": len(graph_data["nodes"]),
    })
