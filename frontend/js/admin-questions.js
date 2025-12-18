// Questions Management Functions
async function loadQuestions() {
    try {
        const response = await fetch(`${API_BASE}/questions`);
        const questions = await response.json();
        
        const questionsList = document.getElementById('questionsList');
        
        if (questions.length === 0) {
            questionsList.innerHTML = '<p style="color: #666; font-style: italic;">No questions found</p>';
        } else {
            questionsList.innerHTML = questions.map(q => `
                <div class="question-item">
                    <div class="question-content">
                        <div class="question-text">${q.question_text}</div>
                        <div class="question-order">Order: ${q.sort_order}</div>
                    </div>
                    <div class="question-actions">
                        <div class="question-status ${q.is_active ? 'active' : 'inactive'}">
                            ${q.is_active ? 'Active' : 'Inactive'}
                        </div>
                        <button class="edit-btn" onclick="toggleEditQuestion(this, ${q.question_id}, '${q.question_text.replace(/'/g, "\\'").replace(/\n/g, '\\n')}', ${q.is_active}, ${q.sort_order})">
                            Edit
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load questions:', error);
        document.getElementById('questionsList').innerHTML = '<p style="color: #e74c3c;">Failed to load questions</p>';
    }
}

function showCreateQuestion() {
    // ซ่อนฟอร์มอื่นๆ
    document.querySelectorAll('.form-container').forEach(form => {
        form.classList.remove('show');
        form.classList.add('hidden');
    });
    
    const form = document.getElementById('createQuestionForm');
    form.classList.remove('hidden');
    setTimeout(() => {
        form.classList.add('show');
    }, 10);
}

function cancelCreateQuestion() {
    const form = document.getElementById('createQuestionForm');
    form.classList.remove('show');
    setTimeout(() => {
        form.classList.add('hidden');
        document.getElementById('questionForm').reset();
    }, 300);
}

async function createQuestion() {
    const questionText = document.getElementById('questionText').value;
    const sortOrder = document.getElementById('sortOrder').value;
    const isActive = document.getElementById('isActive').checked;
    
    if (!questionText || !sortOrder) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `question_text=${encodeURIComponent(questionText)}&sort_order=${sortOrder}&is_active=${isActive}`
        });
        
        if (response.ok) {
            alert('Question created successfully!');
            cancelCreateQuestion();
            loadQuestions();
        } else {
            alert('Failed to create question');
        }
    } catch (error) {
        alert('Error creating question');
    }
}

function toggleEditQuestion(buttonElement, questionId, questionText, isActive, sortOrder) {
    const questionItem = buttonElement.closest('.question-item');
    const form = document.getElementById('editQuestionForm');
    
    if (!form || !questionItem) {
        console.error('Form or question item not found');
        return;
    }
    
    // ถ้า question item นี้กำลังแก้ไขอยู่ ให้ปิด
    if (questionItem.hasAttribute('data-editing')) {
        cancelEditQuestion();
        return;
    }
    
    // ซ่อนฟอร์มอื่นๆ และรีเซ็ต editing state
    document.querySelectorAll('.form-container').forEach(f => {
        f.classList.remove('show');
        f.classList.add('hidden');
    });
    document.querySelectorAll('.question-item').forEach(item => {
        item.removeAttribute('data-editing');
    });
    
    // ตั้งค่า editing state
    questionItem.setAttribute('data-editing', 'true');
    
    // ใส่ข้อมูลในฟอร์ม
    const editQuestionId = document.getElementById('editQuestionId');
    const editQuestionText = document.getElementById('editQuestionText');
    const editSortOrder = document.getElementById('editSortOrder');
    const editIsActive = document.getElementById('editIsActive');
    
    if (editQuestionId) editQuestionId.value = questionId;
    if (editQuestionText) editQuestionText.value = questionText;
    if (editSortOrder) editSortOrder.value = sortOrder;
    if (editIsActive) editIsActive.checked = isActive;
    
    // ย้ายฟอร์มไปใต้ item ที่คลิก
    form.classList.remove('hidden');
    questionItem.parentNode.insertBefore(form, questionItem.nextSibling);
    
    // แสดงฟอร์มด้วย animation
    setTimeout(() => {
        form.classList.add('show');
    }, 10);
}



function cancelEditQuestion() {
    const form = document.getElementById('editQuestionForm');
    
    if (form) {
        form.classList.remove('show');
        
        // รีเซ็ต editing state
        document.querySelectorAll('.question-item').forEach(item => {
            item.removeAttribute('data-editing');
        });
        
        setTimeout(() => {
            form.classList.add('hidden');
            // ย้ายฟอร์มกลับที่เดิม
            const panelContent = document.querySelector('#questions .panel-content');
            if (panelContent && form.parentNode !== panelContent) {
                panelContent.appendChild(form);
            }
            // รีเซ็ตฟอร์ม
            const editForm = document.getElementById('editForm');
            if (editForm) editForm.reset();
        }, 300);
    }
}

async function updateQuestion() {
    const questionId = document.getElementById('editQuestionId').value;
    const questionText = document.getElementById('editQuestionText').value;
    const sortOrder = document.getElementById('editSortOrder').value;
    const isActive = document.getElementById('editIsActive').checked;
    
    if (!questionText || !sortOrder) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/questions/${questionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `question_text=${encodeURIComponent(questionText)}&sort_order=${sortOrder}&is_active=${isActive}`
        });
        
        if (response.ok) {
            alert('Question updated successfully!');
            // ย้ายฟอร์มกลับที่เดิมก่อน reload
            const form = document.getElementById('editQuestionForm');
            const panelContent = document.querySelector('#questions .panel-content');
            if (form && panelContent && form.parentNode !== panelContent) {
                panelContent.appendChild(form);
            }
            cancelEditQuestion();
            loadQuestions();
        } else {
            alert('Failed to update question');
        }
    } catch (error) {
        alert('Error updating question');
    }
}