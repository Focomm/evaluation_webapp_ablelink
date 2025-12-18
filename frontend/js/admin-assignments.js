// Assignments Management Functions
async function loadAssignments() {
    try {
        const response = await fetch(`${API_BASE}/assignments`);
        const assignments = await response.json();
        
        const assignmentsList = document.getElementById('assignmentsList');
        
        if (assignments.length === 0) {
            assignmentsList.innerHTML = '<p style="color: #666; font-style: italic;">No assignments found</p>';
        } else {
            assignmentsList.innerHTML = assignments.map(a => `
                <div class="assignment-item">
                    <div class="assignment-content">
                        <div class="assignment-header">
                            <div class="assignment-round">${a.round_name}</div>
                            <div class="assignment-status ${a.status ? 'completed' : 'pending'}">${a.status ? 'Completed' : 'Pending'}</div>
                        </div>
                        <div class="assignment-details">
                            <div class="assignment-pair">
                                <span class="evaluator">
                                    <strong>Evaluator:</strong> ${a.evaluator_name} (${a.evaluator_code})
                                </span>
                                <span class="arrow">→</span>
                                <span class="target">
                                    <strong>Target:</strong> ${a.target_name} (${a.target_code})
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="assignment-actions">
                        <button class="delete-btn" onclick="deleteAssignment(${a.assign_id}, '${a.evaluator_name}', '${a.target_name}')">
                            Delete
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load assignments:', error);
        document.getElementById('assignmentsList').innerHTML = '<p style="color: #e74c3c;">Failed to load assignments</p>';
    }
}

async function showCreateAssignment() {
    // ซ่อนฟอร์มอื่นๆ
    document.querySelectorAll('.form-container').forEach(form => {
        form.classList.remove('show');
        form.classList.add('hidden');
    });
    
    await loadRoundsForAssignment();
    await loadUsersForAssignment();
    
    const form = document.getElementById('createAssignmentForm');
    form.classList.remove('hidden');
    setTimeout(() => {
        form.classList.add('show');
    }, 10);
}

async function loadRoundsForAssignment() {
    try {
        const response = await fetch(`${API_BASE}/rounds`);
        const rounds = await response.json();
        
        const select = document.getElementById('assignRoundId');
        select.innerHTML = '<option value="">Select Round</option>';
        
        rounds.forEach(round => {
            select.innerHTML += `<option value="${round.round_id}">${round.round_name}</option>`;
        });
    } catch (error) {
        console.error('Failed to load rounds for assignment');
    }
}

async function loadUsersForAssignment() {
    try {
        const response = await fetch(`${API_BASE}/users`);
        const users = await response.json();
        
        const evaluatorSelect = document.getElementById('evaluatorId');
        const targetSelect = document.getElementById('targetId');
        
        evaluatorSelect.innerHTML = '<option value="">Select Evaluator</option>';
        targetSelect.innerHTML = '<option value="">Select Target</option>';
        
        users.forEach(user => {
            const option = `<option value="${user.user_id}">${user.full_name} (${user.emp_code})</option>`;
            evaluatorSelect.innerHTML += option;
            targetSelect.innerHTML += option;
        });
    } catch (error) {
        console.error('Failed to load users for assignment');
    }
}

function cancelCreateAssignment() {
    const form = document.getElementById('createAssignmentForm');
    form.classList.remove('show');
    setTimeout(() => {
        form.classList.add('hidden');
        document.getElementById('assignmentForm').reset();
    }, 300);
}

async function createAssignment() {
    const roundId = document.getElementById('assignRoundId').value;
    const evaluatorId = document.getElementById('evaluatorId').value;
    const targetId = document.getElementById('targetId').value;
    
    if (!roundId || !evaluatorId || !targetId) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (evaluatorId === targetId) {
        alert('Evaluator and target cannot be the same person');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/assignments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `round_id=${roundId}&evaluator_id=${evaluatorId}&target_id=${targetId}`
        });
        
        if (response.ok) {
            alert('Assignment created successfully!');
            const form = document.getElementById('createAssignmentForm');
            form.classList.remove('show');
            setTimeout(() => {
                form.classList.add('hidden');
                document.getElementById('assignmentForm').reset();
                loadAssignments();
            }, 300);
        } else {
            alert('Failed to create assignment');
        }
    } catch (error) {
        alert('Error creating assignment');
    }
}

async function deleteAssignment(assignId, evaluatorName, targetName) {
    if (!confirm(`Are you sure you want to delete assignment:\n${evaluatorName} → ${targetName}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/assignments/${assignId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Assignment deleted successfully!');
            loadAssignments();
        } else {
            alert('Failed to delete assignment');
        }
    } catch (error) {
        alert('Error deleting assignment');
    }
}