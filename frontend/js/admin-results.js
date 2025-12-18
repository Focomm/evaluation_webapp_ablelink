// Results management functions

let currentRounds = [];

async function loadResults() {
    try {
        // Load rounds first
        const roundsResponse = await fetch(`${API_BASE}/rounds`);
        if (roundsResponse.ok) {
            currentRounds = await roundsResponse.json();
            displayResultsInterface();
        } else {
            document.getElementById('resultsList').innerHTML = '<p>Failed to load rounds</p>';
        }
    } catch (error) {
        console.error('Error loading results:', error);
        document.getElementById('resultsList').innerHTML = '<p>Error loading results</p>';
    }
}

function displayResultsInterface() {
    const resultsContainer = document.getElementById('resultsList');
    
    if (currentRounds.length === 0) {
        resultsContainer.innerHTML = '<p>No evaluation rounds found</p>';
        return;
    }

    let html = `
        <div class="results-interface">
            <div class="form-group">
                <label for="roundSelect">Select Evaluation Round:</label>
                <select id="roundSelect" onchange="loadRoundTargets()">
                    <option value="">Choose a round...</option>
    `;

    currentRounds.forEach(round => {
        html += `<option value="${round.round_id}">${round.round_name} (${round.start_date} - ${round.end_date})</option>`;
    });

    html += `
                </select>
            </div>
            <div id="targetsContainer" class="hidden">
                <h3>Evaluation Targets</h3>
                <div id="targetsList"></div>
            </div>
        </div>
    `;

    resultsContainer.innerHTML = html;
}

async function loadRoundTargets() {
    const roundId = document.getElementById('roundSelect').value;
    const targetsContainer = document.getElementById('targetsContainer');
    const targetsList = document.getElementById('targetsList');

    if (!roundId) {
        targetsContainer.classList.add('hidden');
        return;
    }

    try {
        targetsList.innerHTML = '<p>Loading targets...</p>';
        targetsContainer.classList.remove('hidden');

        const response = await fetch(`${API_BASE}/rounds/${roundId}/targets`);
        if (response.ok) {
            const targets = await response.json();
            displayTargets(targets, roundId);
        } else {
            targetsList.innerHTML = '<p>Failed to load targets</p>';
        }
    } catch (error) {
        console.error('Error loading targets:', error);
        targetsList.innerHTML = '<p>Error loading targets</p>';
    }
}

function displayTargets(targets, roundId) {
    const targetsList = document.getElementById('targetsList');

    if (targets.length === 0) {
        targetsList.innerHTML = '<p>No evaluation targets found for this round</p>';
        return;
    }

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Full Name</th>
                    <th>Manager (40%)</th>
                    <th>Same Team (30%)</th>
                    <th>Different Team (30%)</th>
                    <th class="actions-column">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    targets.forEach(target => {
        html += `
            <tr>
                <td>${target.full_name}</td>
                <td>
                    <div class="score-circle" id="manager-${target.user_id}">
                        <svg width="40" height="40">
                            <circle cx="20" cy="20" r="15" class="circle-bg"></circle>
                            <circle cx="20" cy="20" r="15" class="circle-progress" stroke-dasharray="0 94"></circle>
                            <text x="20" y="25" class="circle-text">-</text>
                        </svg>
                    </div>
                </td>
                <td>
                    <div class="score-circle" id="same-team-${target.user_id}">
                        <svg width="40" height="40">
                            <circle cx="20" cy="20" r="15" class="circle-bg"></circle>
                            <circle cx="20" cy="20" r="15" class="circle-progress" stroke-dasharray="0 94"></circle>
                            <text x="20" y="25" class="circle-text">-</text>
                        </svg>
                    </div>
                </td>
                <td>
                    <div class="score-circle" id="diff-team-${target.user_id}">
                        <svg width="40" height="40">
                            <circle cx="20" cy="20" r="15" class="circle-bg"></circle>
                            <circle cx="20" cy="20" r="15" class="circle-progress" stroke-dasharray="0 94"></circle>
                            <text x="20" y="25" class="circle-text">-</text>
                        </svg>
                    </div>
                </td>
                <td class="actions-column">
                    <button onclick="viewDetailedResults(${roundId}, ${target.user_id})" 
                            class="btn-small" 
                            ${target.completed_evaluations === 0 ? 'disabled' : ''}>
                        Details
                    </button>
                </td>
            </tr>
        `;
    });
    
    // โหลดคะแนนทั้ง 3 ประเภทสำหรับแต่ละคน
    targets.forEach(target => {
        loadManagerScore(roundId, target.user_id);
        loadSameTeamScore(roundId, target.user_id);
        loadDifferentTeamScore(roundId, target.user_id);
    });

    html += `
            </tbody>
        </table>
    `;

    targetsList.innerHTML = html;
}

async function loadManagerScore(roundId, targetId) {
    try {
        const response = await fetch(`${API_BASE}/rounds/${roundId}/targets/${targetId}/manager-score`);
        if (response.ok) {
            const data = await response.json();
            updateScoreCircle(`manager-${targetId}`, data.score, data.count);
        }
    } catch (error) {
        console.error('Error loading manager score:', error);
    }
}

async function loadSameTeamScore(roundId, targetId) {
    try {
        const response = await fetch(`${API_BASE}/rounds/${roundId}/targets/${targetId}/same-team-score`);
        if (response.ok) {
            const data = await response.json();
            updateScoreCircle(`same-team-${targetId}`, data.score, data.count);
        }
    } catch (error) {
        console.error('Error loading same team score:', error);
    }
}

async function loadDifferentTeamScore(roundId, targetId) {
    try {
        const response = await fetch(`${API_BASE}/rounds/${roundId}/targets/${targetId}/different-team-score`);
        if (response.ok) {
            const data = await response.json();
            updateScoreCircle(`diff-team-${targetId}`, data.score, data.count);
        }
    } catch (error) {
        console.error('Error loading different team score:', error);
    }
}

function updateScoreCircle(circleId, score, count) {
    const circle = document.getElementById(circleId);
    if (!circle) return;
    
    const progressCircle = circle.querySelector('.circle-progress');
    const textElement = circle.querySelector('.circle-text');
    
    if (score !== null && count > 0) {
        // คำนวณเปอร์เซ็นต์ (0-100%) จากคะแนน (0-5)
        const percentage = (score / 5) * 100;
        const circumference = 2 * Math.PI * 15; // r=15
        const strokeDasharray = (percentage / 100) * circumference;
        
        progressCircle.setAttribute('stroke-dasharray', `${strokeDasharray} ${circumference}`);
        textElement.textContent = score.toFixed(1);
    } else {
        // ไม่มีข้อมูล
        progressCircle.setAttribute('stroke-dasharray', '0 94');
        textElement.textContent = '-';
    }
}

async function viewDetailedResults(roundId, targetId) {
    // This will be implemented later for detailed results view
    alert(`View detailed results for Round ${roundId}, Target ${targetId}\n(Feature coming soon)`);
}