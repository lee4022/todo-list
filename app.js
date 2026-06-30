import { supabase } from './supabase-client.js'
import { login, register, logout } from './auth.js'

// ── DOM: 인증 ─────────────────────────────────────────
const authSection    = document.getElementById('authSection')
const authEmail      = document.getElementById('authEmail')
const authPassword   = document.getElementById('authPassword')
const authSubmitBtn  = document.getElementById('authSubmitBtn')
const authToggleBtn  = document.getElementById('authToggleBtn')
const authError      = document.getElementById('authError')
const authTitle      = document.getElementById('authTitle')
const authSubtitle   = document.getElementById('authSubtitle')

// ── DOM: 앱 ───────────────────────────────────────────
const appContainer    = document.getElementById('appContainer')
const userEmailEl     = document.getElementById('userEmail')
const logoutBtn       = document.getElementById('logoutBtn')

const groupTabsEl     = document.getElementById('groupTabs')
const groupSelect     = document.getElementById('groupSelect')
const addGroupBtn     = document.getElementById('addGroupBtn')
const groupAddForm    = document.getElementById('groupAddForm')
const groupNameInput  = document.getElementById('groupNameInput')
const confirmGroupBtn = document.getElementById('confirmGroupBtn')
const cancelGroupBtn  = document.getElementById('cancelGroupBtn')

const todoInput         = document.getElementById('todoInput')
const addBtn            = document.getElementById('addBtn')
const descToggleBtn     = document.getElementById('descToggleBtn')
const descInput         = document.getElementById('descInput')
const todoList          = document.getElementById('todoList')
const emptyState        = document.getElementById('emptyState')
const allCount          = document.getElementById('allCount')
const activeCount       = document.getElementById('activeCount')
const completedCount    = document.getElementById('completedCount')
const tabs              = document.querySelectorAll('.tab')
const todoFooter        = document.getElementById('todoFooter')
const remainingText     = document.getElementById('remainingText')
const clearCompletedBtn = document.getElementById('clearCompletedBtn')

// ── 상태 ─────────────────────────────────────────────
const GROUP_COLORS = ['#667eea', '#e05252', '#52b788', '#f4a261', '#9b72cf', '#4ecdc4', '#e8a838']

let groups          = []
let todos           = []
let currentGroup    = 'all'
let currentFilter   = 'all'
let realtimeChannel = null
let isLoginMode     = true

// ── 매핑 헬퍼 ────────────────────────────────────────
function mapGroup(row) {
  return { id: row.id, name: row.name, color: row.color, isDefault: row.is_default }
}

function mapTodo(row) {
  return {
    id:          row.id,
    text:        row.text,
    description: row.description || '',
    groupId:     row.group_id,
    completed:   row.completed,
    createdAt:   row.created_at,
    completedAt: row.completed_at
  }
}

// ── 데이터 로딩 ──────────────────────────────────────
async function loadData() {
  const [{ data: gData, error: gErr }, { data: tData, error: tErr }] = await Promise.all([
    supabase.from('groups').select('*').order('created_at'),
    supabase.from('todos').select('*').order('created_at')
  ])
  if (gErr || tErr) { console.error(gErr || tErr); return }
  groups = (gData || []).map(mapGroup)
  todos  = (tData || []).map(mapTodo)
}

// ── Realtime ─────────────────────────────────────────
function setupRealtime() {
  realtimeChannel = supabase
    .channel('db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' },  handleTodoChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, handleGroupChange)
    .subscribe()
}

function teardownRealtime() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }
}

function handleTodoChange({ eventType, new: n, old: o }) {
  if (eventType === 'INSERT') {
    if (!todos.find(t => t.id === n.id)) todos.push(mapTodo(n))
  } else if (eventType === 'UPDATE') {
    todos = todos.map(t => t.id === n.id ? mapTodo(n) : t)
  } else if (eventType === 'DELETE') {
    todos = todos.filter(t => t.id !== o.id)
  }
  render()
}

function handleGroupChange({ eventType, new: n, old: o }) {
  if (eventType === 'INSERT') {
    if (!groups.find(g => g.id === n.id)) groups.push(mapGroup(n))
  } else if (eventType === 'UPDATE') {
    groups = groups.map(g => g.id === n.id ? mapGroup(n) : g)
  } else if (eventType === 'DELETE') {
    groups = groups.filter(g => g.id !== o.id)
    if (currentGroup === o.id) currentGroup = 'all'
  }
  renderGroupTabs()
  renderGroupSelect()
  render()
}

// ── 화면 전환 ─────────────────────────────────────────
function showApp(user) {
  userEmailEl.textContent    = user.email
  authSection.style.display  = 'none'
  appContainer.style.display = ''
}

function showAuth() {
  authSection.style.display  = 'flex'
  appContainer.style.display = 'none'
  groups        = []
  todos         = []
  currentGroup  = 'all'
  currentFilter = 'all'
  teardownRealtime()
  tabs.forEach(t => t.classList.remove('active'))
  document.querySelector('.tab[data-filter="all"]').classList.add('active')
}

