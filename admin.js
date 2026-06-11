// Firebase init
var firebaseConfig = {
    apiKey: "AIzaSyBWdDBd6B4HyeTyTOvGr7u3JW5zstN-4O4",
    authDomain: "funtime-skupka.firebaseapp.com",
    databaseURL: "https://funtime-skupka-default-rtdb.firebaseio.com",
    projectId: "funtime-skupka",
    storageBucket: "funtime-skupka.firebasestorage.app",
    messagingSenderId: "658134903965",
    appId: "1:658134903965:web:3337f4e241909f5862f874",
    measurementId: "G-WL413JJBJE"
};
firebase.initializeApp(firebaseConfig);
var db = firebase.database();

document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    initAdminNavigation();
    initThemeToggle();
    loadSubmissions();
    initMobileSidebar();
    initServerFilter();
    initChat();
});

let currentFilter = 'all';
let currentChatId = null;
let chatPollInterval = null;

function initAdminNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = {
        dashboard: document.getElementById('dashboardSection'),
        submissions: document.getElementById('submissionsSection'),
        completed: document.getElementById('completedSection'),
        rejected: document.getElementById('rejectedSection'),
        chats: document.getElementById('chatsSection')
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            Object.values(sections).forEach(sec => sec.classList.remove('active'));
            sections[section].classList.add('active');

            document.getElementById('pageTitle').textContent = item.querySelector('span:last-child').textContent;

            if (section === 'chats') {
                loadChatList();
                startChatPoll();
            } else {
                stopChatPoll();
            }
        });
    });
}

function startChatPoll() {
    stopChatPoll();
    chatPollInterval = setInterval(() => {
        loadChatList();
        if (currentChatId) openChat(currentChatId);
    }, 3000);
}

function stopChatPoll() {
    if (chatPollInterval) {
        clearInterval(chatPollInterval);
        chatPollInterval = null;
    }
}

function initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    const icon = document.getElementById('themeIcon');
    const html = document.documentElement;

    const savedTheme = localStorage.getItem('ft_theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    toggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('ft_theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        icon.setAttribute('data-lucide', theme === 'dark' ? 'moon' : 'sun');
        lucide.createIcons();
    }
}

function initMobileSidebar() {
    const btn = document.getElementById('mobileSidebarBtn');
    const sidebar = document.querySelector('.sidebar');

    btn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !btn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
}

function initServerFilter() {
    const filter = document.getElementById('serverFilter');
    filter.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        loadSubmissions();
    });
}

function loadSubmissions() {
    const submissions = JSON.parse(localStorage.getItem('ft_submissions') || '[]');
    
    let filtered = submissions;
    if (currentFilter !== 'all') {
        filtered = submissions.filter(s => s.server === currentFilter);
    }

    const pending = filtered.filter(s => s.status === 'pending');
    const completed = filtered.filter(s => s.status === 'completed');
    const rejected = filtered.filter(s => s.status === 'rejected');

    document.getElementById('pendingCount').textContent = submissions.filter(s => s.status === 'pending').length;
    document.getElementById('completedCount').textContent = submissions.filter(s => s.status === 'completed').length;
    document.getElementById('rejectedCount').textContent = submissions.filter(s => s.status === 'rejected').length;
    document.getElementById('pendingBadge').textContent = submissions.filter(s => s.status === 'pending').length;

    const totalRevenue = submissions.filter(s => s.status === 'completed').reduce((sum, s) => sum + (parseInt(s.level) * 10 || 0), 0);
    document.getElementById('totalRevenue').textContent = totalRevenue + ' \u20BD';

    renderSubmissions('pendingSubmissions', pending, 'pending');
    renderSubmissions('completedSubmissions', completed, 'completed');
    renderSubmissions('rejectedSubmissions', rejected, 'rejected');
    renderSubmissions('recentSubmissions', submissions.slice(-5).reverse(), 'recent');
}

