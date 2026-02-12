// Configuration
const CONFIG = {
    API_URL: 'https://n8n.descomplicador.pt/webhook/wa-dashboard-api',
    POLL_INTERVAL: 5000,
    FETCH_TIMEOUT: 15000,
    MAX_MESSAGE_LENGTH: 4096,
    MAX_POLL_FAILURES: 3
};

// State
let state = {
    apiKey: null,
    conversations: [],
    currentPhone: null,
    currentName: null,
    messages: [],
    isLoading: false,
    isSending: false,
    pollTimer: null,
    pollFailures: 0,
    currentView: 'list',
    isPaused: false,
    pausedUntil: null,
    isArchived: false,
    showArchived: false,
    botConfig: { enabled: true, schedule: [] }
};

// DOM Elements
const elements = {
    apiKeyPrompt: document.getElementById('api-key-prompt'),
    apiKeyInput: document.getElementById('api-key-input'),
    saveApiKeyBtn: document.getElementById('save-api-key'),
    loading: document.getElementById('loading'),
    toast: document.getElementById('toast'),
    listView: document.getElementById('list-view'),
    chatView: document.getElementById('chat-view'),
    conversationsContainer: document.getElementById('conversations-container'),
    messagesContainer: document.getElementById('messages-container'),
    chatName: document.getElementById('chat-name'),
    chatPhone: document.getElementById('chat-phone'),
    chatAvatar: document.getElementById('chat-avatar'),
    replyInput: document.getElementById('reply-input'),
    sendBtn: document.getElementById('send-btn'),
    backBtn: document.getElementById('back-btn'),
    refreshBtn: document.getElementById('refresh-btn'),
    connectionBanner: document.getElementById('connection-banner'),
    windowWarning: document.getElementById('window-warning'),
    takeoverBtn: document.getElementById('takeover-btn'),
    takeoverLabel: document.getElementById('takeover-label'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    settingsClose: document.getElementById('settings-close'),
    botEnabledToggle: document.getElementById('bot-enabled-toggle'),
    scheduleRules: document.getElementById('schedule-rules'),
    addScheduleRule: document.getElementById('add-schedule-rule'),
    saveSettings: document.getElementById('save-settings'),
    botStatusIndicator: document.getElementById('bot-status-indicator'),
    botStatusText: document.getElementById('bot-status-text'),
    scheduleLabel: document.getElementById('schedule-label'),
    archiveBtn: document.getElementById('archive-btn'),
    archiveLabel: document.getElementById('archive-label'),
    archiveBar: document.getElementById('archive-bar'),
    archiveToggle: document.getElementById('archive-toggle'),
    archiveToggleText: document.getElementById('archive-toggle-text')
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
    state.apiKey = localStorage.getItem('wa_dashboard_key');

    if (!state.apiKey) {
        showApiKeyPrompt();
    } else {
        loadConversations();
        startPolling();
        loadBotConfig();
    }

    // Event listeners
    elements.saveApiKeyBtn.addEventListener('click', saveApiKey);
    elements.apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveApiKey();
    });
    elements.sendBtn.addEventListener('click', handleSendReply);
    elements.replyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) handleSendReply();
    });
    elements.backBtn.addEventListener('click', () => showList());
    elements.refreshBtn.addEventListener('click', () => loadConversations());
    elements.takeoverBtn.addEventListener('click', handleTakeover);
    elements.archiveBtn.addEventListener('click', handleArchive);
    elements.archiveToggle.addEventListener('click', toggleArchiveView);
    elements.botEnabledToggle.addEventListener('change', handleBotToggle);
    elements.settingsBtn.addEventListener('click', openSettings);
    elements.settingsClose.addEventListener('click', closeSettings);
    elements.addScheduleRule.addEventListener('click', () => addScheduleRuleUI());
    elements.saveSettings.addEventListener('click', saveSettingsToAPI);

    // Pause polling when tab is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopPolling();
        } else if (state.apiKey) {
            state.pollFailures = 0;
            hideConnectionBanner();
            startPolling();
            // Refresh immediately on tab focus
            if (state.currentView === 'list') loadConversations();
            else if (state.currentPhone) loadMessages(state.currentPhone);
        }
    });

    // Handle iOS keyboard resize
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            document.documentElement.style.setProperty(
                '--viewport-height',
                window.visualViewport.height + 'px'
            );
        });
    }
}