// ── 인증 UI ───────────────────────────────────────────
function setAuthMode(isLogin) {
  isLoginMode = isLogin
  authTitle.textContent     = isLogin ? '로그인'   : '회원가입'
  authSubtitle.textContent  = isLogin ? 'TODO List에 오신 것을 환영합니다' : '새 계정을 만들어보세요'
  authSubmitBtn.textContent = isLogin ? '로그인'   : '회원가입'
  authToggleBtn.textContent = isLogin
    ? '계정이 없으신가요? 회원가입'
    : '이미 계정이 있으신가요? 로그인'
  authError.textContent = ''
  authError.style.color = '#e05252'
}

authSubmitBtn.addEventListener('click', async () => {
  const email    = authEmail.value.trim()
  const password = authPassword.value
  authError.textContent = ''

  if (!email || !password) {
    authError.textContent = '이메일과 비밀번호를 입력해주세요.'
    return
  }

  authSubmitBtn.disabled = true
  try {
    if (isLoginMode) {
      await login(email, password)
    } else {
      await register(email, password)
      authError.style.color = '#52b788'
      authError.textContent = '가입 완료! 이메일을 확인해 인증을 마쳐주세요.'
    }
  } catch (e) {
    authError.style.color = '#e05252'
    authError.textContent = e.message || '오류가 발생했습니다.'
  } finally {
    authSubmitBtn.disabled = false
  }
})

authToggleBtn.addEventListener('click', () => setAuthMode(!isLoginMode))
authPassword.addEventListener('keydown', e => { if (e.key === 'Enter') authSubmitBtn.click() })

logoutBtn.addEventListener('click', async () => { await logout() })

// ── 그룹 렌더 ─────────────────────────────────────────
function renderGroupSelect() {
  groupSelect.innerHTML = groups.map(g =>
    `<option value="${g.id}">${escapeHtml(g.name)}</option>`
  ).join('')
}

function renderGroupTabs() {
  const hasUser = groups.some(g => !g.isDefault)
  if (!hasUser) currentGroup = 'all'

  const allActive = currentGroup === 'all'
  const allBtn = hasUser
    ? `<button class="group-tab${allActive ? ' active' : ''}" data-group="all">전체</button>`
    : ''

  const buttons = groups.map(g => {
    const isActive = currentGroup === g.id
    return `<button class="group-tab${isActive ? ' active' : ''}" data-group="${g.id}" style="--g-color:${g.color}">
      <span class="group-dot"></span>${escapeHtml(g.name)}
      ${!g.isDefault
        ? `<span class="group-del" data-group="${g.id}" title="그룹 삭제">×</span>`
        : ''}
    </button>`
  }).join('')

  groupTabsEl.innerHTML = allBtn + buttons

  groupTabsEl.querySelectorAll('.group-tab').forEach(btn => {
    btn.addEventListener('click', e => {
      if (e.target.classList.contains('group-del')) return
      currentGroup = btn.dataset.group
      renderGroupTabs()
      render()
    })
  })
  groupTabsEl.querySelectorAll('.group-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      deleteGroup(btn.dataset.group)
    })
  })
}

// ── 그룹 CRUD ────────────────────────────────────────
async function addGroup(name) {
  const color = GROUP_COLORS[groups.filter(g => !g.isDefault).length % GROUP_COLORS.length]
  const { data, error } = await supabase
    .from('groups')
    .insert({ name, color, is_default: false })
    .select()
    .single()
  if (error) { console.error(error); return }
  groups.push(mapGroup(data))
  renderGroupTabs()
  renderGroupSelect()
}

async function deleteGroup(id) {
  const def = groups.find(g => g.isDefault)
  if (!def) return

  await supabase.from('todos').update({ group_id: def.id }).eq('group_id', id)
  const { error } = await supabase.from('groups').delete().eq('id', id)
  if (error) { console.error(error); return }

  todos  = todos.map(t => t.groupId === id ? { ...t, groupId: def.id } : t)
  groups = groups.filter(g => g.id !== id)
  if (currentGroup === id) currentGroup = 'all'
  renderGroupTabs()
  renderGroupSelect()
  render()
}

