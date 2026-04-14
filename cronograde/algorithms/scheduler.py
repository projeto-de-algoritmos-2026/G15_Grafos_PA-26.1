from .graph_builder import build_compatibility_graph
from .solver import find_all_schedules


def run_graph_scheduler(selected_subject_ids, schedule_data, num_disciplinas):
    """
    Main entry point for the scheduling algorithm.
    Builds the graph, runs DFS to find valid combinations, and returns ranked schedules.

    schedule_data: dict of slot_id (str or int) -> points (int)
    """
    g, class_points = build_compatibility_graph(selected_subject_ids, schedule_data)
    ranked_schedules = find_all_schedules(g, class_points, num_disciplinas)

    return ranked_schedules
