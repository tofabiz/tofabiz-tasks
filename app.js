// ===== State Management =====
let tasks = [];
let editingTaskId = null;

// ===== DOM Elements =====
const elements = {
    addTaskBtn: document.getElementById('addTaskBtn'),
    taskModal: document.getElementById('taskModal'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalClose: document.getElementById('modalClose'),
    taskForm: document.getElementById('taskForm'),
    modalTitle: document.getElementById('modalTitle'),
    cancelBtn: document.getElementById('cancelBtn'),
    tasksTableBody: document.getElementById('tasksTableBody'),
    emptyState: document.getElementById('emptyState'),
    totalTasks: document.getElementById('totalTasks'),
    inProgressTasks: document.getElementById('inProgressTasks'),
    completedTasks: document.getElementById('completedTasks'),
    taskName: document.getElementById('taskName'),
    taskAssignee: document.getElementById('taskAssignee'),
    taskMeetingDate: document.getElementById('taskMeetingDate'),
    taskDeadline: document.getElementById('taskDeadline'),
    taskPriority: document.getElementById('taskPriority'),
    taskStatus: document.getElementById('taskStatus')
};

// ===== Initialize App =====
function init() {
    loadTasksFromStorage();
    renderTasks();
    updateStats();
    attachEventListeners();
}

// ===== Event Listeners =====
function attachEventListeners() {
    elements.addTaskBtn.addEventListener('click', openAddTaskModal);
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalOverlay.addEventListener('click', closeModal);
    elements.cancelBtn.addEventListener('click', closeModal);
    elements.taskForm.addEventListener('submit', handleFormSubmit);
}

// ===== Modal Functions =====
function openAddTaskModal() {
    editingTaskId = null;
    elements.modalTitle.textContent = '새 업무 등록';
    elements.taskForm.reset();
    elements.taskModal.classList.add('show');
}

function openEditTaskModal(taskId) {
    editingTaskId = taskId;
    const task = tasks.find(t => t.id === taskId);

    if (task) {
        elements.modalTitle.textContent = '업무 수정';
        elements.taskName.value = task.name;
        elements.taskAssignee.value = task.assignee;
        elements.taskMeetingDate.value = task.meetingDate || '';
        elements.taskDeadline.value = task.deadline || '';
        elements.taskPriority.value = task.priority;
        elements.taskStatus.value = task.status;
        elements.taskModal.classList.add('show');
    }
}

function closeModal() {
    elements.taskModal.classList.remove('show');
    elements.taskForm.reset();
    editingTaskId = null;
}

// ===== Form Handling =====
function handleFormSubmit(e) {
    e.preventDefault();

    const taskData = {
        name: elements.taskName.value.trim(),
        assignee: elements.taskAssignee.value.trim(),
        meetingDate: elements.taskMeetingDate.value,
        deadline: elements.taskDeadline.value,
        priority: elements.taskPriority.value,
        status: elements.taskStatus.value
    };

    if (editingTaskId) {
        updateTask(editingTaskId, taskData);
    } else {
        addTask(taskData);
    }

    closeModal();
}

// ===== Task CRUD Operations =====
function addTask(taskData) {
    const newTask = {
        id: generateId(),
        ...taskData,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    saveTasksToStorage();
    renderTasks();
    updateStats();
    showNotification('업무가 추가되었습니다', 'success');
}

function updateTask(taskId, taskData) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex !== -1) {
        tasks[taskIndex] = {
            ...tasks[taskIndex],
            ...taskData,
            updatedAt: new Date().toISOString()
        };

        saveTasksToStorage();
        renderTasks();
        updateStats();
        showNotification('업무가 수정되었습니다', 'success');
    }
}

function deleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);

    if (task && confirm(`"${task.name}" 업무를 삭제하시겠습니까?`)) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasksToStorage();
        renderTasks();
        updateStats();
        showNotification('업무가 삭제되었습니다', 'success');
    }
}

// ===== Utility Functions =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getPriorityClass(priority) {
    const map = {
        '높음': 'high',
        '중간': 'medium',
        '낮음': 'low'
    };
    return map[priority] || 'low';
}

function getStatusClass(status) {
    const map = {
        '진행 중': 'progress',
        '할 일': 'todo',
        '완료': 'done'
    };
    return map[status] || 'todo';
}

