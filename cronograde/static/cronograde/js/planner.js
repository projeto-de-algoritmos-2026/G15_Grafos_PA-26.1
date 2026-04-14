const times = [
  { label: "08:00 - 08:55", code: 11 },
  { label: "08:55 - 09:50", code: 12 },
  { label: "10:00 - 10:55", code: 13 },
  { label: "10:55 - 11:50", code: 14 },
  { label: "12:00 - 12:55", code: 15 },
  { label: "12:55 - 13:50", code: 21 },
  { label: "14:00 - 14:55", code: 22 },
  { label: "14:55 - 15:50", code: 23 },
  { label: "16:00 - 16:55", code: 24 },
  { label: "16:55 - 17:50", code: 25 },
  { label: "18:00 - 18:55", code: 26 },
  { label: "18:55 - 19:50", code: 27 },
  { label: "19:00 - 19:50", code: 31 },
  { label: "19:50 - 20:40", code: 32 },
  { label: "20:50 - 21:40", code: 33 },
  { label: "21:40 - 22:30", code: 34 },
];

const days = [
  { name: "Segunda", code: 2 },
  { name: "Terça", code: 3 },
  { name: "Quarta", code: 4 },
  { name: "Quinta", code: 5 },
  { name: "Sexta", code: 6 },
  { name: "Sábado", code: 7 },
];

let currentMode = "best";
let isDragging = false;
let scheduleData = {};

document.addEventListener("DOMContentLoaded", () => {
  const stored = sessionStorage.getItem("userSchedule");
  if (stored) {
    scheduleData = JSON.parse(stored);
  }
  renderAgenda();

  setTimeout(() => {
    const activeBtn = document.querySelector(".tab-trigger.active");
    if (activeBtn) window.setMode("best", activeBtn);
  }, 50);
});

window.addEventListener("resize", () => {
  const activeBtn = document.querySelector(".tab-trigger.active");
  if (activeBtn) window.setMode(currentMode, activeBtn);
});

window.setMode = function (mode, btnElement) {
  currentMode = mode;

  // Handle visual classes
  document
    .querySelectorAll(".tab-trigger")
    .forEach((btn) => btn.classList.remove("active"));
  btnElement.classList.add("active");

  // Move Indicator sliding background
  const indicator = document.getElementById("tab-indicator");
  const container = document.getElementById("tabs-list");
  const containerRect = container.getBoundingClientRect();
  const btnRect = btnElement.getBoundingClientRect();

  indicator.style.width = `${btnRect.width}px`;
  indicator.style.transform = `translateX(${btnRect.left - containerRect.left}px)`;
};

function renderAgenda() {
  const agenda = document.getElementById("agenda");

  times.forEach((time) => {
    const timeCell = document.createElement("div");
    timeCell.className = "agenda-cell agenda-time";
    timeCell.innerText = time.label;
    agenda.appendChild(timeCell);

    days.forEach((day) => {
      const slotCode = `${day.code}${time.code}`;
      const slotCell = document.createElement("div");
      slotCell.className = "agenda-cell agenda-slot";
      slotCell.dataset.code = slotCode;

      if (scheduleData[slotCode] === 10) {
        slotCell.classList.add("slot-best");
      } else if (scheduleData[slotCode] === 3) {
        slotCell.classList.add("slot-kinda");
      }

      slotCell.addEventListener("mousedown", (e) => {
        e.preventDefault();
        isDragging = true;
        applyMode(slotCell, slotCode);
      });

      slotCell.addEventListener("mouseenter", () => {
        if (isDragging) {
          applyMode(slotCell, slotCode);
        }
      });

      agenda.appendChild(slotCell);
    });
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
}

function applyMode(cell, code) {
  cell.classList.remove("slot-kinda", "slot-best");

  if (currentMode === "kinda") {
    cell.classList.add("slot-kinda");
    scheduleData[code] = 3;
  } else if (currentMode === "best") {
    cell.classList.add("slot-best");
    scheduleData[code] = 10;
  } else {
    delete scheduleData[code];
  }
}

window.saveAndContinue = function (event, btnElement) {
  event.preventDefault();
  sessionStorage.setItem("userSchedule", JSON.stringify(scheduleData));

  const targetBtn = btnElement.closest
    ? btnElement.closest("button")
    : btnElement;
  const nextUrl = targetBtn.getAttribute("data-next-url");

  if (nextUrl) {
    targetBtn.innerHTML = "Carregando...";
    targetBtn.style.opacity = "0.7";
    targetBtn.style.cursor = "wait";

    setTimeout(() => {
      window.location.href = nextUrl;
    }, 10);
  }
};
