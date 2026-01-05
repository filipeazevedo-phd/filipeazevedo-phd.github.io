document.addEventListener('DOMContentLoaded', () => {
    const consoleElement = document.getElementById('console');
    
    // --- CONFIGURAÇÕES ---
    const baseSpeed = 30;     
    const speedVariance = 30; 
    const contentFile = 'filipe.txt'; 
    // ---------------------

    // --- LOGICA DE CONTROLO DE INTERAÇÃO (CRÍTICO PARA MOBILE) ---
    let userIsTouching = false;

    // Assim que o dedo toca no ecrã, o autoscroll morre imediatamente.
    // passive: true melhora a performance do scroll
    window.addEventListener('touchstart', () => { userIsTouching = true; }, { passive: true });
    window.addEventListener('touchend', () => { userIsTouching = false; }, { passive: true });
    
    // Para PC (rato)
    window.addEventListener('mousedown', () => { userIsTouching = true; });
    window.addEventListener('mouseup', () => { userIsTouching = false; });

    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    cursor.style.pointerEvents = 'none'; 

    fetch(contentFile)
        .then(res => {
            if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
            return res.text();
        })
        .then(html => {
            consoleElement.appendChild(cursor);
            
            setTimeout(() => {
                typeHtml(consoleElement, html, cursor).then(() => {
                    const finalBreak = document.createElement('br');
                    consoleElement.appendChild(finalBreak);
                    consoleElement.appendChild(cursor);
                    
                    cursor.classList.remove('typing'); 
                    
                    // Scroll final apenas se o user não estiver a segurar o ecrã
                    if (!userIsTouching) {
                        window.scrollTo(0, document.body.scrollHeight);
                    }
                });
            }, 500);
        })
        .catch(err => {
            consoleElement.innerHTML = 'Erro ao carregar o sistema.';
            console.error(err);
        });

    async function typeHtml(container, htmlString, cursorRef) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        const loginSpan = doc.getElementById('login-info');
        if (loginSpan) {
            const now = new Date();
            const dateStr = now.toString().split(' GMT')[0]; 
            loginSpan.textContent = `Last login: ${dateStr} on ttys000\n`;
        }

        const nodes = Array.from(doc.body.childNodes);
        cursorRef.classList.add('typing');

        for (const node of nodes) {
            await typeNode(container, node, cursorRef);
        }
        
        cursorRef.classList.remove('typing');
    }

    async function typeNode(parent, node, cursorRef) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = document.createElement(node.tagName);
            
            Array.from(node.attributes).forEach(attr => {
                element.setAttribute(attr.name, attr.value);
            });

            try {
                parent.insertBefore(element, cursorRef);
            } catch (e) {
                parent.appendChild(element);
            }

            if (['BR', 'P', 'DIV'].includes(node.tagName)) {
                if (node.tagName === 'BR') {
                    parent.insertBefore(cursorRef, element.nextSibling);
                } else if (node.childNodes.length === 0) {
                    cursorRef.classList.remove('typing');
                    await wait(300); 
                    cursorRef.classList.add('typing');
                }
            }

            const children = Array.from(node.childNodes);
            for (const child of children) {
                await typeNode(element, child, cursorRef);
            }
        } 
        else if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            
            for (const char of text) {
                // 1. SNAPSHOT: Verifica se estavas no fundo ANTES de escrever
                // Se a distância for < 30px, consideramos que estavas a acompanhar
                const wasAtBottom = isAtBottom(30);

                // 2. ESCREVE
                parent.append(char);
                parent.appendChild(cursorRef);
                
                // 3. AÇÃO:
                // Só faz scroll SE já estavas no fundo ANTES
                // E SE o dedo não estiver no ecrã.
                if (wasAtBottom && !userIsTouching) {
                    // Sem 'smooth' behavior para evitar conflitos de animação
                    window.scrollTo(0, document.body.scrollHeight);
                }

                const randomDelay = baseSpeed + Math.random() * speedVariance;
                await wait(randomDelay);
            }
        }
    }

    // Função de cálculo de posição precisa para Mobile
    function isAtBottom(threshold = 30) {
        // VisualViewport lida melhor com zoom e barras do Android/iOS
        const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const currentScroll = Math.ceil(window.scrollY);
        const totalHeight = document.body.scrollHeight;
        
        const distance = totalHeight - (currentScroll + viewportHeight);
        
        // Retorna verdadeiro se a distância ao fundo for pequena
        return distance < threshold;
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
});