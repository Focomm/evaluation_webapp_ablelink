// Detail Results Functions

async function viewDetailedResults(roundId, targetId) {
    try {
        // โหลดข้อมูลคะแนนทั้ง 3 ประเภท
        const [managerData, sameTeamData, diffTeamData, questionScores] = await Promise.all([
            fetch(`${API_BASE}/rounds/${roundId}/targets/${targetId}/manager-score`).then(r => r.json()),
            fetch(`${API_BASE}/rounds/${roundId}/targets/${targetId}/same-team-score`).then(r => r.json()),
            fetch(`${API_BASE}/rounds/${roundId}/targets/${targetId}/different-team-score`).then(r => r.json()),
            fetch(`${API_BASE}/rounds/${roundId}/targets/${targetId}/question-scores`).then(r => r.json())
        ]);

        showDetailModal(roundId, targetId, {
            manager: managerData,
            sameTeam: sameTeamData,
            diffTeam: diffTeamData,
            questions: questionScores
        });
    } catch (error) {
        console.error('Error loading detailed results:', error);
        alert('Failed to load detailed results');
    }
}

function showDetailModal(roundId, targetId, data) {
    // รวมคะแนนตรงๆ จาก score-circle ทั้ง 3
    const managerScore = data.manager.score || 0;
    const sameTeamScore = data.sameTeam.score || 0;
    const diffTeamScore = data.diffTeam.score || 0;
    
    const totalScore = managerScore + sameTeamScore + diffTeamScore;
    
    const modalHtml = `
        <div class="detail-modal-overlay" onclick="closeDetailModal()">
            <div class="detail-modal" onclick="event.stopPropagation()">
                <div class="detail-header">
                    <h3>Evaluation Details</h3>
                    <button onclick="closeDetailModal()" class="close-btn">×</button>
                </div>
                
                <div class="detail-content">
                    <div class="total-score-section">
                        <h4>Total Score: ${totalScore.toFixed(1)}/100</h4>
                        <div class="score-breakdown">
                            <div class="score-item">
                                <span>Manager (40%): </span>
                                <span>${managerScore.toFixed(1)}</span>
                            </div>
                            <div class="score-item">
                                <span>Same Team (30%): </span>
                                <span>${sameTeamScore.toFixed(1)}</span>
                            </div>
                            <div class="score-item">
                                <span>Different Team (30%): </span>
                                <span>${diffTeamScore.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="questions-section">
                        <h4>Average Score by Question</h4>
                        <div class="questions-list">
                            ${data.questions.map(q => `
                                <div class="question-score-item">
                                    <div class="question-text">${q.question_text}</div>
                                    <div class="question-avg">${q.avg_score ? q.avg_score.toFixed(1) : 'N/A'}/5</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeDetailModal() {
    const modal = document.querySelector('.detail-modal-overlay');
    if (modal) {
        modal.remove();
    }
}