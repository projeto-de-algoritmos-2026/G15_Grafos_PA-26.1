from collections import defaultdict


def find_all_schedules(g, class_points, num_disciplinas):
    """
    Runs DFS to find valid combinations (cliques) of classes up to num_disciplinas.
    Returns ranked schedules ordered by highest score.
    """
    vertices = list(g.adj_list.keys())
    if not vertices:
        return []

    subject_to_classes = defaultdict(list)
    for v in vertices:
        subject_to_classes[v.subject_id].append(v)

    subjects_available = list(subject_to_classes.keys())
    all_schedules = []

    target_k = min(num_disciplinas, len(subjects_available))
    if target_k == 0:
        return []

    def dfs(subject_index, current_clique, current_score):
        # Caso base: alcançou a quantidade desejada de disciplinas
        if len(current_clique) == target_k:
            all_schedules.append(
                {
                    "classes": [c.id for c in current_clique],
                    "class_scores": {c.id: class_points[c.id] for c in current_clique},
                    "score": current_score,
                }
            )
            return

        # Fim da lista de disciplinas disponíveis
        if subject_index >= len(subjects_available):
            return

        # Poda/Backtracking: Se mesmo adicionando todas as disciplinas restantes
        # nao for possível alcançar a meta (target_k), encerra esse ramo
        remaining_subjects = len(subjects_available) - subject_index - 1
        if len(current_clique) + remaining_subjects >= target_k:
            # Opção 1: Não pegar nenhuma turma desta matéria (pular a disciplina atual)
            dfs(subject_index + 1, current_clique, current_score)

        # Opção 2: Tentar adicionar alguma turma da materia atual
        subject_id = subjects_available[subject_index]
        for c in subject_to_classes[subject_id]:
            # Verificar se a turma 'c' tem aresta com todas as turmas em 'current_clique'
            is_compatible = True
            for existing_c in current_clique:
                if c not in g.adj_list[existing_c]:
                    is_compatible = False
                    break

            # Se for compatível, adiciona ao clique (subgrafo completo) e avança na DFS
            if is_compatible:
                current_clique.append(c)
                dfs(subject_index + 1, current_clique, current_score + class_points[c.id])
                current_clique.pop()  # Backtracking: remove o vértice para testar as próximas turmas

    dfs(0, [], 0)

    # Ordena os resultados finais baseados na pontuação total dos horários
    all_schedules.sort(key=lambda x: x["score"], reverse=True)

    return all_schedules