document.addEventListener('DOMContentLoaded', function () {
    const timeSlots = document.querySelectorAll('.time-slot');
    const continueBtn = document.getElementById('continue-btn');

    timeSlots.forEach(slot => {
        slot.addEventListener('click', () => {
            if (slot.classList.contains('available')) {
                slot.classList.remove('available');
                slot.classList.add('preferred');
            } else if (slot.classList.contains('preferred')) {
                slot.classList.remove('preferred');
            } else {
                slot.classList.add('available');
            }
        });
    });

    continueBtn.addEventListener('click', () => {
        const selectedTimes = [];
        timeSlots.forEach(slot => {
            let score = 0;
            if (slot.classList.contains('available')) {
                score = 3;
            } else if (slot.classList.contains('preferred')) {
                score = 10;
            }

            if (score > 0) {
                selectedTimes.push({
                    code: slot.dataset.code,
                    score: score
                });
            }
        });

        fetch('/save_schedule/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken') 
            },
            body: JSON.stringify({ horarios: selectedTimes })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            // Redirect or show a success message
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    });

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});