// API Key Management
function showApiKeyPrompt() {
    elements.apiKeyPrompt.style.display = 'flex';
    elements.apiKeyInput.focus();
}

function hideApiKeyPrompt() {
    elements.apiKeyPrompt.style.display = 'none';
}

function saveApiKey() {
    const key = elements.apiKeyInput.value.trim();
    if (!key) {
        showToast('Por favor, insira uma chave de API', 'error');
        return;
    }

    state.apiKey = key;
    localStorage.setItem('wa_dashboard_key', key);
    hideApiKeyPrompt();
    loadConversations();
    startPolling();
}

function clearApiKey() {
    state.apiKey = null;
    localStorage.removeItem('wa_dashboard_key');
    stopPolling();
    showApiKeyPrompt();
}

// API Functions
async function apiCall(action, params = {}) {
    if (!state.apiKey) {
        clearApiKey();
        throw new Error('API key missing');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT);

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Dashboard-Key': state.apiKey
            },
            body: JSON.stringify({ action, ...params }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.status === 401 || response.status === 403) {
            clearApiKey();
            throw new Error('Chave de API invalida');
        }

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Tempo limite excedido');
        }
        throw error;
    }
}

async function loadConversations() {
    if (state.isLoading) return;

    state.isLoading = true;
    showLoading();

    try {
        const data = await apiCall('conversations');
        state.conversations = Array.isArray(data) ? data : (data.conversations || []);
        state.pollFailures = 0;
        hideConnectionBanner();
        renderConversations();
    } catch (error) {
        showToast(error.message || 'Erro ao carregar conversas', 'error');
    } finally {
        state.isLoading = false;
        hideLoading();
    }
}

async function loadMessages(phone) {
    if (state.isLoading) return;

    state.isLoading = true;
    showLoading();

    try {
        const data = await apiCall('messages', { phone });
        const msgs = Array.isArray(data) ? data : (data.messages || []);
        state.messages = normalizeMessages(msgs);
        renderMessages();
        scrollToBottom();
        checkWindowExpiry();
    } catch (error) {
        showToast(error.message || 'Erro ao carregar mensagens', 'error');
    } finally {
        state.isLoading = false;
        hideLoading();
    }
}

function normalizeMessages(msgs) {
    return msgs.map(m => ({
        id: m.id,
        direction: m.direction === 'in' ? 'incoming' : 'outgoing',
        type: m.is_human_reply ? 'human' : 'bot',
        message: m.message_text || m.message || '',
        timestamp: m.created_at || m.timestamp,
        intent: m.intent
    }));
}

async function sendReply(phone, message) {
    if (state.isSending) return;

    if (message.length > CONFIG.MAX_MESSAGE_LENGTH) {
        showToast(`Mensagem demasiado longa (maximo ${CONFIG.MAX_MESSAGE_LENGTH} caracteres)`, 'error');
        return;
    }

    state.isSending = true;
    elements.sendBtn.disabled = true;
    elements.replyInput.disabled = true;

    try {
        await apiCall('reply', { phone, message });

        state.messages.push({
            id: Date.now(),
            direction: 'outgoing',
            type: 'human',
            message: message,
            timestamp: new Date().toISOString()
        });
        renderMessages();
        scrollToBottom();
        elements.replyInput.value = '';
        showToast('Mensagem enviada', 'info');
    } catch (error) {
        showToast(error.message || 'Erro ao enviar mensagem', 'error');
    } finally {
        state.isSending = false;
        elements.sendBtn.disabled = false;
        elements.replyInput.disabled = false;
        elements.replyInput.focus();
    }
}

// View Management
function showList() {
    state.currentView = 'list';
    state.currentPhone = null;
    state.currentName = null;
    state.isArchived = false;
    state.messages = [];
    elements.listView.style.display = 'flex';
    elements.chatView.style.display = 'none';
    elements.replyInput.value = '';
    elements.windowWarning.style.display = 'none';
    loadConversations();
}

