const groupTabsEl      = document.getElementById('groupTabs');
const addGroupBtn      = document.getElementById('addGroupBtn');
const groupAddForm     = document.getElementById('groupAddForm');
const groupNameInput   = document.getElementById('groupNameInput');
const confirmGroupBtn  = document.getElementById('confirmGroupBtn');
const cancelGroupBtn   = document.getElementById('cancelGroupBtn');
const todoInput         = document.getElementById('todoInput');
const addBtn            = document.getElementById('addBtn');
const descToggleBtn     = document.getElementById('descToggleBtn');
const descInput         = document.getElementById('descInput');
const todoList          = document.getElementById('todoList');
const emptyState        = document.getElementById('emptyState');
const allCount          = document.getElementById('allCount');
const activeCount       = document.getElementById('activeCount');
const completedCount    = document.getElementById('completedCount');
const tabs              = document.querySelectorAll('.tab');
const todoFooter        = document.getElementById('todoFooter');
const remainingText     = document.getElementById('remainingText');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

const GROUP_COLORS = ['#667eea','#e05252','#52b788','#f4a261','#9b72cf','#4ecdc4','#e8a838'];
let groups = [{ id: 'default', name: '기타', color: '#aaa', isDefault: true }];
let nextGroupId = 1;
let currentGroup = 'all';

let todos = [];
let nextId = 1;
let currentFilter = 'all';

function renderGroupTabs() {
  const buttons = groups.map(g => {
    const isActive = currentGroup === g.id;
    return `<button class="group-tab${isActive ? ' active' : ''}" data-group="${g.id}" style="--g-color:${g.color}">
      <span class="group-dot"></span>${g.name}
      ${!g.isDefault ? `<span class="group-del" data-group="${g.id}" title="그룹 삭제">×</span>` : ''}
    </button>`;
  }).join('');
  const allActive = currentGroup === 'all';
  groupTabsEl.innerHTML =
    `<button class="group-tab${allActive ? ' active' : ''}" data-group="all">전체</button>` +
    buttons +
    `<button class="add-group-btn" id="addGroupBtn" title="그룹 추가">+</button>`;

  groupTabsEl.querySelectorAll('.group-tab').forEach(btn => {
    btn.addEventListener('click', e => {
      if (e.target.classList.contains('group-del')) return;
      currentGroup = btn.dataset.group;
      renderGroupTabs();
      render();
    });
  });
  groupTabsEl.querySelectorAll('.group-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      deleteGroup(btn.dataset.group);
    });
  });
  document.getElementById('addGroupBtn').addEventListener('click', () => {
    groupAddForm.classList.toggle('open');
    if (groupAddForm.classList.contains('open')) groupNameInput.focus();
  });
}

function addGroup(name) {
  const color = GROUP_COLORS[nextGroupId % GROUP_COLORS.length];
  groups.push({ id: `g${nextGroupId++}`, name, color, isDefault: false });
  renderGroupTabs();
}

function deleteGroup(id) {
  todos = todos.map(t => t.groupId === id ? { ...t, groupId: 'default' } : t);
  groups = groups.filter(g => g.id !== id);
  if (currentGroup === id) currentGroup = 'all';
  renderGroupTabs();
  render();
}

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) {
    todoInput.focus();
    return;
  }
  const description = descInput.value.trim();
  todos.push({ id: nextId++, text, description, completed: false, createdAt: formatDate(new Date()) });
  todoInput.value = '';
  descInput.value = '';
  descInput.style.display = 'none';
  descToggleBtn.textContent = '+ 설명';
  descToggleBtn.classList.remove('active');
  todoInput.focus();
  render();
}

function formatDate(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toggleTodo(id) {
  todos = todos.map(t => {
    if (t.id !== id) return t;
    const completed = !t.completed;
    return { ...t, completed, completedAt: completed ? formatDate(new Date()) : null };
  });
  render();
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  render();
}

function clearCompleted() {
  todos = todos.filter(t => !t.completed);
  render();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function getFiltered() {
  if (currentFilter === 'active')    return todos.filter(t => !t.completed);
  if (currentFilter === 'completed') return todos.filter(t => t.completed);
  return todos;
}

function render() {
  const filtered = getFiltered();

  const remaining  = todos.filter(t => !t.completed).length;
  const doneCount  = todos.filter(t => t.completed).length;

  allCount.textContent       = todos.length;
  activeCount.textContent    = remaining;
  completedCount.textContent = doneCount;

  // 푸터 업데이트
  if (todos.length > 0) {
    todoFooter.style.display = 'flex';
    remainingText.textContent = `${remaining}개 남음`;
    clearCompletedBtn.style.display = doneCount > 0 ? 'block' : 'none';
  } else {
    todoFooter.style.display = 'none';
  }

  if (filtered.length === 0) {
    todoList.innerHTML = '';
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';
  todoList.innerHTML = filtered.map(todo => `
    <li class="todo-item${todo.completed ? ' completed' : ''}" data-id="${todo.id}">
      <label class="checkbox-wrapper">
        <input type="checkbox" ${todo.completed ? 'checked' : ''}>
        <span class="checkmark"></span>
      </label>
      <div class="todo-body">
        <span class="todo-text">${escapeHtml(todo.text)}</span>
        <span class="created-at">생성 ${todo.createdAt}</span>
        ${todo.completed && todo.completedAt ? `<span class="completed-at">완료 ${todo.completedAt}</span>` : ''}
        ${todo.description ? `<details class="todo-desc"><summary>설명 보기</summary><p class="desc-content">${escapeHtml(todo.description)}</p></details>` : ''}
      </div>
      <button class="delete-btn" title="삭제">✕</button>
    </li>
  `).join('');

  todoList.querySelectorAll('.todo-item').forEach(item => {
    const id = Number(item.dataset.id);

    item.querySelector('input[type="checkbox"]').addEventListener('change', () => toggleTodo(id));
    item.querySelector('.delete-btn').addEventListener('click', () => deleteTodo(id));
  });
}

confirmGroupBtn.addEventListener('click', () => {
  const name = groupNameInput.value.trim();
  if (!name) return;
  addGroup(name);
  groupNameInput.value = '';
  groupAddForm.classList.remove('open');
});

cancelGroupBtn.addEventListener('click', () => {
  groupNameInput.value = '';
  groupAddForm.classList.remove('open');
});

groupNameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') confirmGroupBtn.click();
  if (e.key === 'Escape') cancelGroupBtn.click();
});

descToggleBtn.addEventListener('click', () => {
  const isOpen = descInput.style.display === 'block';
  descInput.style.display = isOpen ? 'none' : 'block';
  descToggleBtn.textContent = isOpen ? '+ 설명' : '- 설명';
  descToggleBtn.classList.toggle('active', !isOpen);
  if (!isOpen) descInput.focus();
});

clearCompletedBtn.addEventListener('click', clearCompleted);

addBtn.addEventListener('click', addTodo);

todoInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTodo();
});

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter = tab.dataset.filter;
    render();
  });
});

renderGroupTabs();
render();
