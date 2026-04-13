from collections import defaultdict


class Graph:
    """
    Grafo nao-direcionado para modelar conflitos entre turmas.
    Nos = turmas, arestas = conflitos de horario.
    """

    def __init__(self):
        self.adj = defaultdict(set)
        self.nodes = {}

    def add_node(self, node_id, data=None):
        if node_id not in self.nodes:
            self.nodes[node_id] = data if data is not None else {}
            if node_id not in self.adj:
                self.adj[node_id] = set()

    def add_edge(self, u, v):
        self.add_node(u)
        self.add_node(v)
        if u != v:
            self.adj[u].add(v)
            self.adj[v].add(u)

    def has_edge(self, u, v):
        return v in self.adj.get(u, set())

    def neighbors(self, node_id):
        return self.adj.get(node_id, set())

    def degree(self, node_id):
        return len(self.adj.get(node_id, set()))

    def get_edges(self):
        edges = set()
        for u in self.adj:
            for v in self.adj[u]:
                edge = (min(u, v), max(u, v))
                edges.add(edge)
        return edges

    def to_dict(self):
        nodes = []
        for node_id, data in self.nodes.items():
            nodes.append({
                "id": node_id,
                "label": data.get("label", str(node_id)),
                "weight": data.get("weight", 0),
                "subject_id": data.get("subject_id"),
                "selected": data.get("selected", False),
            })
        edges = [{"source": u, "target": v} for u, v in self.get_edges()]
        return {"nodes": nodes, "edges": edges}

    def __str__(self):
        lines = []
        for node_id in self.nodes:
            neighbors = ", ".join(str(n) for n in self.adj[node_id])
            lines.append(f"{node_id} -> [{neighbors}]")
        return "\n".join(lines)


def build_conflict_graph(sections_with_weights):
    """
    Constroi um grafo de conflitos a partir de uma lista de turmas.

    Args:
        sections_with_weights: lista de dicts com:
            - id: ID da turma (ClassSection.pk)
            - subject_id: ID da materia
            - label: texto do no (ex: "CIC0004 T01")
            - weight: peso baseado na disponibilidade do usuario
            - slots: set de slot_ids (horarios da turma)

    Returns:
        Graph com nos = turmas e arestas = conflitos de horario
    """
    graph = Graph()

    for section in sections_with_weights:
        graph.add_node(section["id"], {
            "label": section["label"],
            "weight": section["weight"],
            "subject_id": section["subject_id"],
            "slots": section["slots"],
        })

    section_list = list(sections_with_weights)
    for i in range(len(section_list)):
        for j in range(i + 1, len(section_list)):
            a = section_list[i]
            b = section_list[j]
            if a["slots"] & b["slots"]:
                graph.add_edge(a["id"], b["id"])

    return graph


def find_optimal_schedule(graph):
    """
    Encontra o conjunto independente de peso maximo no grafo,
    com a restricao de no maximo 1 turma por materia.

    Usa backtracking com poda para explorar combinacoes.

    Returns:
        dict com:
            - selected: lista de node_ids selecionados
            - total_weight: peso total da solucao
    """
    subjects = defaultdict(list)
    for node_id, data in graph.nodes.items():
        subjects[data["subject_id"]].append(node_id)

    subject_list = list(subjects.items())
    best = {"selected": [], "total_weight": 0}

    def backtrack(idx, current_selected, current_weight):
        if current_weight > best["total_weight"]:
            best["selected"] = list(current_selected)
            best["total_weight"] = current_weight

        if idx >= len(subject_list):
            return

        _subject_id, section_ids = subject_list[idx]

        # opcao: pular esta materia
        backtrack(idx + 1, current_selected, current_weight)

        # opcao: escolher uma turma desta materia
        for section_id in section_ids:
            conflicts = False
            for selected_id in current_selected:
                if graph.has_edge(section_id, selected_id):
                    conflicts = True
                    break
            if not conflicts:
                weight = graph.nodes[section_id].get("weight", 0)
                current_selected.append(section_id)
                backtrack(idx + 1, current_selected, current_weight + weight)
                current_selected.pop()

    backtrack(0, [], 0)
    return best
