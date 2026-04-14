class Graph:
    def __init__(self):
        self.adj_list = {}

    def add_vertice(self, vertice):
        if vertice not in self.adj_list:
            self.adj_list[vertice] = []

    def add_edge(self, u, v):
        self.add_vertice(u)
        self.add_vertice(v)

        self.adj_list[u].append(v)
        self.adj_list[v].append(u)

    def print_graph(self):
        for vertice, adj_vertices in self.adj_list.items():
            print(f"{vertice} -> {adj_vertices}")
