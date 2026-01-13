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
                    <button onclick="printResults(${roundId}, ${target.user_id}, '${target.full_name}')" 
                            class="btn-small btn-print" 
                            ${target.completed_evaluations === 0 ? 'disabled' : ''}>
                        Print
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

async function printResults(roundId, targetId, targetName) {
    try {
        // โหลดข้อมูลคะแนนทั้ง 3 ประเภท และข้อมูล user
        const [managerData, sameTeamData, diffTeamData, questionScores, userResponse] = await Promise.all([
            fetch(`${API_BASE}/rounds/${roundId}/targets/${targetId}/manager-score`).then(r => r.json()),
            fetch(`${API_BASE}/rounds/${roundId}/targets/${targetId}/same-team-score`).then(r => r.json()),
            fetch(`${API_BASE}/rounds/${roundId}/targets/${targetId}/different-team-score`).then(r => r.json()),
            fetch(`${API_BASE}/rounds/${roundId}/targets/${targetId}/question-scores`).then(r => r.json()),
            fetch(`${API_BASE}/users`).then(r => r.json())
        ]);

        const targetUser = userResponse.find(u => u.user_id === targetId);
        const empCode = targetUser ? targetUser.emp_code : 'N/A';

        generatePrintDocument(roundId, targetId, targetName, empCode, {
            manager: managerData,
            sameTeam: sameTeamData,
            diffTeam: diffTeamData,
            questions: questionScores
        });
    } catch (error) {
        console.error('Error loading print data:', error);
        alert('Failed to load print data');
    }
}

function generatePrintDocument(roundId, targetId, targetName, empCode, data) {
    const managerScore = data.manager.score || 0;
    const sameTeamScore = data.sameTeam.score || 0;
    const diffTeamScore = data.diffTeam.score || 0;
    const totalScore = managerScore + sameTeamScore + diffTeamScore;
    
    const roundName = currentRounds.find(r => r.round_id == roundId)?.round_name || `Round ${roundId}`;
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Evaluation Results - ${targetName}</title>
            <style>
                @page { margin: 75px 20px 20px 20px; }
                body { font-family: Arial, sans-serif; margin: 0; }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { margin: 0; color: #333; }
                .header h2 { margin: 5px 0; color: #666; }
                .total-score { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .total-score h3 { margin: 0 0 15px 0; text-align: center; }
                .score-breakdown { display: flex; justify-content: space-around; margin: 15px 0; }
                .score-item { text-align: center; padding: 10px; }
                .score-value { font-size: 24px; font-weight: bold; color: #667eea; }
                .questions-section { margin-top: 30px; }
                .questions-section h3 { border-bottom: 2px solid #667eea; padding-bottom: 5px; }
                .question-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; margin-bottom: 5px; }
                .question-text { flex: 1; margin-right: 30px; }
                .question-score { font-weight: bold; }
                .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
                .signature-section { margin-top: 60px; padding: 20px 0; }
                .signature-header { font-weight: bold; margin-bottom: 20px; }
                .signature-line { border-bottom: 1px solid #333; width: 300px; margin: 40px auto 10px auto; }
                .signature-label { text-align: center; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Employee Evaluation Results</h1>
                <h2>${targetName}</h2>
                <p>${roundName}</p>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="total-score">
                <h3>Total Score: ${totalScore.toFixed(1)}/100</h3>
                <div class="score-breakdown">
                    <div class="score-item">
                        <div class="score-value">${managerScore.toFixed(1)}</div>
                        <div>Manager (40%)</div>
                    </div>
                    <div class="score-item">
                        <div class="score-value">${sameTeamScore.toFixed(1)}</div>
                        <div>Same Team (30%)</div>
                    </div>
                    <div class="score-item">
                        <div class="score-value">${diffTeamScore.toFixed(1)}</div>
                        <div>Different Team (30%)</div>
                    </div>
                </div>
            </div>
            
            <div class="questions-section">
                <h3>Average Score by Question</h3>
                ${data.questions.map((q, index) => `
                    <div class="question-item">
                        <div class="question-text">${index + 1}. ${q.question_text}</div>
                        <div class="question-score">${q.avg_score ? q.avg_score.toFixed(1) : 'N/A'}/5</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="signature-section">
                <div class="signature-header">ผู้รับการประเมินรับทราบ</div>
                <div class="signature-line"></div>
                <div class="signature-label">ลายเซ็น / วันที่</div>
            </div>
            
            <div class="footer">
                <p>Employee Code: ${empCode} | Employee Evaluation System - Generated by Admin</p>
            </div>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}