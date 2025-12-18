// Main Admin Functions
const API_BASE = 'http://localhost:8001/api';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const userName = urlParams.get('name') || localStorage.getItem('userName') || 'Admin';
    document.getElementById('adminName').textContent = userName;
    
    // Load data when page loads
    loadUsers();
    loadQuestions();
    loadRounds();
    loadAssignments();
});

// Tab Management
function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab-panel');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    tabBtns.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    // Load data when switching to specific tabs
    if (tabName === 'results') {
        loadResults();
    }
}

function logout() {
    localStorage.clear();
    window.location.href = '/';
}