function renderSubmissions(containerId, submissions, type) {
    const container = document.getElementById(containerId);
    
    if (submissions.length === 0) {
        container.innerHTML = '<div class="empty-state"><i data-lucide="inbox" style="width:48px;height:48px;margin-bottom:16px;opacity:0.5;"></i><p>Нет заявок</p></div>';
        lucide.createIcons({ nodes: [container] });
        return;
    }

    container.innerHTML = submissions.map(sub => {
        const isChat = sub.description && sub.description.startsWith('[Чат]');
        return `
        <div class="submission-card" data-id="${sub.id}">
            <div class="submission-info">
                <h4>${isChat ? '💬 Чат' : escapeHtml(sub.nickname)}</h4>
                <div class="submission-meta">
                    ${isChat 
                        ? `<span><i data-lucide="message-circle" style="width:14px;height:14px;"></i> ${escapeHtml(sub.description.replace('[Чат] ',''))}</span>`
                        : `<span><i data-lucide="user" style="width:14px;height:14px;"></i> ${escapeHtml(sub.nickname)}</span>
                           <span><i data-lucide="server" style="width:14px;height:14px;"></i> ${escapeHtml(sub.server || 'N/A')}</span>
                           <span><i data-lucide="crown" style="width:14px;height:14px;"></i> ${escapeHtml(sub.privilege || 'N/A')}</span>
                           <span><i data-lucide="message-circle" style="width:14px;height:14px;"></i> ${escapeHtml(sub.contact)}</span>`
                    }
                    <span><i data-lucide="calendar" style="width:14px;height:14px;"></i> ${formatDate(sub.date)}</span>
                    ${type !== 'recent' ? `<span class="status-badge ${sub.status}">${getStatusText(sub.status)}</span>` : ''}
                </div>
            </div>
            <div class="submission-price">${isChat ? 'Чат' : 'По запросу'}</div>
            <div class="submission-actions">
                <button class="btn btn-secondary btn-sm btn-view" onclick="viewDetails(${sub.id})">
                    <i data-lucide="eye" style="width:16px;height:16px;"></i> Подробнее
                </button>
                ${type === 'pending' ? `
                    <button class="btn btn-success btn-sm" onclick="approveSubmission(${sub.id})">
                        <i data-lucide="check" style="width:16px;height:16px;"></i> Одобрить
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="rejectSubmission(${sub.id})">
                        <i data-lucide="x" style="width:16px;height:16px;"></i> Отклонить
                    </button>
                ` : ''}
            </div>
        </div>
    `}).join('');

    lucide.createIcons({ nodes: [container] });
}

function viewDetails(id) {
    const submissions = JSON.parse(localStorage.getItem('ft_submissions') || '[]');
    const sub = submissions.find(s => s.id === id);
    
    if (!sub) return;

    const isChat = sub.description && sub.description.startsWith('[Чат]');
    const content = document.getElementById('detailsContent');
    content.innerHTML = isChat ? `
        <div class="detail-row">
            <span class="detail-label"><i data-lucide="message-circle" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>Тип</span>
            <span class="detail-value">Сообщение из чата</span>
        </div>
        <div class="detail-row">
            <span class="detail-label"><i data-lucide="user" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>Отправитель</span>
            <span class="detail-value">${escapeHtml(sub.nickname)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label"><i data-lucide="mail" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>Email</span>
            <span class="detail-value">${escapeHtml(sub.contact) || 'Не указан'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label"><i data-lucide="message-square-text" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>Сообщение</span>
            <span class="detail-value">${escapeHtml(sub.description.replace('[Чат] ',''))}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label"><i data-lucide="calendar" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>Дата</span>
            <span class="detail-value">${formatDate(sub.date)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label"><i data-lucide="flag" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>Статус</span>
            <span class="status-badge ${sub.status}">${getStatusText(sub.status)}</span>
        </div>
    ` : `
        <div class="detail-row">
            <span class="detail-label"><i data-lucide="user" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>Никнейм</span>
            <span class="detail-value">${escapeHtml(sub.nickname)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label"><i data-lucide="key-round" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>Пароль</span>
            <span class="detail-value password-field">${escapeHtml(sub.password) || 'Не указан'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label"><i data-lucide="server" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>Сервер</span>
            <span class="detail-value">${escapeHtml(sub.server) || 'Не указан'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label"><i data-lucide="crown" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>Привилегия</span>
            <span class="detail-value">${escapeHtml(sub.privilege) || 'Не указана'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label"><i data-lucide="message-circle" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>Контакт</span>
            <span class="detail-value">${escapeHtml(sub.contact)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label"><i data-lucide="message-square-text" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>Описание</span>
            <span class="detail-value">${escapeHtml(sub.description) || 'Не указано'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label"><i data-lucide="calendar" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>Дата</span>
            <span class="detail-value">${formatDate(sub.date)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label"><i data-lucide="flag" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>Статус</span>
            <span class="status-badge ${sub.status}">${getStatusText(sub.status)}</span>
        </div>
    `;

    lucide.createIcons({ nodes: [content] });

    const actions = document.getElementById('detailsActions');
    if (sub.status === 'pending') {
        actions.innerHTML = `
            <button class="btn btn-success" onclick="approveSubmission(${sub.id}); closeDetailsModal();">
                <i data-lucide="check" style="width:16px;height:16px;"></i> Одобрить
            </button>
            <button class="btn btn-danger" onclick="rejectSubmission(${sub.id}); closeDetailsModal();">
                <i data-lucide="x" style="width:16px;height:16px;"></i> Отклонить
            </button>
        `;
    } else {
        actions.innerHTML = '';
    }

    lucide.createIcons({ nodes: [actions] });
    document.getElementById('detailsModal').classList.add('active');
}

