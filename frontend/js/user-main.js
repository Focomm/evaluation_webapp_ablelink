// User Dashboard JavaScript Functions

const API_BASE = '/api';
let currentUser = null;

// Initialize user dashboard
function initUserDashboard() {
    const urlParams = new URLSearchParams(window.location.search);
    const userName = urlParams.get('name') || localStorage.getItem('userName') || 'User';
    const userId = urlParams.get('id') || localStorage.getItem('userId');
    
    if (!userId) {
        window.location.href = '/';
        return;
    }
    
    currentUser = { id: userId, name: userName };
    document.getElementById('userName').textContent = userName;
    
    loadUserAssignments();
}

// Load user's assignments
async function loadUserAssignments() {
    try {
        const response = await fetch(`${API_BASE}/user/${currentUser.id}/assignments`);
        const assignments = await response.json();
        
        const pending = assignments.filter(a => !a.is_completed);
        const completed = assignments.filter(a => a.is_completed);
        
        populateTargetDropdown(pending);
        displayCompletedEvaluations(completed);
    } catch (error) {
        console.error('Error loading assignments:', error);
        document.getElementById('targetDropdown').innerHTML = '<option value="">Error loading targets</option>';
        document.getElementById('completedList').innerHTML = '<p class="error">Error loading assignments</p>';
    }
}

// Populate target dropdown
function populateTargetDropdown(assignments) {
    const dropdown = document.getElementById('targetDropdown');
    
    if (assignments.length === 0) {
        dropdown.innerHTML = '<option value="">No targets available</option>';
        return;
    }
    
    const options = ['<option value="">Select target to evaluate</option>'];
    assignments.forEach(assignment => {
        options.push(`<option value="${assignment.assign_id}" data-target="${assignment.target_name}">${assignment.target_name}</option>`);
    });
    
    dropdown.innerHTML = options.join('');
    
    // Store assignments data for later use
    window.pendingAssignments = assignments;
}

// Display completed evaluations
function displayCompletedEvaluations(assignments) {
    const container = document.getElementById('completedList');
    
    if (assignments.length === 0) {
        container.innerHTML = '<p>No completed evaluations</p>';
        return;
    }
    
    const html = assignments.map(assignment => `
        <div class="evaluation-card completed">
            <h4>Evaluated: ${assignment.target_name} (${assignment.target_code})</h4>
            <p><strong>Round:</strong> ${assignment.round_name}</p>
            <p><strong>Completed:</strong> ✓</p>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Handle dropdown selection
function handleTargetSelection() {
    const dropdown = document.getElementById('targetDropdown');
    const startBtn = document.getElementById('startEvalBtn');
    
    if (dropdown.value) {
        startBtn.disabled = false;
    } else {
        startBtn.disabled = true;
    }
}

// Start evaluation for selected target
function startSelectedEvaluation() {
    const dropdown = document.getElementById('targetDropdown');
    const assignId = dropdown.value;
    const targetName = dropdown.options[dropdown.selectedIndex].dataset.target;
    
    if (assignId) {
        startEvaluation(assignId, targetName);
    }
}

// Start evaluation process
async function startEvaluation(assignId, targetName) {
    try {
        const response = await fetch(`${API_BASE}/evaluation/${assignId}/questions`);
        const questions = await response.json();
        
        if (questions.length === 0) {
            alert('No questions available for this evaluation.');
            return;
        }
        
        showEvaluationForm(assignId, targetName, questions);
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Error loading evaluation questions.');
    }
}

// Show evaluation form
function showEvaluationForm(assignId, targetName, questions) {
    const formHtml = `
        <div class="evaluation-form-overlay">
            <div class="evaluation-form">
                <h3>Evaluate: ${targetName}</h3>
                <form id="evaluationForm">
                    ${questions.map(q => `
                        <div class="question-group">
                            <label>${q.question_text}</label>
                            <div class="rating-group">
                                ${[1,2,3,4,5].map(rating => `
                                    <label class="rating-label">
                                        <input type="radio" name="q_${q.question_id}" value="${rating}" required>
                                        <span>${rating}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                    <div class="form-buttons">
                        <button type="button" onclick="submitEvaluation(${assignId})">Submit Evaluation</button>
                        <button type="button" onclick="closeEvaluationForm()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', formHtml);
}

// Submit evaluation
async function submitEvaluation(assignId) {
    const form = document.getElementById('evaluationForm');
    const formData = new FormData(form);
    
    // เช็คว่าตอบครบทุกคำถามหรือไม่
    const radioGroups = form.querySelectorAll('input[type="radio"]');
    const questionNames = [...new Set([...radioGroups].map(radio => radio.name))];
    
    for (let questionName of questionNames) {
        const isAnswered = form.querySelector(`input[name="${questionName}"]:checked`);
        if (!isAnswered) {
            alert('Please answer all questions before submitting.');
            return;
        }
    }
    
    // Collect answers in the required format
    const answers = [];
    for (let [key, value] of formData.entries()) {
        if (key.startsWith('q_')) {
            const questionId = parseInt(key.replace('q_', ''));
            answers.push({
                question_id: questionId,
                score: parseInt(value)
            });
        }
    }
    
    try {
        const response = await fetch(`${API_BASE}/evaluation/${assignId}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `answers=${encodeURIComponent(JSON.stringify(answers))}`
        });
        
        if (response.ok) {
            alert('Evaluation submitted successfully!');
            closeEvaluationForm();
            // Reset dropdown and refresh data
            document.getElementById('targetDropdown').value = '';
            document.getElementById('startEvalBtn').disabled = true;
            loadUserAssignments(); // Refresh the list
        } else {
            const error = await response.json();
            alert(`Error: ${error.detail || 'Failed to submit evaluation'}`);
        }
    } catch (error) {
        console.error('Error submitting evaluation:', error);
        alert('Error submitting evaluation.');
    }
}

// Close evaluation form
function closeEvaluationForm() {
    const overlay = document.querySelector('.evaluation-form-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Logout function
function logout() {
    localStorage.clear();
    window.location.href = '/';
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initUserDashboard);