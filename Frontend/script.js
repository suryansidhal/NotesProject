let notes = [];


const pinnedGrid = document.getElementById('pinnedGrid');
const othersGrid = document.getElementById('othersGrid');
const pinnedSection = document.getElementById('pinnedSection');
const othersSection = document.getElementById('othersSection');
const searchInput = document.getElementById('searchInput');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const fabBtn = document.getElementById('fabBtn');
const addNoteModal = document.getElementById('addNoteModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const noteTitleInput = document.getElementById('noteTitle');
const noteContentInput = document.getElementById('noteContent');
const authModal = document.getElementById('authModal');
const loginBtn = document.getElementById('loginBtn');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const userAvatar = document.querySelector('.user-avatar');
const emptyState = document.getElementById('emptyState');
const emptyCreateBtn = document.getElementById('emptyCreateBtn');

let isDarkMode = false;
let searchQuery = '';

function createNoteHTML(note) {
    const pinClass = note.pinned ? 'fa-solid fa-thumbtack pinned' : 'fa-solid fa-thumbtack';
    
    return `
        <div class="note-card ${note.colorClass}">
            <div class="note-header">
                <h3>${note.title}</h3>
                <button class="pin-btn ${note.pinned ? 'pinned' : ''}" onclick="togglePin(${note.id})">
                    <i class="${pinClass}"></i>
                </button>
            </div>
            <p class="note-content">${note.content}</p>
            <div class="note-footer">
                <span class="note-date">${note.date}</span>
                <button class="delete-btn" onclick="deleteNote(${note.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

async function loadNotes() {
    const token = localStorage.getItem('token');

    if (!token) {
        renderNotes();
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/notes', {
            method: 'GET',
            headers: {
                'Authorization': token
            }
        });

        const data = await response.json();

        if (response.ok) {
            notes = data.notes.map((note, index) => ({
                id: note._id,
                title: note.title,
                content: note.content,
                date: 'Today',
                pinned: false,
                colorClass: `color-${index % 5}`
            }));

            renderNotes();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error(error);
        alert('Error loading notes');
    }
}

function renderNotes() {
   
    const filteredNotes = notes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pinnedNotes = filteredNotes.filter(n => n.pinned);
    const otherNotes = filteredNotes.filter(n => !n.pinned);

    if (filteredNotes.length === 0 && localStorage.getItem('token')) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }

    if (pinnedNotes.length > 0) {
        pinnedSection.style.display = 'block';
        pinnedGrid.innerHTML = pinnedNotes.map(createNoteHTML).join('');
    } else {
        pinnedSection.style.display = 'none';
    }

    if (otherNotes.length > 0) {
        othersSection.style.display = 'block';
        othersGrid.innerHTML = otherNotes.map(createNoteHTML).join('');
    } else {
        othersSection.style.display = 'none';
    }
}

window.togglePin = function(id) {
    notes = notes.map(note => 
        note.id === id ? { ...note, pinned: !note.pinned } : note
    );
    renderNotes();
};

window.deleteNote = function(id) {
    notes = notes.filter(note => note.id !== id);
    renderNotes();
};

function saveNote() {
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();

    if (!title && !content) return;

    const randomColorClass = `color-${Math.floor(Math.random() * 5)}`;
    
    const newNote = {
        id: Date.now(),
        title: title || 'Untitled Note',
        content: content,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pinned: false,
        colorClass: randomColorClass
    };

    notes.unshift(newNote); 
    
    noteTitleInput.value = '';
    noteContentInput.value = '';
    addNoteModal.classList.add('hidden');
    fabBtn.style.display = 'block';
    
    renderNotes();
}

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderNotes();
});

themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode');
    
    if (isDarkMode) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
});

fabBtn.addEventListener('click', () => {
    addNoteModal.classList.remove('hidden');
    fabBtn.style.display = 'none';
    noteTitleInput.focus();
});

closeModalBtn.addEventListener('click', () => {
    addNoteModal.classList.add('hidden');
    fabBtn.style.display = 'block';
});

saveNoteBtn.addEventListener('click', saveNote);

noteContentInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        saveNote();
    }
});

loadNotes();

userAvatar.addEventListener('click', () => {
    authModal.classList.remove('hidden');
});

loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    try {
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            alert('Login successful');
            authModal.classList.add('hidden');
            loadNotes();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error(error);
        alert('Error connecting to server');
    }
});