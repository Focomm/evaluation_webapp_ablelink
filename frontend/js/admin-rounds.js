// Rounds Management Functions
async function loadRounds() {
    try {
        const response = await fetch(`${API_BASE}/rounds`);
        const rounds = await response.json();
        
        const roundsList = document.getElementById('roundsList');
        
        if (rounds.length === 0) {
            roundsList.innerHTML = '<p style="color: #666; font-style: italic;">No rounds found</p>';
        } else {
            roundsList.innerHTML = rounds.map(r => `
                <div class="round-item">
                    <div class="round-content">
                        <div class="round-header">
                            <div class="round-name">${r.round_name}</div>
                            <div class="round-dates">${formatDate(r.start_date)} - ${formatDate(r.end_date)}</div>
                        </div>
                        <div class="round-period">
                            Duration: ${calculateDuration(r.start_date, r.end_date)} days
                        </div>
                    </div>
                    <div class="round-actions">
                        <div class="round-status ${r.is_active ? 'active' : 'inactive'}">
                            ${r.is_active ? 'Active' : 'Inactive'}
                        </div>
                        <button class="edit-btn" onclick="editRound(${r.round_id}, '${r.round_name}', '${r.start_date}', '${r.end_date}', ${r.is_active})">
                            Edit
                        </button>
                        <button class="delete-btn" onclick="deleteRound(${r.round_id}, '${r.round_name}')">
                            Delete
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load rounds:', error);
        document.getElementById('roundsList').innerHTML = '<p style="color: #e74c3c;">Failed to load rounds</p>';
    }
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-GB');
}

function calculateDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function showCreateRound() {
    // ซ่อนฟอร์มอื่นๆ
    document.querySelectorAll('.form-container').forEach(form => {
        form.classList.remove('show');
        form.classList.add('hidden');
    });
    
    const form = document.getElementById('createRoundForm');
    form.classList.remove('hidden');
    setTimeout(() => {
        form.classList.add('show');
    }, 10);
}

function cancelCreateRound() {
    const form = document.getElementById('createRoundForm');
    form.classList.remove('show');
    setTimeout(() => {
        form.classList.add('hidden');
        document.getElementById('roundForm').reset();
    }, 300);
}

async function createRound() {
    const roundName = document.getElementById('roundName').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const isActive = document.getElementById('roundIsActive').checked;
    
    if (!roundName || !startDate || !endDate) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (new Date(startDate) >= new Date(endDate)) {
        alert('End date must be after start date');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/rounds`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `round_name=${encodeURIComponent(roundName)}&start_date=${startDate}&end_date=${endDate}&is_active=${isActive}`
        });
        
        if (response.ok) {
            alert('Round created successfully!');
            cancelCreateRound();
            loadRounds();
        } else {
            alert('Failed to create round');
        }
    } catch (error) {
        alert('Error creating round');
    }
}

function editRound(roundId, roundName, startDate, endDate, isActive) {
    // ซ่อนฟอร์มอื่นๆ
    document.querySelectorAll('.form-container').forEach(form => {
        form.classList.remove('show');
        form.classList.add('hidden');
    });
    
    // หา round item ที่คลิก
    const roundItem = event.target.closest('.round-item');
    
    // ใส่ข้อมูลในฟอร์ม
    document.getElementById('editRoundId').value = roundId;
    document.getElementById('editRoundName').value = roundName;
    document.getElementById('editStartDate').value = startDate;
    document.getElementById('editEndDate').value = endDate;
    document.getElementById('editRoundIsActive').checked = isActive;
    
    // ย้ายฟอร์มไปใต้ item ที่คลิก
    const form = document.getElementById('editRoundForm');
    form.classList.remove('hidden');
    roundItem.parentNode.insertBefore(form, roundItem.nextSibling);
    
    // แสดงฟอร์มด้วย animation
    setTimeout(() => {
        form.classList.add('show');
    }, 10);
}

function cancelEditRound() {
    const form = document.getElementById('editRoundForm');
    form.classList.remove('show');
    setTimeout(() => {
        form.classList.add('hidden');
    }, 300);
}

async function updateRound() {
    const roundId = document.getElementById('editRoundId').value;
    const roundName = document.getElementById('editRoundName').value;
    const startDate = document.getElementById('editStartDate').value;
    const endDate = document.getElementById('editEndDate').value;
    const isActive = document.getElementById('editRoundIsActive').checked;
    
    if (!roundName || !startDate || !endDate) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (new Date(startDate) >= new Date(endDate)) {
        alert('End date must be after start date');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/rounds/${roundId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `round_name=${encodeURIComponent(roundName)}&start_date=${startDate}&end_date=${endDate}&is_active=${isActive}`
        });
        
        if (response.ok) {
            alert('Round updated successfully!');
            const form = document.getElementById('editRoundForm');
            form.classList.remove('show');
            setTimeout(() => {
                form.classList.add('hidden');
                loadRounds();
            }, 300);
        } else {
            alert('Failed to update round');
        }
    } catch (error) {
        alert('Error updating round');
    }
}

async function deleteRound(roundId, roundName) {
    if (!confirm(`Are you sure you want to delete round "${roundName}"? This will also delete all related assignments and evaluations.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/rounds/${roundId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Round deleted successfully!');
            loadRounds();
        } else {
            alert('Failed to delete round');
        }
    } catch (error) {
        alert('Error deleting round');
    }
}