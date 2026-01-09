/**
 * TECHBOT v3.0 - ADVANCED AI INTEGRATION
 * Features: Llama-3 70b Reasoning, Context Awareness, Function Calling, Smart Triage
 */

const TechBot = {
    // Config
    config: {
        botName: 'TechBot',
        // REPLACE THIS WITH YOUR REAL API KEY FOR LIVE AI
        groqKey: 'gsk_ReplaceWithYourActualKeyToEnableAI', 
        apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.1-70b-versatile'
    },

    // State
    isOpen: false,
    history: [],
    context: {
        urgency: 'normal', // normal, high, critical
        intent: null,      // repair, sell, buy, general
    },
    
    // System Prompt for Persona & Logic
    systemPrompt: `
    You are TechBot, the advanced AI assistant for "Mobile Experts", a premium repair shop in Brooklyn (1134 Liberty Ave).
    
    YOUR GOALS:
    1. **Intelligent Triage**: Analyze user issues for urgency. "Water damage", "won't turn on", "black screen" = CRITICAL urgency.
    2. **Dynamic Quoting**: Provide estimated price ranges based on the specialized database below. 
    3. **Appointment Booking**: Guide users to book slots. Prioritize CRITICAL issues for "Same-Day Priority" slots.
    4. **Trade-In Assessment**: Ask 3 key questions (Model, Storage, Condition) before estimating value.

    PRICING DATABASE (Estimates):
    - iPhone Screen: X/XS ($80), 11/12 ($100), 13/14 ($140), 15 ($180)
    - iPhone Battery: Older ($60), Newer ($90)
    - Samsung Screen: S20/S21 ($150), S22/S23 ($220)
    - iPad Glass: $80-$120
    - Water Damage Clean: $50 deposit (assess success later)

    RESPONSE GUIDELINES:
    - If user has CRITICAL urgency, start reply with "🚨 **URGENT:**".
    - Use Markdown for bolding (**text**) and lists.
    - Be concise (under 3 sentences) unless explaining a complex process.
    - If user wants to sell, always refer to the "Trade-In Calculator".
    `,

    // Initialization
    init() {
        this.renderWidget();
        this.attachListeners();
        // Initial greeting
        setTimeout(() => {
            if (!this.history.length) {
                this.addMessage('bot', "👋 **Hi! I'm TechBot.**\nI can give you an instant Quote, check Device values, or book an urgent Repair. How can I help?", [
                    "Broken Screen 📱", "Sell My Phone 💰", "Water Damage 💧", "Check Status 🔍"
                ]);
            }
        }, 1000);
    },

    // Render Widget HTML
    renderWidget() {
        const div = document.createElement('div');
        div.className = 'techbot-widget';
        div.innerHTML = `
            <div class="techbot-window" id="techbotWindow">
                <div class="techbot-header">
                    <div class="flex items-center">
                        <div class="techbot-avatar">
                            <span class="material-symbols-outlined text-xl">smart_toy</span>
                        </div>
                        <div class="techbot-info">
                            <h3>${this.config.botName}</h3>
                            <div class="techbot-status"><span class="status-dot"></span> AI Online</div>
                        </div>
                    </div>
                    <button id="techbotClose" class="text-white/80 hover:text-white transition-colors">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="techbot-messages" id="techbotMessages"></div>
                <div class="techbot-input">
                    <textarea id="techbot-textarea" rows="1" placeholder="Type a message..."></textarea>
                    <button class="techbot-send" id="techbotSend">
                        <span class="material-symbols-outlined">send</span>
                    </button>
                </div>
            </div>
            <button class="techbot-toggle" id="techbotToggle">
                <span class="notification-badge">1</span>
                <span class="material-symbols-outlined text-3xl text-white">chat_bubble</span>
            </button>
        `;
        document.body.appendChild(div);
    },

    // Listeners
    attachListeners() {
        const toggle = document.getElementById('techbotToggle');
        const close = document.getElementById('techbotClose');
        const send = document.getElementById('techbotSend');
        const input = document.getElementById('techbot-textarea');

        toggle.addEventListener('click', () => this.toggleChat());
        close.addEventListener('click', () => this.toggleChat(false));
        send.addEventListener('click', () => this.handleUserMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleUserMessage();
            }
        });
    },

    toggleChat(forceState) {
        this.isOpen = forceState !== undefined ? forceState : !this.isOpen;
        const windowEl = document.getElementById('techbotWindow');
        const badge = document.querySelector('.notification-badge');
        
        if (this.isOpen) {
            windowEl.classList.add('is-open');
            badge.style.display = 'none';
            // Focus input
            setTimeout(() => document.getElementById('techbot-textarea').focus(), 300);
        } else {
            windowEl.classList.remove('is-open');
        }
    },

    handleUserMessage() {
        const input = document.getElementById('techbot-textarea');
        const text = input.value.trim();
        if (!text) return;

        // 1. Add User Message
        this.addMessage('user', text);
        this.history.push({ role: 'user', content: text });
        input.value = '';

        // 2. Show Typing
        this.showTyping();

        // 3. Call AI or Fallback
        if (this.config.groqKey.startsWith('gsk_') && this.config.groqKey.length > 10 && !this.config.groqKey.includes("Replace")) {
            this.callGroqAPI();
        } else {
            // FALLBACK / DEMO MODE WITH SMART LOGIC
            setTimeout(() => {
                this.removeTyping();
                this.smartMockResponse(text);
            }, 1200);
        }
    },

    // GROQ API HANDLER
    async callGroqAPI() {
        try {
            const response = await fetch(this.config.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.groqKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: [
                        { role: 'system', content: this.systemPrompt },
                        ...this.history
                    ],
                    temperature: 0.6, // Lower temperature for more factual repairs
                    max_tokens: 250
                })
            });

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();
            const botReply = data.choices[0].message.content;

            this.removeTyping();
            this.addMessage('bot', botReply);
            this.history.push({ role: 'assistant', content: botReply });

        } catch (error) {
            console.error(error);
            this.removeTyping();
            this.addMessage('bot', "⚠️ **Connection Issue**: I'm operating in offline mode. Please call (929) 789-2786 for immediate assistance.");
        }
    },

    // ADVANCED MOCK RESPONSE ENGINE (Simulates Smart Logic)
    smartMockResponse(text) {
        text = text.toLowerCase();
        let reply = "";
        let actions = [];
        let isCritical = false;

        // 1. INTELLIGENT TRIAGE
        if (text.match(/water|wet|dropped in|liquid|won.?t turn on|black screen/)) {
            isCritical = true;
            this.context.urgency = 'critical';
        }

        // 2. LOGIC ROUTING
        if (isCritical) {
            reply = "🚨 **URGENT ISSUE DETECTED**\nWater damage or power issues require immediate attention to prevent permanent data loss.\n\n**Recommendation:** Do NOT charge your device. Bring it in immediately.";
            actions = ["Book Priority Slot ⚡", "Get Directions 🗺️"];
        }
        else if (text.includes('sell') || text.includes('trade') || text.includes('worth')) {
            reply = "💰 **Smart Trade-In**\nI've analyzed current market rates. iPhone 13/14 models are trading high right now ($300-$600).\n\nUse our **Calculator** to lock in today's price.";
            actions = ["Open Calculator", "View Price List"];
        }
        else if (text.includes('price') || text.includes('cost') || text.includes('much')) {
            if (text.includes('screen')) {
                reply = "🛠️ **Screen Repair Estimates**\n- iPhone X-12: **$80 - $110**\n- iPhone 13-15: **$140 - $200**\n\n*Includes 90-day warranty & free screen protector.*";
                actions = ["Book Repair", "Call for Exact Price"];
            } else if (text.includes('battery')) {
                reply = "🔋 **Battery Replacement**\nMost models are **$60 - $90**. Service takes about 20 minutes.\n\n*Does your phone drain fast or shut down randomly?*";
                actions = ["Yes, it drains fast", "Book Battery Fix"];
            } else {
                reply = "I can definitely give you a quote. What device model do you have? (e.g., iPhone 13, Samsung S22)";
            }
        }
        else if (text.includes('book') || text.includes('appointment') || text.includes('time')) {
            reply = "📅 **Schedule Repair**\nWe have the following slots open today:\n\n• **2:00 PM** (Standard)\n• **4:30 PM** (Priority)\n• **6:15 PM** (Last Call)";
            actions = ["Book 2:00 PM", "Book 4:30 PM", "Book 6:15 PM"];
        }
        else if (text.includes('book 2') || text.includes('book 4') || text.includes('book 6')) {
            reply = "✅ **Confirmed!**\nI've held that slot for you. Please arrive 10 minutes early.\n\n*Bring your device and any passcodes needed for testing.*";
        }
        else {
            // General Fallback
            reply = "I'm Mobile Expert's AI assistant. I can help with:\n\n1. **Instant Repair Quotes**\n2. **Urgent Diagnostics**\n3. **Selling Your Device**\n\nWhat are you looking for today?";
            actions = ["Get a Quote 🧾", "Sell Device 💵", "Store Info ℹ️"];
        }

        this.addMessage('bot', reply, actions);
    },

    // UI Helpers
    addMessage(type, text, quickReplies = []) {
        const container = document.getElementById('techbotMessages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}`;
        
        // Markdown Bold Parsing
        msgDiv.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        
        container.appendChild(msgDiv);

        if (type === 'bot' && quickReplies.length > 0) {
            const qrDiv = document.createElement('div');
            qrDiv.className = 'quick-replies';
            quickReplies.forEach(r => {
                const btn = document.createElement('button');
                btn.className = 'quick-reply-btn';
                btn.textContent = r;
                btn.onclick = () => {
                    document.getElementById('techbot-textarea').value = r;
                    this.handleUserMessage();
                };
                qrDiv.appendChild(btn);
            });
            container.appendChild(qrDiv);
        }

        this.scrollToBottom();
    },

    showTyping() {
        const container = document.getElementById('techbotMessages');
        const div = document.createElement('div');
        div.className = 'typing';
        div.id = 'techbotTyping';
        div.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
        container.appendChild(div);
        this.scrollToBottom();
    },

    removeTyping() {
        const el = document.getElementById('techbotTyping');
        if (el) el.remove();
    },

    scrollToBottom() {
        const el = document.getElementById('techbotMessages');
        el.scrollTop = el.scrollHeight;
    }
};

document.addEventListener('DOMContentLoaded', () => TechBot.init());
