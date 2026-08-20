let todos = JSON.parse(localStorage.getItem('todos')) || [];
let currentFilter = 'all';
let dragSrcIndex = null;

const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const filterBtns = document.querySelectorAll('.filter-btn');

function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

function formatDate(dateString) {
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderTodos() {
  todoList.innerHTML = '';

  const filteredTodos = todos.filter(todo => {
    if (currentFilter === 'active') return !todo.completed;
    if (currentFilter === 'completed') return todo.completed;
    return true;
  });

  if (filteredTodos.length === 0) {
    todoList.innerHTML = `<li class="empty-msg">Tidak ada tugas dalam kategori ini.</li>`;
    return;
  }

  filteredTodos.forEach((todo) => {

    const originalIndex = todos.findIndex(t => t.id === todo.id);
    
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    li.setAttribute('draggable', 'true');
    li.dataset.index = originalIndex;
    li.dataset.id = todo.id;

    li.innerHTML = `
      <div class="todo-left">
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-action="toggle" data-id="${todo.id}">
        <div class="todo-content">
          <span class="todo-text" data-action="edit" data-id="${todo.id}">${escapeHtml(todo.text)}</span>
          <span class="todo-date">${formatDate(todo.date)}</span>
        </div>
      </div>
      <button class="delete-btn" data-action="delete" data-id="${todo.id}">&times;</button>
    `;

    addDragEvents(li);
    todoList.appendChild(li);
  });
}

function addTodo(text) {
  if (!text.trim()) return;
  const newTodo = {
    id: Date.now(),
    text: text.trim(),
    completed: false,
    date: new Date().toISOString()
  };
  todos.unshift(newTodo);
  saveTodos();
  renderTodos();
}

function toggleTodo(id) {
  todos = todos.map(todo => 
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
  saveTodos();
  renderTodos();
}

function editTodoText(id, spanElement) {
  const currentText = spanElement.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'edit-input';
  input.value = currentText;

  spanElement.replaceWith(input);
  input.focus();

  const saveEdit = () => {
    const updatedText = input.value.trim();
    if (updatedText && updatedText !== currentText) {
      todos = todos.map(t => t.id === id ? { ...t, text: updatedText } : t);
      saveTodos();
    }
    renderTodos();
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') renderTodos();
  });
  input.addEventListener('blur', saveEdit);
}

function deleteTodo(id) {
  todos = todos.filter(todo => todo.id !== id);
  saveTodos();
  renderTodos();
}

todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addTodo(todoInput.value);
    todoInput.value = '';
  }
});

todoList.addEventListener('click', (e) => {
  const target = e.target;
  const action = target.dataset.action;
  const id = Number(target.dataset.id);

  if (action === 'toggle') {
    toggleTodo(id);
  } else if (action === 'delete') {
    deleteTodo(id);
  }
});

todoList.addEventListener('dblclick', (e) => {
  if (e.target.dataset.action === 'edit') {
    const id = Number(e.target.dataset.id);
    editTodoText(id, e.target);
  }
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.filter-btn.active').classList.remove('active');
    btn.classList.add('active');
    
    currentFilter = btn.dataset.filter;
    renderTodos();
  });
});

function addDragEvents(item) {
  item.addEventListener('dragstart', (e) => {
    dragSrcIndex = Number(item.dataset.index);
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  item.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
 
    const draggingItem = todoList.querySelector('.dragging');
    const siblings = [...todoList.querySelectorAll('.todo-item:not(.dragging)')];
    
    let nextSibling = siblings.find(sibling => {
      return e.clientY <= sibling.offsetTop + sibling.offsetHeight / 2;
    });
    
    todoList.insertBefore(draggingItem, nextSibling);
  });

  item.addEventListener('drop', (e) => {
    e.preventDefault();
  });

  item.addEventListener('dragend', () => {
    item.classList.remove('dragging');
    
    const newIndices = [...todoList.querySelectorAll('.todo-item')]
      .map(li => Number(li.dataset.index));
      
    const reorderedTodos = newIndices.map(index => todos[index]);
    
    todos = reorderedTodos;
    saveTodos();
    renderTodos();
    dragSrcIndex = null;
  });
}

renderTodos();