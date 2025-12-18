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
                <div class="user-item">
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
                        <button class="edit-btn" onclick="editUser(${u.user_id}, '${u.emp_code}', '${u.full_name}', ${u.role_id}, '${u.team_name}')">
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
    
    const form = document.getElementById('createUserForm');
    form.classList.remove('hidden');
    setTimeout(() => {
        form.classList.add('show');
    }, 10);
}

function cancelCreateUser() {
    const form = document.getElementById('createUserForm');
    form.classList.remove('show');
    setTimeout(() => {
        form.classList.add('hidden');
        document.getElementById('userForm').reset();
    }, 300);
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

function editUser(userId, empCode, fullName, roleId, teamName) {
    // ซ่อนฟอร์มอื่นๆ
    document.querySelectorAll('.form-container').forEach(form => {
        form.classList.remove('show');
        form.classList.add('hidden');
    });
    
    // หา user item ที่คลิก
    const userItem = event.target.closest('.user-item');
    
    // ใส่ข้อมูลในฟอร์ม
    document.getElementById('editUserId').value = userId;
    document.getElementById('editEmpCode').value = empCode;
    document.getElementById('editFullName').value = fullName;
    document.getElementById('editRoleId').value = roleId;
    document.getElementById('editTeamName').value = teamName;
    
    // ย้ายฟอร์มไปใต้ item ที่คลิก
    const form = document.getElementById('editUserForm');
    form.classList.remove('hidden');
    userItem.parentNode.insertBefore(form, userItem.nextSibling);
    
    // แสดงฟอร์มด้วย animation
    setTimeout(() => {
        form.classList.add('show');
    }, 10);
}

function cancelEditUser() {
    const form = document.getElementById('editUserForm');
    form.classList.remove('show');
    setTimeout(() => {
        form.classList.add('hidden');
    }, 300);
}

async function updateUser() {
    const userId = document.getElementById('editUserId').value;
    const empCode = document.getElementById('editEmpCode').value;
    const fullName = document.getElementById('editFullName').value;
    const roleId = document.getElementById('editRoleId').value;
    const teamName = document.getElementById('editTeamName').value;
    
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
            const form = document.getElementById('editUserForm');
            form.classList.remove('show');
            setTimeout(() => {
                form.classList.add('hidden');
                loadUsers();
            }, 300);
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