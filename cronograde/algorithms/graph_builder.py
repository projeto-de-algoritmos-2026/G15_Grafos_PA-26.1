from cronograde.models import Subject
from .graph import Graph


def build_compatibility_graph(selected_subject_ids, schedule_data):
    """
    Filters classes based on user availability and builds the compatibility graph.
    Returns the graph and a dictionary of points per class section.
    """
    subjects = Subject.objects.filter(id__in=selected_subject_ids)

    # Convert the time slots numbers to int
    valid_slots = {int(k): v for k, v in schedule_data.items()}

    valid_classes = []
    class_points = {}

    for subject in subjects:
        for section in subject.classes.all():
            meetings = section.meetings.all()
            if not meetings:
                continue

            is_valid = True
            pts = 0
            for meeting in meetings:
                if meeting.slot_id not in valid_slots:
                    is_valid = False
                    break
                pts += valid_slots[meeting.slot_id]

            if is_valid:
                valid_classes.append(section)
                class_points[section.id] = pts

    g = Graph()

    section_slots = {}
    for section in valid_classes:
        section_slots[section.id] = set(m.slot_id for m in section.meetings.all())
        g.add_vertice(section)

    for i in range(len(valid_classes)):
        for j in range(i + 1, len(valid_classes)):
            c1 = valid_classes[i]
            c2 = valid_classes[j]

            if c1.subject_id == c2.subject_id:
                continue

            if not section_slots[c1.id].intersection(section_slots[c2.id]):
                g.add_edge(c1, c2)

    return g, class_points
