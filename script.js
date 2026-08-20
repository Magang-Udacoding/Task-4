const WEATHER_API_KEY = '4cfa5964b175b7638e53fa3c7020d6bf';

let todos = JSON.parse(localStorage.getItem('todos')) || [];
let savedCity = localStorage.getItem('weather_city') || 'Jakarta';
let currentFilter = 'all';
let dragSrcIndex = null;

const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const filterBtns = document.querySelectorAll('.filter-btn');

const weatherForm = document.getElementById('weather-form');
const weatherCityInput = document.getElementById('weather-city-input');
const weatherCity = document.getElementById('weather-city');
const weatherDesc = document.getElementById('weather-desc');
const weatherTemp = document.getElementById('weather-temp');
const weatherIcon = document.getElementById('weather-icon');

async function fetchWeather(city) {
  if (!city.trim()) return;

  weatherDesc.textContent = `Mencari data cuaca ${city}...`;
  weatherTemp.textContent = '--°C';
  weatherIcon.style.display = 'none';

  const encodedCity = encodeURIComponent(city.trim());
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&units=metric&lang=id&appid=${WEATHER_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Kota tidak ditemukan');
      }
      throw new Error(`Status: ${response.status}`);
    }

    const data = await response.json();
    const temp = Math.round(data.main.temp);
    const desc = data.weather[0].description;
    const iconCode = data.weather[0].icon;
    const cityName = `${data.name}, ${data.sys.country}`;

    weatherCity.textContent = cityName;
    weatherDesc.textContent = desc;
    weatherTemp.textContent = `${temp}°C`;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherIcon.style.display = 'inline-block';

    localStorage.setItem('weather_city', data.name);
  } catch (error) {
    console.error('Weather Fetch Error:', error);
    weatherCity.textContent = city;
    weatherDesc.textContent = error.message === 'Kota tidak ditemukan' ? 'Kota tidak ditemukan' : 'Gagal memuat cuaca';
    weatherTemp.textContent = '--°C';
    weatherIcon.style.display = 'none';
  }
}

weatherForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const searchCity = weatherCityInput.value.trim();
  if (searchCity) {
    fetchWeather(searchCity);
    weatherCityInput.value = '';
  }
});

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
  const todoItem = todoList.querySelector(`[data-id="${id}"]`);
  if (todoItem) {
    todoItem.style.transition = "all 0.4s ease";
    todoItem.style.opacity = "0";
    todoItem.style.transform = "translateX(50px) scale(0.8)";
    todoItem.style.marginBottom = "0";

    setTimeout(() => {
      todos = todos.filter(todo => todo.id !== id);
      saveTodos();
      renderTodos();
    }, 400);
  }
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
      
    todos = newIndices.map(index => todos[index]);
    saveTodos();
    renderTodos();
    dragSrcIndex = null;
  });
}

fetchWeather(savedCity);
renderTodos();