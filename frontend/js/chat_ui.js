// Point to your live backend
const API_BASE_URL = "https://us-economy-dashboard-98go.onrender.com/"; 

const chatOutput = document.getElementById('chat-output');
const chatInput = document.getElementById('chat-input');
const chatSubmit = document.getElementById('chat-submit');

// Toggle Elements for Minimizing
const chatContainer = chatInput.closest('.flex.flex-col'); // Selects the main chat window container
const chatHeader = chatContainer ? chatContainer.querySelector('div') : null;

// Simple, safe Markdown formatter for bold text, lists, and line breaks
function parseMarkdown(text) {
    let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Convert bold (**text**) to <strong> tags
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert bullet points (* item) to clean list layouts
    html = html.replace(/^\*\s+(.*)$/gm, '<div class="flex items-start gap-2 my-1"><span>•</span><span>$1</span></div>');

    // Convert standard line breaks to paragraph/breaks
    html = html.replace(/\n/g, '<br>');

    return html;
}

function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    
    if (sender === 'user') {
        msgDiv.className = 'bg-primary/20 text-on-surface p-3 rounded-lg rounded-tr-none self-end w-10/12 border border-primary/30 shadow-sm ml-auto mt-4 font-sans';
        msgDiv.textContent = text; // Safe raw text for user input
    } else {
        msgDiv.className = 'bg-surface-container-high text-on-surface p-3 rounded-lg rounded-tl-none self-start w-10/12 border border-white/5 shadow-sm mt-4 font-sans leading-relaxed';
        msgDiv.innerHTML = parseMarkdown(text); // Parsed markdown HTML for AI responses
    }
    
    chatOutput.appendChild(msgDiv);
    chatOutput.scrollTop = chatOutput.scrollHeight;
}

async function handleChatSubmit() {
    const prompt = chatInput.value.trim();
    if (!prompt) return;

    appendMessage('user', prompt);
    chatInput.value = '';

    const loadingId = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.id = loadingId;
    loadingDiv.className = 'bg-surface-container-high text-on-surface-variant p-3 rounded-lg rounded-tl-none self-start w-10/12 border border-white/5 shadow-sm mt-4 italic';
    loadingDiv.innerHTML = '<span class="animate-pulse">Analyzing data...</span>';
    chatOutput.appendChild(loadingDiv);
    chatOutput.scrollTop = chatOutput.scrollHeight;

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/chat/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });

        const result = await response.json();
        
        document.getElementById(loadingId).remove();
        appendMessage('ai', result.response);

    } catch (error) {
        console.error("Chat API Error:", error);
        document.getElementById(loadingId).remove();
        appendMessage('ai', 'Connection error. The AI Agent is currently unreachable.');
    }
}

// ==========================================
// Minimize/Maximize Window Functionality
// ==========================================
if (chatHeader && chatContainer) {
    // Style header cursor to let users know it's interactive
    chatHeader.style.cursor = 'pointer';
    chatHeader.title = 'Click to toggle chat window';

    // Add a button container if one doesn't exist
    let toggleBtn = chatHeader.querySelector('.minimize-toggle');
    if (!toggleBtn) {
        toggleBtn = document.createElement('button');
        toggleBtn.className = 'minimize-toggle ml-auto text-on-surface-variant hover:text-on-surface flex items-center transition-colors p-1 rounded-md';
        toggleBtn.innerHTML = '<span class="material-symbols-outlined transition-transform duration-200">keyboard_arrow_down</span>';
        
        // Find status indicator container and place it right next to it or replace old icon
        chatHeader.appendChild(toggleBtn);
    }

    const iconSpan = toggleBtn.querySelector('span');

    chatHeader.addEventListener('click', () => {
        // Find adjacent siblings (the chat output box and input bar container)
        const chatBody = chatOutput;
        const chatInputBar = chatInput.closest('div');

        if (chatBody.classList.contains('hidden')) {
            // Expand Window
            chatBody.classList.remove('hidden');
            if (chatInputBar) chatInputBar.classList.remove('hidden');
            if (iconSpan) iconSpan.style.transform = 'rotate(0deg)';
            chatContainer.style.height = '500px'; // Restores original height context
        } else {
            // Minimize Window
            chatBody.classList.add('hidden');
            if (chatInputBar) chatInputBar.classList.add('hidden');
            if (iconSpan) iconSpan.style.transform = 'rotate(180deg)';
            chatContainer.style.height = 'auto'; // Shrinks container to header only
        }
    });
}

chatSubmit.addEventListener('click', handleChatSubmit);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChatSubmit();
});
