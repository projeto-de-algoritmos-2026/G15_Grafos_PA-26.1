const availableContainer = document.getElementById('available-subjects');
const selectedContainer = document.getElementById('selected-subjects');
const selectedIds = new Set();

// Load from sessionStorage when page loads
document.addEventListener('DOMContentLoaded', () => {
    const stored = sessionStorage.getItem('selectedSubjects');
    if (stored) {
        const subjects = JSON.parse(stored);
        subjects.forEach(s => {
            if (!selectedIds.has(s.id)) {
                selectedIds.add(s.id);
                renderSelectedItem(s.id, s.code, s.name);
            }
        });
    }
    
    // Hide available subjects that are already selected
    selectedIds.forEach(id => {
        const availableCard = document.getElementById(`available-${id}`);
        if (availableCard) {
            availableCard.style.display = 'none';
        }
    });

    // Load quantity of subjects
    const storedNum = sessionStorage.getItem('numDisciplinas');
    if (storedNum) {
        const numInput = document.getElementById('num_disciplinas');
        const display = document.getElementById('quantity-display');
        if (numInput && display) {
            numInput.value = storedNum;
            display.innerText = storedNum;
        }
    }

    // Save state before searching so selections aren't lost
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', () => {
            saveState();
        });
    }
});

function saveState() {
    const subjects = [];
    document.querySelectorAll('.selected-item').forEach(item => {
        const id = parseInt(item.id.replace('selected-', ''));
        const code = item.querySelector('.selected-item-info span').innerText;
        const name = item.querySelector('.selected-item-info p').innerText;
        subjects.push({id, code, name});
    });
    sessionStorage.setItem('selectedSubjects', JSON.stringify(subjects));

    // Save quantity of subjects
    const numInput = document.getElementById('num_disciplinas');
    if (numInput) {
        sessionStorage.setItem('numDisciplinas', numInput.value);
    }
}

function renderSelectedItem(id, code, name) {
    const emptyMsg = selectedContainer.querySelector('.empty-msg');
    if (emptyMsg) emptyMsg.remove();

    const item = document.createElement('div');
    item.className = 'selected-item';
    item.id = `selected-${id}`;
    item.innerHTML = `
        <div class="selected-item-info">
            <span>${code}</span>
            <p>${name}</p>
        </div>
        <button type="button" class="btn-remove" onclick="removeSubject(${id})">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="remove-subject-icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
        </button>
    `;
    selectedContainer.appendChild(item);
}

window.addSubject = function(id, code, name) {
    if (selectedIds.has(id)) return;
    
    selectedIds.add(id);
    renderSelectedItem(id, code, name);

    // Hide from available list
    const availableCard = document.getElementById(`available-${id}`);
    if (availableCard) {
        availableCard.style.display = 'none';
    }
}

window.removeSubject = function(id) {
    selectedIds.delete(id);
    const item = document.getElementById(`selected-${id}`);
    if (item) item.remove();

    const availableCard = document.getElementById(`available-${id}`);
    if (availableCard) {
        availableCard.style.display = 'flex'; // Restore it
    }

    if (selectedIds.size === 0) {
        selectedContainer.innerHTML = '<p class="empty-msg">Nenhuma disciplina selecionada ainda.</p>';
    }
}

window.saveAndContinue = function(event, btnElement) {
    event.preventDefault();
    
    const targetBtn = btnElement.closest ? btnElement.closest('button') : btnElement;
    targetBtn.innerHTML = 'Processando...';
    targetBtn.style.opacity = '0.7';
    targetBtn.style.cursor = 'wait';
    
    // 1. Save data from this page to active memory/sessionStorage
    saveState(); 

    // 2. Collect EVERYTHING from sessionStorage
    const schedule = sessionStorage.getItem('userSchedule');
    const subjects = sessionStorage.getItem('selectedSubjects');
    const num = sessionStorage.getItem('numDisciplinas');

    // 3. Fill the hidden form inputs
    const hiddenSchedule = document.getElementById('hidden-schedule');
    const hiddenSubjects = document.getElementById('hidden-subjects');
    const hiddenNum = document.getElementById('hidden-num');
    const finalForm = document.getElementById('final-form');

    setTimeout(() => {
        if (hiddenSchedule && hiddenSubjects && hiddenNum && finalForm) {
            hiddenSchedule.value = schedule || '{}';
            hiddenSubjects.value = subjects || '[]';
            hiddenNum.value = num || '5';

            // 4. Submit to Django Backend
            finalForm.submit();
        } else {
            // Fallback to GET if form is missing
            const nextUrl = targetBtn.getAttribute('data-next-url');
            if (nextUrl) window.location.href = nextUrl;
        }
    }, 10);
}