function closeDetailsModal() {
    document.getElementById('detailsModal').classList.remove('active');
}

function approveSubmission(id) {
    updateSubmissionStatus(id, 'completed');
    loadSubmissions();
}

function rejectSubmission(id) {
    updateSubmissionStatus(id, 'rejected');
    loadSubmissions();
}

function updateSubmissionStatus(id, status) {
    let submissions = JSON.parse(localStorage.getItem('ft_submissions') || '[]');
    submissions = submissions.map(s => {
        if (s.id === id) {
            return { ...s, status };
        }
        return s;
    });
    localStorage.setItem('ft_submissions', JSON.stringify(submissions));
}

function getStatusText(status) {
    const statuses = {
        pending: 'Ожидает',
        completed: 'Выполнено',
        rejected: 'Отклонено'
    };
    return statuses[status] || status;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Firebase chat
let allChatMsgs = [];
let chatListeners = {};

function initChat() {
    const chatInput = document.getElementById('chatInput');
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendAdminMessage();
        }
    });
    loadChatList();
}

function getChatId(u1, u2) {
    return [u1, u2].sort().join('_');
}

function loadChatList() {
    db.ref('messages').once('value', function(snap) {
        const chatUsers = {};
        snap.forEach(function(chatSnap) {
            chatSnap.forEach(function(child) {
                const msg = child.val();
                const userKey = msg.sender === 'admin' ? msg.receiver : msg.sender;
                if (!userKey || userKey === 'admin') return;
                if (!chatUsers[userKey]) {
                    chatUsers[userKey] = {
                        name: userKey,
                        lastMessage: msg.text,
                        lastTime: msg.time,
                        unread: 0
                    };
                } else {
                    chatUsers[userKey].lastMessage = msg.text;
                    chatUsers[userKey].lastTime = msg.time;
                }
                if (msg.sender !== 'admin') {
                    chatUsers[userKey].unread++;
                }
            });
        });

        const chatList = document.getElementById('chatList');
        const chatBadge = document.getElementById('chatBadge');
        const chatCountLabel = document.getElementById('chatCountLabel');
        const totalUnread = Object.values(chatUsers).reduce((sum, u) => sum + u.unread, 0);

        chatBadge.textContent = totalUnread;
        chatBadge.style.display = totalUnread > 0 ? 'block' : 'none';
        chatCountLabel.textContent = Object.keys(chatUsers).length + ' диалогов';

        if (Object.keys(chatUsers).length === 0) {
            chatList.innerHTML = '<div class="empty-state"><i data-lucide="message-circle" style="width:48px;height:48px;margin-bottom:16px;opacity:0.5;"></i><p>Нет сообщений</p></div>';
            lucide.createIcons({ nodes: [chatList] });
            return;
        }

        chatList.innerHTML = Object.values(chatUsers).map(user => {
            const initials = user.name.substring(0, 2).toUpperCase();
            return `
            <div class="chat-list-item ${currentChatId === user.name ? 'active' : ''}" onclick="openChat('${escapeHtml(user.name)}')">
                <div class="chat-list-avatar">${escapeHtml(initials)}</div>
                <div class="chat-list-info">
                    <div class="chat-list-name">${escapeHtml(user.name)}</div>
                    <div class="chat-list-preview">${escapeHtml(user.lastMessage.substring(0, 30))}${user.lastMessage.length > 30 ? '...' : ''}</div>
                </div>
                <div style="text-align:right;">
                    <div class="chat-list-time">${formatChatTime(user.lastTime)}</div>
                    ${user.unread > 0 ? '<div class="chat-list-unread"></div>' : ''}
                </div>
            </div>
        `}).join('');
    });
}