// ── 할 일 CRUD ────────────────────────────────────────
function formatDate(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

async function addTodo() {
  const text = todoInput.value.trim()
  if (!text) { todoInput.focus(); return }

  const description = descInput.value.trim()
  const groupId     = groupSelect.value
  const createdAt   = formatDate(new Date())

  const { data, error } = await supabase
    .from('todos')
    .insert({ text, description, group_id: groupId, completed: false, created_at: createdAt })
    .select()
    .single()
  if (error) { console.error(error); return }

  todos.push(mapTodo(data))
  todoInput.value           = ''
  descInput.value           = ''
  descInput.style.display   = 'none'
  descToggleBtn.textContent = '+ 설명'
  descToggleBtn.classList.remove('active')
  todoInput.focus()
  render()
}

async function toggleTodo(id) {
  const todo = todos.find(t => t.id === id)
  if (!todo) return

  const completed   = !todo.completed
  const completedAt = completed ? formatDate(new Date()) : null

  const { error } = await supabase
    .from('todos')
    .update({ completed, completed_at: completedAt })
    .eq('id', id)
  if (error) { console.error(error); return }

  todos = todos.map(t => t.id === id ? { ...t, completed, completedAt } : t)
  render()
}

async function deleteTodo(id) {
  const { error } = await supabase.from('todos').delete().eq('id', id)
  if (error) { console.error(error); return }
  todos = todos.filter(t => t.id !== id)
  render()
}

async function clearCompleted() {
  const ids = todos.filter(t => t.completed).map(t => t.id)
  if (!ids.length) return
  const { error } = await supabase.from('todos').delete().in('id', ids)
  if (error) { console.error(error); return }
  todos = todos.filter(t => !t.completed)
  render()
}

// ── 렌더 ─────────────────────────────────────────────
function escapeHtml(str) {
  const div = document.createElement('div')
  div.appendChild(document.createTextNode(str))
  return div.innerHTML
}

function getFiltered() {
  let result = currentGroup === 'all' ? todos : todos.filter(t => t.groupId === currentGroup)
  if (currentFilter === 'active')    return result.filter(t => !t.completed)
  if (currentFilter === 'completed') return result.filter(t =>  t.completed)
  return result
}

function render() {
  const filtered  = getFiltered()
  const grouped   = currentGroup === 'all' ? todos : todos.filter(t => t.groupId === currentGroup)
  const remaining = grouped.filter(t => !t.completed).length
  const doneCount = grouped.filter(t =>  t.completed).length

  allCount.textContent       = grouped.length
  activeCount.textContent    = remaining
  completedCount.textContent = doneCount

  if (todos.length > 0) {
    todoFooter.style.display        = 'flex'
    remainingText.textContent       = `${remaining}개 남음`
    clearCompletedBtn.style.display = doneCount > 0 ? 'block' : 'none'
  } else {
    todoFooter.style.display = 'none'
  }

  if (filtered.length === 0) {
    todoList.innerHTML       = ''
    emptyState.style.display = 'flex'
    return
  }

  emptyState.style.display = 'none'
  todoList.innerHTML = filtered.map(todo => {
    const g = groups.find(g => g.id === todo.groupId)
    return `
      <li class="todo-item${todo.completed ? ' completed' : ''}" data-id="${todo.id}">
        <label class="checkbox-wrapper">
          <input type="checkbox" ${todo.completed ? 'checked' : ''}>
          <span class="checkmark"></span>
        </label>
        <div class="todo-body">
          <div class="todo-main">
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            ${g ? `<span class="group-badge" style="background:${g.color}">${escapeHtml(g.name)}</span>` : ''}
          </div>
          <span class="created-at">생성 ${todo.createdAt}</span>
          ${todo.completed && todo.completedAt
            ? `<span class="completed-at">완료 ${todo.completedAt}</span>`
            : ''}
          ${todo.description
            ? `<details class="todo-desc"><summary>설명 보기</summary><p class="desc-content">${escapeHtml(todo.description)}</p></details>`
            : ''}
        </div>
        <button class="delete-btn" title="삭제">✕</button>
      </li>
    `
  }).join('')

  todoList.querySelectorAll('.todo-item').forEach(item => {
    const id = Number(item.dataset.id)
    item.querySelector('input[type="checkbox"]').addEventListener('change', () => toggleTodo(id))
    item.querySelector('.delete-btn').addEventListener('click', () => deleteTodo(id))
  })
}

// ── 이벤트 리스너 ────────────────────────────────────
addGroupBtn.addEventListener('click', () => {
  groupAddForm.classList.toggle('open')
  if (groupAddForm.classList.contains('open')) groupNameInput.focus()
})

confirmGroupBtn.addEventListener('click', () => {
  const name = groupNameInput.value.trim()
  if (!name) return
  addGroup(name)
  groupNameInput.value = ''
  groupAddForm.classList.remove('open')
})

cancelGroupBtn.addEventListener('click', () => {
  groupNameInput.value = ''
  groupAddForm.classList.remove('open')
})

groupNameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter')  confirmGroupBtn.click()
  if (e.key === 'Escape') cancelGroupBtn.click()
})

descToggleBtn.addEventListener('click', () => {
  const isOpen = descInput.style.display === 'block'
  descInput.style.display   = isOpen ? 'none' : 'block'
  descToggleBtn.textContent = isOpen ? '+ 설명' : '- 설명'
  descToggleBtn.classList.toggle('active', !isOpen)
  if (!isOpen) descInput.focus()
})

clearCompletedBtn.addEventListener('click', clearCompleted)
addBtn.addEventListener('click', addTodo)
todoInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTodo() })

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'))
    tab.classList.add('active')
    currentFilter = tab.dataset.filter
    render()
  })
})

// ── 초기화: 인증 상태 감지 ────────────────────────────
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session) {
    await loadData()
    showApp(session.user)
    renderGroupTabs()
    renderGroupSelect()
    render()
    setupRealtime()
  } else {
    showAuth()
  }
})
