# Cronograde

**Número da Lista**: 15<br>
**Conteúdo da Disciplina**: Grafos<br>

## Alunos

| Matrícula | Aluno                          |
| --------- | ------------------------------ |
| 202017049 | Pedro Lucas Figueiredo Santana |
| 232014487 | Luiz Claudio Barbosa de Farias |

## Sobre

O Cronograde ajuda alunos da UnB a montar a melhor grade horária possível. O aluno escolhe as matérias que quer cursar, marca os horários em que está disponível (e quais prefere), e o sistema devolve a combinação de turmas que melhor se encaixa.

O problema é modelado como um **grafo de conflitos**:

- Cada **turma** é um nó do grafo, com um peso proporcional à compatibilidade com os horários do aluno.
- Quando duas turmas ocupam o mesmo horário, existe uma **aresta** entre elas (conflito).
- Encontrar a melhor grade equivale a resolver o problema do **Conjunto Independente de Peso Máximo (MWIS)**: selecionar o subconjunto de turmas sem conflitos entre si que maximize a soma dos pesos, com a restrição de no máximo uma turma por matéria.

O algoritmo usa **backtracking com poda**. Para cada matéria, testa cada turma possível e descarta ramos que já possuem conflito com turmas já selecionadas. Como o número de matérias por aluno é pequeno (5-8), a busca é viável na prática.

A interface mostra o grafo de forma interativa: os nós podem ser arrastados, as turmas escolhidas aparecem coloridas por matéria, e as arestas de conflito ficam visíveis.

## Screenshots

Adicione 3 ou mais screenshots do projeto em funcionamento.

## Instalação

**Linguagem**: Python<br>
**Framework**: Django<br>

**Pré-requisitos**: Python 3 instalado no sistema.

```bash
# 1. Clone o repositório
git clone git@github.com:projeto-de-algoritmos-2026/G15_Grafos_PA-26.1.git
cd G15_Grafos_PA-26.1

# 2. Crie e ative um ambiente virtual
python -m venv venv
source venv/bin/activate   # Linux/macOS
# venv\Scripts\activate    # Windows

# 3. Instale as dependências
pip install -r requirements.txt

# 4. Aplique as migrações e popule o banco
python manage.py migrate
python manage.py import_classes_data

# 5. Inicie o servidor
python manage.py runserver
```

Acesse `http://127.0.0.1:8000/` no navegador.

## Uso

1. Na aba **Matérias**, busque e selecione as disciplinas que quer cursar.
2. Na aba **Disponibilidade**, clique nos horários para marcar como disponível (verde, peso 3) ou preferencial (roxo, peso 10). Clique de novo para desmarcar.
3. Clique em **Gerar Grade Otimizada**. O sistema monta o grafo, roda o algoritmo e mostra:
   - A grade horária com as turmas escolhidas
   - O grafo de conflitos interativo (arraste os nós)
   - Estatísticas: peso total, turmas alocadas, número de nós e arestas

## Estrutura do Grafo

O módulo `cronograde/graph.py` implementa:

- **Classe `Graph`** — grafo não-direcionado com lista de adjacências. Métodos: `add_node`, `add_edge`, `has_edge`, `neighbors`, `degree`, `get_edges`.
- **`build_conflict_graph(sections)`** — recebe as turmas com seus horários, compara os conjuntos de timeslots e cria uma aresta para cada par com interseção (conflito).
- **`find_optimal_schedule(graph)`** — backtracking que percorre matéria por matéria, tenta cada turma, poda caminhos com conflito e retorna o conjunto independente de peso máximo.

### Exemplo

Se o aluno escolhe 3 matérias com 4 turmas cada, o grafo terá até 12 nós. Turmas no mesmo horário ficam conectadas. O algoritmo encontra a combinação sem arestas entre si que maximiza o peso total.
