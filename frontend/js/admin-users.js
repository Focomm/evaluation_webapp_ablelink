// Users Management Functions
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/users`);
        const users = await response.json();
        
        const usersList = document.getElementById('usersList');
        
        if (users.length === 0) {
            usersList.innerHTML = '<p style="color: #666; font-style: italic;">No users found</p>';
        } else {
            usersList.innerHTML = users.map(u => `
                <div class="user-item" data-user-id="${u.user_id}">
                    <div class="user-content">
                        <div class="user-header">
                            <div class="user-name">${u.full_name}</div>
                            <div class="user-code">${u.emp_code}</div>
                        </div>
                        <div class="user-details">
                            <span class="user-role">Role: ${getRoleName(u.role_id)}</span>
                            <span class="user-team">Team: ${u.team_name}</span>
                        </div>
                    </div>
                    <div class="user-actions">
                        <button class="edit-btn" onclick="toggleEditUser(this, ${u.user_id}, '${u.emp_code}', '${u.full_name}', ${u.role_id}, '${u.team_name}')">
                            Edit
                        </button>
                        <button class="delete-btn" onclick="deleteUser(${u.user_id}, '${u.full_name}')">
                            Delete
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load users:', error);
        document.getElementById('usersList').innerHTML = '<p style="color: #e74c3c;">Failed to load users</p>';
    }
}

function getRoleName(roleId) {
    const roles = {1: 'Employee', 2: 'Manager', 3: 'Senior Manager', 4: 'Admin'};
    return roles[roleId] || 'Unknown';
}

function showCreateUser() {
    // ซ่อนฟอร์มอื่นๆ
    document.querySelectorAll('.form-container').forEach(form => {
        form.classList.remove('show');
        form.classList.add('hidden');
    });
    
    // รีเซ็ต editing state
    document.querySelectorAll('.user-item').forEach(item => {
        item.removeAttribute('data-editing');
    });
    
    const form = document.getElementById('createUserForm');
    if (form) {
        form.classList.remove('hidden');
        setTimeout(() => {
            form.classList.add('show');
        }, 10);
    }
}

function cancelCreateUser() {
    const form = document.getElementById('createUserForm');
    if (form) {
        form.classList.remove('show');
        setTimeout(() => {
            form.classList.add('hidden');
            const userForm = document.getElementById('userForm');
            if (userForm) userForm.reset();
        }, 300);
    }
}

async function createUser() {
    const empCode = document.getElementById('empCode').value;
    const fullName = document.getElementById('fullName').value;
    const roleId = document.getElementById('roleId').value;
    const teamName = document.getElementById('teamName').value;
    
    if (!empCode || !fullName || !roleId || !teamName) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `emp_code=${encodeURIComponent(empCode)}&full_name=${encodeURIComponent(fullName)}&role_id=${roleId}&team_name=${encodeURIComponent(teamName)}`
        });
        
        if (response.ok) {
            alert('User created successfully!');
            cancelCreateUser();
            loadUsers();
        } else {
            alert('Failed to create user');
        }
    } catch (error) {
        alert('Error creating user');
    }
}

function toggleEditUser(buttonElement, userId, empCode, fullName, roleId, teamName) {
    const userItem = buttonElement.closest('.user-item');
    const form = document.getElementById('editUserForm');
    
    if (!form || !userItem) {
        console.error('Form or user item not found');
        return;
    }
    
    // ถ้า user item นี้กำลังแก้ไขอยู่ ให้ปิด
    if (userItem.hasAttribute('data-editing')) {
        cancelEditUser();
        return;
    }
    
    // ซ่อนฟอร์มอื่นๆ และรีเซ็ต editing state
    document.querySelectorAll('.form-container').forEach(f => {
        f.classList.remove('show');
        f.classList.add('hidden');
    });
    document.querySelectorAll('.user-item').forEach(item => {
        item.removeAttribute('data-editing');
    });
    
    // ตั้งค่า editing state
    userItem.setAttribute('data-editing', 'true');
    
    // ใส่ข้อมูลในฟอร์ม
    const editUserId = document.getElementById('editUserId');
    const editEmpCode = document.getElementById('editEmpCode');
    const editFullName = document.getElementById('editFullName');
    const editRoleId = document.getElementById('editRoleId');
    const editTeamName = document.getElementById('editTeamName');
    
    if (editUserId) editUserId.value = userId;
    if (editEmpCode) editEmpCode.value = empCode;
    if (editFullName) editFullName.value = fullName;
    if (editRoleId) editRoleId.value = roleId;
    if (editTeamName) editTeamName.value = teamName;
    
    // ย้ายฟอร์มไปใต้ item ที่คลิก
    form.classList.remove('hidden');
    userItem.parentNode.insertBefore(form, userItem.nextSibling);
    
    // แสดงฟอร์มด้วย animation
    setTimeout(() => {
        form.classList.add('show');
    }, 10);
}

function cancelEditUser() {
    const form = document.getElementById('editUserForm');
    
    if (form) {
        form.classList.remove('show');
        
        // รีเซ็ต editing state
        document.querySelectorAll('.user-item').forEach(item => {
            item.removeAttribute('data-editing');
        });
        
        setTimeout(() => {
            form.classList.add('hidden');
            // ย้ายฟอร์มกลับที่เดิม
            const panelContent = document.querySelector('#users .panel-content');
            if (panelContent && form.parentNode !== panelContent) {
                panelContent.appendChild(form);
            }
            // รีเซ็ตฟอร์ม
            const editForm = document.getElementById('editUserFormData');
            if (editForm) editForm.reset();
        }, 300);
    }
}

async function updateUser() {
    const userIdEl = document.getElementById('editUserId');
    const empCodeEl = document.getElementById('editEmpCode');
    const fullNameEl = document.getElementById('editFullName');
    const roleIdEl = document.getElementById('editRoleId');
    const teamNameEl = document.getElementById('editTeamName');
    
    if (!userIdEl || !empCodeEl || !fullNameEl || !roleIdEl || !teamNameEl) {
        alert('Form elements not found');
        return;
    }
    
    const userId = userIdEl.value;
    const empCode = empCodeEl.value;
    const fullName = fullNameEl.value;
    const roleId = roleIdEl.value;
    const teamName = teamNameEl.value;
    
    if (!empCode || !fullName || !roleId || !teamName) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `emp_code=${encodeURIComponent(empCode)}&full_name=${encodeURIComponent(fullName)}&role_id=${roleId}&team_name=${encodeURIComponent(teamName)}`
        });
        
        if (response.ok) {
            alert('User updated successfully!');
            // ย้ายฟอร์มกลับที่เดิมก่อน reload
            const form = document.getElementById('editUserForm');
            const panelContent = document.querySelector('#users .panel-content');
            if (form && panelContent && form.parentNode !== panelContent) {
                panelContent.appendChild(form);
            }
            cancelEditUser();
            loadUsers();
        } else {
            alert('Failed to update user');
        }
    } catch (error) {
        alert('Error updating user');
    }
}

async function deleteUser(userId, fullName) {
    if (!confirm(`Are you sure you want to delete user "${fullName}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('User deleted successfully!');
            loadUsers();
        } else {
            alert('Failed to delete user');
        }
    } catch (error) {
        alert('Error deleting user');
    }
}