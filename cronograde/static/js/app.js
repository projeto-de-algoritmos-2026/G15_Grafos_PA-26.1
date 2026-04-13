document.addEventListener("DOMContentLoaded", function () {
    // ========== STATE ==========
    const state = {
        selectedSubjects: new Map(), // id -> {code, name}
        schedule: [],                // [{code, score}]
    };

    // ========== TABS ==========
    const tabs = document.querySelectorAll(".tab");
    const tabContents = document.querySelectorAll(".tab-content");

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.tab;
            tabs.forEach((t) => t.classList.remove("active"));
            tabContents.forEach((c) => c.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById("tab-" + target).classList.add("active");
        });
    });

    function switchTab(name) {
        tabs.forEach((t) => t.classList.remove("active"));
        tabContents.forEach((c) => c.classList.remove("active"));
        document.querySelector(`.tab[data-tab="${name}"]`).classList.add("active");
        document.getElementById("tab-" + name).classList.add("active");
    }

    // ========== SUBJECTS ==========
    const searchInput = document.getElementById("subject-search");
    const subjectList = document.getElementById("subject-list");
    const selectedChips = document.getElementById("selected-chips");
    const selectedCount = document.getElementById("selected-count");
    let searchTimeout = null;

    searchInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(searchSubjects, 300);
    });

    function searchSubjects() {
        const q = searchInput.value.trim();
        if (q.length < 2) {
            subjectList.innerHTML = '<p class="placeholder-text">Digite pelo menos 2 caracteres...</p>';
            return;
        }

        fetch(`/api/subjects/?q=${encodeURIComponent(q)}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.subjects.length === 0) {
                    subjectList.innerHTML = '<p class="placeholder-text">Nenhuma materia encontrada.</p>';
                    return;
                }
                subjectList.innerHTML = data.subjects
                    .map((s) => {
                        const checked = state.selectedSubjects.has(s.id) ? "checked" : "";
                        const selectedClass = checked ? "selected" : "";
                        return `
                        <div class="subject-item ${selectedClass}" data-id="${s.id}" data-code="${s.code}" data-name="${s.name}">
                            <input type="checkbox" ${checked}>
                            <span class="subject-code">${s.code}</span>
                            <span class="subject-name">${s.name}</span>
                            <span class="subject-sections">${s.num_sections} turma${s.num_sections !== 1 ? "s" : ""}</span>
                        </div>`;
                    })
                    .join("");

                subjectList.querySelectorAll(".subject-item").forEach((item) => {
                    item.addEventListener("click", () => toggleSubject(item));
                });
            });
    }

    function toggleSubject(item) {
        const id = parseInt(item.dataset.id);
        const code = item.dataset.code;
        const name = item.dataset.name;

        if (state.selectedSubjects.has(id)) {
            state.selectedSubjects.delete(id);
            item.classList.remove("selected");
            item.querySelector("input").checked = false;
        } else {
            state.selectedSubjects.set(id, { code, name });
            item.classList.add("selected");
            item.querySelector("input").checked = true;
        }
        renderChips();
    }

    function renderChips() {
        selectedCount.textContent = state.selectedSubjects.size;
        selectedChips.innerHTML = "";
        state.selectedSubjects.forEach((val, id) => {
            const chip = document.createElement("span");
            chip.className = "chip";
            chip.innerHTML = `${val.code} <span class="chip-remove" data-id="${id}">&times;</span>`;
            selectedChips.appendChild(chip);
        });

        selectedChips.querySelectorAll(".chip-remove").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                state.selectedSubjects.delete(id);
                renderChips();
                // Update list checkboxes
                subjectList.querySelectorAll(".subject-item").forEach((item) => {
                    if (parseInt(item.dataset.id) === id) {
                        item.classList.remove("selected");
                        item.querySelector("input").checked = false;
                    }
                });
            });
        });
    }

    // ========== AVAILABILITY GRID ==========
    const gridCells = document.querySelectorAll(".grid-cell");

    gridCells.forEach((cell) => {
        cell.addEventListener("click", () => {
            if (cell.classList.contains("available")) {
                cell.classList.remove("available");
                cell.classList.add("preferred");
            } else if (cell.classList.contains("preferred")) {
                cell.classList.remove("preferred");
            } else {
                cell.classList.add("available");
            }
        });
    });

    document.getElementById("btn-select-all").addEventListener("click", () => {
        gridCells.forEach((cell) => {
            if (!cell.classList.contains("available") && !cell.classList.contains("preferred")) {
                cell.classList.add("available");
            }
        });
    });

    document.getElementById("btn-clear-all").addEventListener("click", () => {
        gridCells.forEach((cell) => {
            cell.classList.remove("available", "preferred");
        });
    });

    // ========== GENERATE ==========
    document.getElementById("btn-generate").addEventListener("click", generateSchedule);

    function generateSchedule() {
        if (state.selectedSubjects.size === 0) {
            alert("Selecione pelo menos uma materia na aba Materias.");
            switchTab("subjects");
            return;
        }

        const schedule = [];
        gridCells.forEach((cell) => {
            let score = 0;
            if (cell.classList.contains("available")) score = 3;
            else if (cell.classList.contains("preferred")) score = 10;
            if (score > 0) {
                schedule.push({ code: cell.dataset.code, score });
            }
        });

        if (schedule.length === 0) {
            alert("Marque pelo menos um horario como disponivel ou preferencial.");
            return;
        }

        const btn = document.getElementById("btn-generate");
        btn.disabled = true;
        btn.textContent = "Gerando...";

        fetch("/api/optimize/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                subject_ids: Array.from(state.selectedSubjects.keys()),
                schedule: schedule,
            }),
        })
            .then((r) => r.json())
            .then((data) => {
                btn.disabled = false;
                btn.textContent = "Gerar Grade Otimizada";

                if (data.error) {
                    alert(data.error);
                    return;
                }

                renderResults(data);
                switchTab("results");
            })
            .catch((err) => {
                btn.disabled = false;
                btn.textContent = "Gerar Grade Otimizada";
                alert("Erro ao gerar grade: " + err.message);
            });
    }

    // ========== RESULTS ==========
    const SUBJECT_COLORS = [
        "#4f46e5", "#06b6d4", "#10b981", "#f59e0b",
        "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6",
        "#f97316", "#6366f1", "#84cc16", "#e11d48",
    ];

    function getSubjectColor(subjectId, allSubjectIds) {
        const idx = allSubjectIds.indexOf(subjectId);
        return SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
    }

    function renderResults(data) {
        document.getElementById("results-placeholder").style.display = "none";
        document.getElementById("results-content").style.display = "block";

        // Stats
        document.getElementById("stat-weight").textContent = data.total_weight;
        document.getElementById("stat-sections").textContent = data.selected.length;
        document.getElementById("stat-nodes").textContent = data.num_nodes;
        document.getElementById("stat-conflicts").textContent = data.num_conflicts;

        // Collect unique subject IDs for color mapping
        const allSubjectIds = [...new Set(data.graph.nodes.map((n) => n.subject_id))];

        // Result schedule grid
        renderResultGrid(data.selected, allSubjectIds);

        // Graph
        renderGraph(data.graph, allSubjectIds);

        // Section details
        renderSectionDetails(data.selected, allSubjectIds);
    }

    function renderResultGrid(selected, allSubjectIds) {
        document.querySelectorAll(".result-cell").forEach((cell) => {
            cell.textContent = "";
            cell.style.background = "";
            cell.style.borderColor = "";
        });

        selected.forEach((section) => {
            const color = getSubjectColor(section.subject_id, allSubjectIds);
            section.slots.forEach((slot) => {
                const cells = document.querySelectorAll(`.result-cell[data-code="${slot.id}"]`);
                cells.forEach((cell) => {
                    cell.textContent = section.label;
                    cell.style.background = color;
                    cell.style.borderColor = color;
                });
            });
        });
    }

    function renderSectionDetails(selected, allSubjectIds) {
        const container = document.getElementById("sections-detail");
        container.innerHTML = selected
            .map((s) => {
                const color = getSubjectColor(s.subject_id, allSubjectIds);
                return `
                <div class="section-card" style="border-left-color: ${color}">
                    <div class="section-color-dot" style="background: ${color}"></div>
                    <div class="section-info">
                        <div class="section-label">${s.label}</div>
                        <div class="section-details">${s.professor} | ${s.location} | ${s.schedule_code}</div>
                    </div>
                    <div class="section-weight">Peso: ${s.weight}</div>
                </div>`;
            })
            .join("");
    }

    // ========== INTERACTIVE GRAPH ==========
    function renderGraph(graphData, allSubjectIds) {
        const canvas = document.getElementById("graph-canvas");
        const ctx = canvas.getContext("2d");
        const tooltip = document.getElementById("graph-tooltip");

        // High DPI support
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        const W = rect.width;
        const H = rect.height;

        if (graphData.nodes.length === 0) {
            ctx.fillStyle = "#94a3b8";
            ctx.font = "14px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Nenhum no no grafo", W / 2, H / 2);
            return;
        }

        // Initialize node positions using force-directed layout
        const nodes = graphData.nodes.map((n, i) => {
            const angle = (2 * Math.PI * i) / graphData.nodes.length;
            const r = Math.min(W, H) * 0.35;
            return {
                ...n,
                x: W / 2 + r * Math.cos(angle),
                y: H / 2 + r * Math.sin(angle),
                vx: 0,
                vy: 0,
                radius: 12 + Math.min(n.weight, 60) * 0.3,
                color: getSubjectColor(n.subject_id, allSubjectIds),
            };
        });

        const nodeMap = {};
        nodes.forEach((n) => (nodeMap[n.id] = n));

        const edges = graphData.edges.map((e) => ({
            source: nodeMap[e.source],
            target: nodeMap[e.target],
        }));

        // Force simulation
        function simulate() {
            for (let iter = 0; iter < 200; iter++) {
                // Repulsion between all nodes
                for (let i = 0; i < nodes.length; i++) {
                    for (let j = i + 1; j < nodes.length; j++) {
                        const dx = nodes[j].x - nodes[i].x;
                        const dy = nodes[j].y - nodes[i].y;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        const force = 3000 / (dist * dist);
                        const fx = (dx / dist) * force;
                        const fy = (dy / dist) * force;
                        nodes[i].vx -= fx;
                        nodes[i].vy -= fy;
                        nodes[j].vx += fx;
                        nodes[j].vy += fy;
                    }
                }

                // Attraction along edges
                edges.forEach((e) => {
                    const dx = e.target.x - e.source.x;
                    const dy = e.target.y - e.source.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = (dist - 100) * 0.01;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    e.source.vx += fx;
                    e.source.vy += fy;
                    e.target.vx -= fx;
                    e.target.vy -= fy;
                });

                // Center gravity
                nodes.forEach((n) => {
                    n.vx += (W / 2 - n.x) * 0.005;
                    n.vy += (H / 2 - n.y) * 0.005;
                });

                // Apply velocities with damping
                nodes.forEach((n) => {
                    n.vx *= 0.85;
                    n.vy *= 0.85;
                    n.x += n.vx;
                    n.y += n.vy;
                    // Keep in bounds
                    n.x = Math.max(n.radius + 5, Math.min(W - n.radius - 5, n.x));
                    n.y = Math.max(n.radius + 5, Math.min(H - n.radius - 5, n.y));
                });
            }
        }

        simulate();

        // Drawing
        let dragNode = null;
        let hoveredNode = null;

        function draw() {
            ctx.clearRect(0, 0, W, H);

            // Draw edges
            edges.forEach((e) => {
                ctx.beginPath();
                ctx.moveTo(e.source.x, e.source.y);
                ctx.lineTo(e.target.x, e.target.y);
                const isConflictWithSelected = e.source.selected && e.target.selected;
                ctx.strokeStyle = isConflictWithSelected
                    ? "rgba(239, 68, 68, 0.8)"
                    : "rgba(148, 163, 184, 0.3)";
                ctx.lineWidth = isConflictWithSelected ? 2 : 1;
                ctx.stroke();
            });

            // Draw nodes
            nodes.forEach((n) => {
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);

                if (n.selected) {
                    ctx.fillStyle = n.color;
                    ctx.fill();
                    ctx.strokeStyle = "#fff";
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    ctx.strokeStyle = n.color;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                } else {
                    ctx.fillStyle = "rgba(148, 163, 184, 0.3)";
                    ctx.fill();
                    ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                // Label
                ctx.fillStyle = n.selected ? "#fff" : "#64748b";
                ctx.font = `${n.selected ? "bold " : ""}${Math.max(8, n.radius * 0.6)}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                const parts = n.label.split(" ");
                if (parts.length >= 2 && n.radius > 14) {
                    ctx.fillText(parts[0], n.x, n.y - 5);
                    ctx.fillText(parts.slice(1).join(" "), n.x, n.y + 6);
                } else {
                    ctx.fillText(n.label, n.x, n.y);
                }
            });
        }

        draw();

        // Interaction - drag
        function getNodeAt(x, y) {
            for (let i = nodes.length - 1; i >= 0; i--) {
                const n = nodes[i];
                const dx = x - n.x;
                const dy = y - n.y;
                if (dx * dx + dy * dy < n.radius * n.radius) return n;
            }
            return null;
        }

        function getMousePos(e) {
            const r = canvas.getBoundingClientRect();
            return { x: e.clientX - r.left, y: e.clientY - r.top };
        }

        canvas.addEventListener("mousedown", (e) => {
            const pos = getMousePos(e);
            dragNode = getNodeAt(pos.x, pos.y);
        });

        canvas.addEventListener("mousemove", (e) => {
            const pos = getMousePos(e);
            if (dragNode) {
                dragNode.x = pos.x;
                dragNode.y = pos.y;
                draw();
            }

            // Tooltip
            const node = getNodeAt(pos.x, pos.y);
            if (node && node !== hoveredNode) {
                hoveredNode = node;
                const degree = edges.filter(
                    (ed) => ed.source.id === node.id || ed.target.id === node.id
                ).length;
                tooltip.innerHTML = `
                    <strong>${node.label}</strong><br>
                    Peso: ${node.weight}<br>
                    Conflitos: ${degree}<br>
                    ${node.selected ? "&#10004; Selecionada" : "Nao selecionada"}`;
                tooltip.style.display = "block";
                tooltip.style.left = e.clientX + 12 + "px";
                tooltip.style.top = e.clientY + 12 + "px";
            } else if (!node) {
                hoveredNode = null;
                tooltip.style.display = "none";
            } else if (node === hoveredNode) {
                tooltip.style.left = e.clientX + 12 + "px";
                tooltip.style.top = e.clientY + 12 + "px";
            }

            canvas.style.cursor = node ? "grab" : "default";
        });

        canvas.addEventListener("mouseup", () => {
            dragNode = null;
        });

        canvas.addEventListener("mouseleave", () => {
            dragNode = null;
            hoveredNode = null;
            tooltip.style.display = "none";
        });
    }
});
