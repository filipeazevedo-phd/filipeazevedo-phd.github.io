class Typer {
    constructor() {
        this.text = '';
        this.index = 0;
        this.speed = 50;
        this.cursorHTML = '<span class="cursor"></span>';
        this.consoleElement = document.getElementById('console');
        this.isTyping = false;
    }

    async init() {
        try {
            const response = await fetch("filipe.txt");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            this.text = await response.text();
            this.updateLoginInfo();
            this.startTyping();
        } catch (error) {
            this.displayError(error);
        }
    }

    startTyping() {
        if (this.isTyping) return;
        this.isTyping = true;
        this.typeNextChar();
    }

    typeNextChar() {
        if (this.index <= this.text.length) {
            this.consoleElement.innerHTML = `${this.text.substring(0, this.index)}${this.cursorHTML}`;
            this.index++;
            this.checkAndScroll();
            setTimeout(() => this.typeNextChar(), this.speed);
        } else {
            this.isTyping = false;
        }
    }

    checkAndScroll() {
        const cursorElement = this.consoleElement.querySelector('.cursor');
        if (cursorElement) {
            const cursorRect = cursorElement.getBoundingClientRect();
            const bottomOffset = window.innerHeight - cursorRect.bottom;

            if (bottomOffset < 0 || (bottomOffset === 0 && this.consoleElement.scrollHeight > window.innerHeight)) {
                window.scrollBy({
                    top: -bottomOffset + 10,
                    behavior: 'smooth'
                });
            }
        }
    }

    updateLoginInfo() {
        const portugalTime = new Date().toLocaleString("en-US", {timeZone: "Europe/Lisbon"});
        const date = new Date(portugalTime);
        const formattedDate = `${date.toLocaleString('en-US', { weekday: 'short' })} ${date.toLocaleString('en-US', { month: 'short' })} ${date.getDate().toString().padStart(2, '0')} at ${date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`;
        this.text = this.text.replace('<span id="login-info"></span>', `Last login: ${formattedDate} on console\n\n`);
    }

    displayError(error) {
        console.error('Error loading content:', error);
        this.consoleElement.innerHTML = '<p style="color:red;">Failed to load content. Please try again later.</p>';
    }
}

document.addEventListener("DOMContentLoaded", () => new Typer().init());