function showChat(phone, name, isPaused, pausedUntil, isArchived) {
    state.currentView = 'chat';
    state.currentPhone = phone;
    state.currentName = name;
    state.isPaused = !!isPaused;
    state.pausedUntil = pausedUntil || null;
    state.isArchived = !!isArchived;
    elements.listView.style.display = 'none';
    elements.chatView.style.display = 'flex';
    elements.chatName.textContent = name;
    elements.chatPhone.textContent = formatPhoneDisplay(phone);
    elements.chatAvatar.textContent = getInitials(name);
    updateTakeoverButton();
    updateArchiveButton();
    loadMessages(phone);
}

function updateTakeoverButton() {
    if (state.isPaused && state.pausedUntil && new Date(state.pausedUntil) > new Date()) {
        elements.takeoverBtn.classList.add('active');
        const remaining = formatTimeRemaining(state.pausedUntil);
        elements.takeoverLabel.textContent = remaining;
    } else {
        state.isPaused = false;
        state.pausedUntil = null;
        elements.takeoverBtn.classList.remove('active');
        elements.takeoverLabel.textContent = 'Assumir';
    }
}

function formatTimeRemaining(until) {
    const ms = new Date(until) - new Date();
    if (ms <= 0) return 'Assumir';
    const mins = Math.floor(ms / 60000);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}h ${mins % 60}m`;
    return `${mins}m`;
}

async function handleTakeover() {
    if (!state.currentPhone) return;

    if (state.isPaused) {
        // Resume agent
        try {
            await apiCall('resume', { phone: state.currentPhone });
            state.isPaused = false;
            state.pausedUntil = null;
            updateTakeoverButton();
            showToast('Assistente retomado', 'info');
        } catch (error) {
            showToast(error.message || 'Erro ao retomar assistente', 'error');
        }
    } else {
        // Takeover - pause for 1 hour
        try {
            const data = await apiCall('takeover', { phone: state.currentPhone, duration: 1 });
            state.isPaused = true;
            state.pausedUntil = data.paused_until;
            updateTakeoverButton();
            showToast('Assistente pausado por 1 hora', 'info');
        } catch (error) {
            showToast(error.message || 'Erro ao pausar assistente', 'error');
        }
    }
}

// Rendering Functions
function renderConversations() {
    const all = state.conversations;
    const archived = all.filter(c => c.is_archived);
    const active = all.filter(c => !c.is_archived);
    const visible = state.showArchived ? archived : active;

    // Update archive bar
    if (archived.length > 0) {
        elements.archiveBar.style.display = 'flex';
        elements.archiveToggleText.textContent = state.showArchived
            ? `Ver ativas (${active.length})`
            : `Ver arquivadas (${archived.length})`;
        elements.archiveToggle.classList.toggle('active', state.showArchived);
    } else {
        elements.archiveBar.style.display = 'none';
    }

    if (visible.length === 0) {
        elements.conversationsContainer.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" role="img" aria-label="Sem conversas">
                    <path fill="currentColor" d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                </svg>
                <h3>${state.showArchived ? 'Sem arquivadas' : 'Sem conversas'}</h3>
                <p>${state.showArchived ? 'Nenhuma conversa arquivada' : 'Nenhuma conversa disponivel no momento'}</p>
            </div>
        `;
        return;
    }

    const sorted = [...visible].sort((a, b) => {
        return new Date(b.last_message_at) - new Date(a.last_message_at);
    });

    elements.conversationsContainer.innerHTML = sorted.map(conv => {
        const phone = conv.phone_number || conv.phone;
        const name = conv.contact_name || phone;
        const initials = getInitials(name);
        const time = formatRelativeTime(conv.last_message_at);
        const preview = formatMessagePreview(conv);

        return `
            <div class="conversation-item${conv.is_archived ? ' archived' : ''}" data-phone="${escapeAttr(phone)}" role="button" tabindex="0">
                <div class="avatar">${initials}</div>
                <div class="conversation-content">
                    <div class="conversation-header">
                        <span class="conversation-name">${escapeHtml(name)}${conv.is_paused && new Date(conv.paused_until) > new Date() ? '<span class="pause-badge">PAUSA</span>' : ''}${conv.is_archived ? '<span class="archive-badge">ARQUIVO</span>' : ''}</span>
                        <span class="conversation-time">${time}</span>
                    </div>
                    <div class="conversation-preview">
                        ${preview}
                    </div>
                </div>
                <span class="conversation-count">${conv.message_count || ''}</span>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.conversation-item').forEach(item => {
        const handler = () => {
            const phone = item.dataset.phone;
            const conv = state.conversations.find(c => (c.phone_number || c.phone) === phone);
            showChat(phone, conv?.contact_name || phone, conv?.is_paused, conv?.paused_until, conv?.is_archived);
        };
        item.addEventListener('click', handler);
        item.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
        });
    });
}

function renderMessages() {
    if (state.messages.length === 0) {
        elements.messagesContainer.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" role="img" aria-label="Sem mensagens">
                    <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                <h3>Sem mensagens</h3>
                <p>Nenhuma mensagem nesta conversa</p>
            </div>
        `;
        return;
    }

    elements.messagesContainer.innerHTML = state.messages.map(msg => {
        const isIncoming = msg.direction === 'incoming';
        const isHuman = msg.type === 'human';
        const icon = isIncoming ? getUserIcon() : (isHuman ? getPersonIcon() : getBotIcon());
        const time = formatRelativeTime(msg.timestamp);

        return `
            <div class="message ${msg.direction} ${isHuman ? 'human' : ''}">
                <div class="message-icon">${icon}</div>
                <div class="message-bubble">
                    <div class="message-text">${escapeHtml(msg.message)}</div>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;
    }).join('');
}

function formatMessagePreview(conv) {
    if (!conv.last_message) return '';

    let icon = '';
    const dir = conv.last_direction || conv.last_message_direction;
    if (dir === 'out' || dir === 'outgoing') {
        icon = getBotIcon();
    }

    const text = conv.last_message.length > 50
        ? conv.last_message.substring(0, 50) + '...'
        : conv.last_message;

    return icon ? `${icon} ${escapeHtml(text)}` : escapeHtml(text);
}

// Event Handlers
function handleSendReply() {
    const message = elements.replyInput.value.trim();
    if (!message || state.isSending) return;

    if (checkWindowExpiry()) {
        if (!confirm('A janela de 24h expirou. Enviar esta mensagem pode ter custos adicionais da Meta. Continuar?')) {
            return;
        }
    }
    sendReply(state.currentPhone, message);
}

// Polling
function startPolling() {
    stopPolling();
    state.pollTimer = setInterval(pollUpdates, CONFIG.POLL_INTERVAL);
}

function stopPolling() {
    if (state.pollTimer) {
        clearInterval(state.pollTimer);
        state.pollTimer = null;
    }
}

async function pollUpdates() {
    if (state.isLoading || document.hidden) return;

    try {
        if (state.currentView === 'list') {
            const data = await apiCall('conversations');
            state.conversations = Array.isArray(data) ? data : (data.conversations || []);
            renderConversations();
        } else if (state.currentView === 'chat' && state.currentPhone) {
            const data = await apiCall('messages', { phone: state.currentPhone });
            const msgs = Array.isArray(data) ? data : (data.messages || []);
            const normalized = normalizeMessages(msgs);
            if (normalized.length !== state.messages.length) {
                state.messages = normalized;
                renderMessages();
                scrollToBottom();
            }
            // Refresh pause state from conversations data
            const convData = await apiCall('conversations');
            const convs = Array.isArray(convData) ? convData : (convData.conversations || []);
            const current = convs.find(c => (c.phone_number || c.phone) === state.currentPhone);
            if (current) {
                state.isPaused = !!(current.is_paused && new Date(current.paused_until) > new Date());
                state.pausedUntil = current.paused_until || null;
            }
            updateTakeoverButton();
        }
        // Reset failure counter on success
        if (state.pollFailures > 0) {
            state.pollFailures = 0;
            hideConnectionBanner();
        }
    } catch (error) {
        state.pollFailures++;
        if (state.pollFailures >= CONFIG.MAX_POLL_FAILURES) {
            showConnectionBanner();
        }
    }
}

// Connection banner
function showConnectionBanner() {
    if (elements.connectionBanner) {
        elements.connectionBanner.style.display = 'flex';
    }
}

function hideConnectionBanner() {
    if (elements.connectionBanner) {
        elements.connectionBanner.style.display = 'none';
    }
}

// Utility Functions
function getInitials(name) {
    if (!name) return '?';
    // If it looks like a phone number, return phone icon
    if (/^\+?\d{7,}$/.test(name.replace(/\s/g, ''))) return '#';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatPhoneDisplay(phone) {
    if (!phone || phone.length < 9) return phone;
    // Format: +351 912 345 678
    if (phone.startsWith('+')) {
        const digits = phone.slice(1);
        if (digits.length >= 12) {
            return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
        }
    }
    return phone;
}

function formatRelativeTime(timestamp) {
    if (!timestamp) return '';

    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;

    if (diffMs < 0) return 'agora'; // handle future timestamps
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `${diffDays}d`;

    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('pt-PT', { month: 'short' });
    return `${day} ${month}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    if (!text) return '';
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function scrollToBottom() {
    setTimeout(() => {
        const el = elements.messagesContainer;
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, 100);
}

function showLoading() {
    elements.loading.style.display = 'flex';
}

function hideLoading() {
    elements.loading.style.display = 'none';
}

function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.className = 'toast show';
    if (type === 'error') elements.toast.classList.add('error');

    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, type === 'error' ? 5000 : 3000);
}

function checkWindowExpiry() {
    const incoming = [...state.messages].reverse().find(m => m.direction === 'incoming');
    if (!incoming || !incoming.timestamp) {
        elements.windowWarning.style.display = 'none';
        return false;
    }
    const elapsed = Date.now() - new Date(incoming.timestamp).getTime();
    const expired = elapsed > 24 * 60 * 60 * 1000;
    elements.windowWarning.style.display = expired ? 'flex' : 'none';
    return expired;
}

async function loadBotConfig() {
    try {
        const data = await apiCall('get-config');
        state.botConfig = { enabled: data.enabled, schedule: data.schedule || [] };
        updateBotControlBar();
    } catch (e) { /* silent */ }
}

async function handleBotToggle() {
    const enabled = elements.botEnabledToggle.checked;
    state.botConfig.enabled = enabled;
    updateBotControlBar();
    try {
        await apiCall('update-config', { enabled });
        showToast(enabled ? 'Assistente ativado' : 'Assistente desativado', 'info');
    } catch (e) {
        state.botConfig.enabled = !enabled;
        elements.botEnabledToggle.checked = !enabled;
        updateBotControlBar();
        showToast('Erro ao alterar estado do assistente', 'error');
    }
}

// Settings
const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

async function openSettings() {
    try {
        const data = await apiCall('get-config');
        state.botConfig = { enabled: data.enabled, schedule: data.schedule || [] };
    } catch (e) {
        showToast('Erro ao carregar definições', 'error');
        return;
    }
    renderScheduleRules();
    elements.settingsModal.style.display = 'flex';
}

function closeSettings() {
    elements.settingsModal.style.display = 'none';
}

function renderScheduleRules() {
    elements.scheduleRules.innerHTML = '';
    state.botConfig.schedule.forEach((rule, index) => {
        addScheduleRuleUI(rule, index);
    });
}

function addScheduleRuleUI(rule, index) {
    const idx = index !== undefined ? index : state.botConfig.schedule.length;
    if (index === undefined) {
        state.botConfig.schedule.push({ days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' });
    }
    const r = state.botConfig.schedule[idx];

    const div = document.createElement('div');
    div.className = 'schedule-rule';
    div.dataset.index = idx;

    div.innerHTML = `
        <div class="schedule-rule-header">
            <span style="font-size:13px;color:var(--text-secondary)">Regra ${idx + 1}</span>
            <button class="btn-remove-rule" data-idx="${idx}" aria-label="Remover regra">&times;</button>
        </div>
        <div class="schedule-days">
            ${DAY_LABELS.map((label, d) => `
                <button class="day-btn ${r.days.includes(d) ? 'selected' : ''}" data-day="${d}" data-idx="${idx}">${label}</button>
            `).join('')}
        </div>
        <div class="schedule-times">
            <input type="time" value="${r.start}" data-field="start" data-idx="${idx}">
            <span>até</span>
            <input type="time" value="${r.end}" data-field="end" data-idx="${idx}">
        </div>
    `;

    div.querySelector('.btn-remove-rule').addEventListener('click', () => {
        state.botConfig.schedule.splice(idx, 1);
        renderScheduleRules();
    });

    div.querySelectorAll('.day-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const day = parseInt(btn.dataset.day);
            const ruleIdx = parseInt(btn.dataset.idx);
            const days = state.botConfig.schedule[ruleIdx].days;
            const pos = days.indexOf(day);
            if (pos >= 0) days.splice(pos, 1);
            else days.push(day);
            days.sort();
            btn.classList.toggle('selected');
        });
    });

    div.querySelectorAll('input[type="time"]').forEach(input => {
        input.addEventListener('change', () => {
            const ruleIdx = parseInt(input.dataset.idx);
            state.botConfig.schedule[ruleIdx][input.dataset.field] = input.value;
        });
    });

    elements.scheduleRules.appendChild(div);
}

async function saveSettingsToAPI() {
    const schedule = state.botConfig.schedule.filter(r => r.days.length > 0 && r.start && r.end);

    try {
        const data = await apiCall('update-config', { schedule });
        state.botConfig.schedule = data.schedule || [];
        closeSettings();
        updateBotControlBar();
        showToast('Horário guardado', 'info');
    } catch (e) {
        showToast('Erro ao guardar horário', 'error');
    }
}

function updateBotControlBar() {
    const { enabled, schedule } = state.botConfig;
    elements.botEnabledToggle.checked = enabled;

    if (!enabled) {
        elements.botStatusIndicator.className = 'bot-status-indicator off';
        elements.botStatusText.textContent = 'Assistente desativado';
    } else if (schedule && schedule.length > 0) {
        elements.botStatusIndicator.className = 'bot-status-indicator scheduled';
        elements.botStatusText.textContent = 'Assistente ativo (com horário)';
    } else {
        elements.botStatusIndicator.className = 'bot-status-indicator on';
        elements.botStatusText.textContent = 'Assistente ativo';
    }

    // Update schedule label
    if (schedule && schedule.length > 0) {
        const rule = schedule[0];
        elements.scheduleLabel.textContent = `${rule.start}-${rule.end}`;
    } else {
        elements.scheduleLabel.textContent = 'Sempre';
    }
}

// Archive Management
async function handleArchive() {
    if (!state.currentPhone) return;

    if (state.isArchived) {
        try {
            await apiCall('unarchive', { phone: state.currentPhone });
            state.isArchived = false;
            updateArchiveButton();
            showToast('Conversa desarquivada', 'info');
        } catch (error) {
            showToast(error.message || 'Erro ao desarquivar', 'error');
        }
    } else {
        try {
            await apiCall('archive', { phone: state.currentPhone });
            showToast('Conversa arquivada', 'info');
            showList();
        } catch (error) {
            showToast(error.message || 'Erro ao arquivar', 'error');
        }
    }
}

function updateArchiveButton() {
    if (state.isArchived) {
        elements.archiveBtn.classList.add('active');
        elements.archiveLabel.textContent = 'Desarquivar';
    } else {
        elements.archiveBtn.classList.remove('active');
        elements.archiveLabel.textContent = 'Arquivar';
    }
}

function toggleArchiveView() {
    state.showArchived = !state.showArchived;
    renderConversations();
}

// SVG Icons
function getBotIcon() {
    return `<img src="https://descomplicador.pt/images/Miguel.jpg" alt="Miguel" class="bot-avatar-img">`;
}

function getPersonIcon() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>`;
}

function getUserIcon() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
    </svg>`;
}
