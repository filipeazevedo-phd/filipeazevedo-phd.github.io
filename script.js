document.addEventListener('DOMContentLoaded', () => {
    const consoleElement = document.getElementById('console');
    
    // --- CONFIGURAÇÕES ---
    const baseSpeed = 30;     
    const speedVariance = 30; 
    const contentFile = 'filipe.txt'; 
    // ---------------------

    // --- CONTROLO DE INTERAÇÃO ---
    let userIsInteracting = false;

    // Detetar qualquer tipo de interação (Toque, Rato, Scroll manual)
    const interactionEvents = ['touchstart', 'wheel', 'mousedown', 'pointerdown'];

    interactionEvents.forEach(evt => {
        // passive: true melhora a performance e garante que o browser não bloqueia
        window.addEventListener(evt, () => {
            userIsInteracting = true;
        }, { passive: true });
    });

    window.addEventListener('touchend', () => {
        // Pequeno delay para garantir que o scroll de inércia (momentum) não é cortado
        setTimeout(() => {
            userIsInteracting = false;
        }, 100);
    }, { passive: true });

    window.addEventListener('mouseup', () => {
        userIsInteracting = false;
    });

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
                    
                    if (!userIsInteracting) {
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
                // 1. ANÁLISE: Onde estamos ANTES de escrever a letra?
                // Usamos visualViewport para precisão no telemóvel
                const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
                const currentScroll = Math.ceil(window.scrollY);
                const totalHeight = document.body.scrollHeight;
                const distanceToBottom = totalHeight - (currentScroll + viewportHeight);

                // 2. DECISÃO:
                // Reduzi a tolerância de 80px para 20px. 
                // Se puxares o dedo um bocadinho (mais de 20px), ele para logo de te puxar.
                // E verificamos se o user está a tocar no ecrã (userIsInteracting).
                const isGluedToBottom = distanceToBottom < 20; 
                const shouldAutoScroll = isGluedToBottom && !userIsInteracting;

                // 3. AÇÃO: Escreve a letra
                parent.append(char);
                parent.appendChild(cursorRef);
                
                // 4. SCROLL: Só executamos se as condições forem perfeitas
                if (shouldAutoScroll) {
                    window.scrollTo(0, document.body.scrollHeight);
                }

                const randomDelay = baseSpeed + Math.random() * speedVariance;
                await wait(randomDelay);
            }
        }
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
});