function openChat(userId) {
    currentChatId = userId;

    document.getElementById('chatUserName').textContent = userId;
    document.getElementById('chatUserStatus').textContent = 'в сети';
    document.getElementById('chatAvatar').textContent = userId.substring(0, 2).toUpperCase();
    document.getElementById('chatInputArea').style.display = 'block';
    document.getElementById('deleteChatBtn').style.display = 'flex';

    const container = document.getElementById('chatMessages');
    const chatId = getChatId(userId, 'admin');

    // Remove old listener
    if (chatListener) db.ref('messages/' + chatId).off('value', chatListener);

    chatListener = db.ref('messages/' + chatId).orderByChild('time').on('value', function(snap) {
        if (!snap.exists()) {
            container.innerHTML = '<div class="chat-empty"><i data-lucide="message-square" style="width:64px;height:64px;margin-bottom:16px;opacity:0.3;"></i><p>Начните диалог</p></div>';
            lucide.createIcons({ nodes: [container] });
            return;
        }
        container.innerHTML = '';
        snap.forEach(function(child) {
            const msg = child.val();
            const isAdmin = msg.sender === 'admin';
            const div = document.createElement('div');
            div.className = `chat-msg ${isAdmin ? 'chat-msg-admin' : 'chat-msg-user'}`;
            div.innerHTML = `${escapeHtml(msg.text)}<div class="chat-msg-time">${formatChatTime(msg.time)}</div>`;
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    });

    document.getElementById('chatList').querySelectorAll('.chat-list-item').forEach(item => {
        item.classList.remove('active');
    });
    const items = document.getElementById('chatList').querySelectorAll('.chat-list-item');
    items.forEach(item => {
        if (item.textContent.includes(userId)) item.classList.add('active');
    });
}

let chatListener = null;

function sendAdminMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text || !currentChatId) return;

    const chatId = getChatId(currentChatId, 'admin');
    db.ref('messages/' + chatId).push({
        sender: 'admin',
        receiver: currentChatId,
        text: text,
        time: new Date().toISOString()
    });

    input.value = '';
    loadChatList();
}

function deleteChat() {
    if (!currentChatId) return;
    if (!confirm(`Удалить диалог с ${currentChatId}?`)) return;

    const chatId = getChatId(currentChatId, 'admin');
    db.ref('messages/' + chatId).remove();

    if (chatListener) db.ref('messages/' + chatId).off('value', chatListener);
    chatListener = null;

    currentChatId = null;
    document.getElementById('chatUserName').textContent = 'Выберите диалог';
    document.getElementById('chatUserStatus').textContent = 'автономный';
    document.getElementById('chatAvatar').textContent = '?';
    document.getElementById('chatInputArea').style.display = 'none';
    document.getElementById('deleteChatBtn').style.display = 'none';
    document.getElementById('chatMessages').innerHTML = '<div class="chat-empty"><i data-lucide="message-square" style="width:64px;height:64px;margin-bottom:16px;opacity:0.3;"></i><p>Выберите диалог для начала общения</p></div>';
    lucide.createIcons({ nodes: [document.getElementById('chatMessages')] });
    loadChatList();
}

function formatChatTime(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000) {
        return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}