// 회의 날짜별 색상 클래스 할당
function getMeetingColorClass(meetingDate) {
    if (!meetingDate) {
        return 'meeting-color-none';
    }

    // 모든 업무의 고유 회의 날짜 목록 생성
    const uniqueDates = [...new Set(tasks.map(t => t.meetingDate).filter(d => d))].sort();
    const dateIndex = uniqueDates.indexOf(meetingDate);

    // 6가지 색상을 순환하여 사용
    const colorNumber = (dateIndex % 6) + 1;
    return `meeting-color-${colorNumber}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            element.textContent = end;
            clearInterval(timer);
        } else {
            element.textContent = Math.round(current);
        }
    }, 16);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
}

function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// ===== Render Functions =====
function renderTasks() {
    if (tasks.length === 0) {
        elements.tasksTableBody.innerHTML = '';
        elements.emptyState.classList.add('show');
        return;
    }

    elements.emptyState.classList.remove('show');

    elements.tasksTableBody.innerHTML = tasks.map(task => `
        <tr data-task-id="${task.id}" class="${getMeetingColorClass(task.meetingDate)}">
            <td>
                <div class="task-name">${escapeHtml(task.name)}</div>
            </td>
            <td>
                <div class="task-assignee">${escapeHtml(task.assignee)}</div>
            </td>
            <td>
                <div class="task-date">${formatDate(task.meetingDate)}</div>
            </td>
            <td>
                <div class="task-date">${formatDate(task.deadline)}</div>
            </td>
            <td>
                <span class="priority-badge priority-${getPriorityClass(task.priority)}">
                    ${task.priority}
                </span>
            </td>
            <td>
                <span class="status-badge status-${getStatusClass(task.status)}">
                    ${task.status}
                </span>
            </td>
            <td>
                <div class="task-actions">
                    <button class="action-btn btn-edit" onclick="openEditTaskModal('${task.id}')" title="수정">
                        ✏️
                    </button>
                    <button class="action-btn btn-delete" onclick="deleteTask('${task.id}')" title="삭제">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateStats() {
    const total = tasks.length;
    const inProgress = tasks.filter(t => t.status === '진행 중').length;
    const completed = tasks.filter(t => t.status === '완료').length;

    animateValue(elements.totalTasks, parseInt(elements.totalTasks.textContent) || 0, total, 500);
    animateValue(elements.inProgressTasks, parseInt(elements.inProgressTasks.textContent) || 0, inProgress, 500);
    animateValue(elements.completedTasks, parseInt(elements.completedTasks.textContent) || 0, completed, 500);
}

// ===== Local Storage =====
function saveTasksToStorage() {
    try {
        localStorage.setItem('tofabiz_tasks', JSON.stringify(tasks));
    } catch (e) {
        console.error('Failed to save tasks to localStorage:', e);
    }
}

function loadTasksFromStorage() {
    try {
        const stored = localStorage.getItem('tofabiz_tasks');
        if (stored) {
            tasks = JSON.parse(stored);
        } else {
            // Load sample data for demo
            tasks = getSampleTasks();
            saveTasksToStorage();
        }
    } catch (e) {
        console.error('Failed to load tasks from localStorage:', e);
        tasks = getSampleTasks();
    }
}

function getSampleTasks() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return [
        {
            id: generateId(),
            name: '객공팀 중순 투입 (25명)',
            assignee: 'C이사',
            meetingDate: today.toISOString().split('T')[0],
            deadline: nextWeek.toISOString().split('T')[0],
            priority: '높음',
            status: '진행 중',
            createdAt: new Date().toISOString()
        },
        {
            id: generateId(),
            name: '사랑의 병원 웹퍼 200벌',
            assignee: 'C이사',
            meetingDate: tomorrow.toISOString().split('T')[0],
            deadline: nextWeek.toISOString().split('T')[0],
            priority: '높음',
            status: '할 일',
            createdAt: new Date().toISOString()
        },
        {
            id: generateId(),
            name: '사모님 금여 처리 확인',
            assignee: '한별',
            meetingDate: '',
            deadline: tomorrow.toISOString().split('T')[0],
            priority: '중간',
            status: '할 일',
            createdAt: new Date().toISOString()
        },
        {
            id: generateId(),
            name: '○○도시 ○○공사 견적서',
            assignee: '강우',
            meetingDate: today.toISOString().split('T')[0],
            deadline: nextWeek.toISOString().split('T')[0],
            priority: '높음',
            status: '진행 중',
            createdAt: new Date().toISOString()
        }
    ];
}

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown', (e) => {
    // ESC to close modal
    if (e.key === 'Escape' && elements.taskModal.classList.contains('show')) {
        closeModal();
    }

    // Ctrl/Cmd + N to add new task
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openAddTaskModal();
    }
});

// ===== Start App =====
init();