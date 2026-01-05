document.addEventListener('DOMContentLoaded', () => {
    const consoleElement = document.getElementById('console');
    
    // --- CONFIGURAÇÕES ---
    const baseSpeed = 30;     
    const speedVariance = 30; 
    const contentFile = 'filipe.txt'; 
    // ---------------------

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
            
            // Pequeno delay de "Boot" (0.5s)
            setTimeout(() => {
                typeHtml(consoleElement, html, cursor).then(() => {
                    // TERMINOU DE ESCREVER
                    const finalBreak = document.createElement('br');
                    consoleElement.appendChild(finalBreak);
                    consoleElement.appendChild(cursor);
                    
                    cursor.classList.remove('typing'); 
                    
                    // Scroll final forçado
                    window.scrollTo(0, document.body.scrollHeight);
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

        // Injeta a Data de Login se o elemento existir
        const loginSpan = doc.getElementById('login-info');
        if (loginSpan) {
            const now = new Date();
            // Formatação simples de data estilo UNIX
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
        // CASO 1: É UMA TAG HTML
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

            // Lógica de pausas para blocos específicos
            if (['BR', 'P', 'DIV'].includes(node.tagName)) {
                if (node.tagName === 'BR') {
                    // Move o cursor para depois do BR
                    parent.insertBefore(cursorRef, element.nextSibling);
                } else if (node.childNodes.length === 0) {
                    // Pausa dramática em elementos vazios
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
        // CASO 2: É TEXTO
        else if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            
            for (const char of text) {
                // --- LÓGICA DE SCROLL CORRIGIDA PARA MOBILE ---
                
                // 1. Obter altura real da viewport (lida com barra de URL do Chrome)
                const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
                
                // 2. Calcular distância ao fundo com margem de segurança
                // Math.ceil ajuda com pixeis fracionados em ecrãs retina/high-dpi
                const currentScroll = Math.ceil(window.scrollY);
                const totalHeight = document.body.scrollHeight;
                const distanceToBottom = totalHeight - (currentScroll + viewportHeight);
                
                // Se a distância for menor que 80px, consideramos que o user quer autoscroll
                const shouldScroll = distanceToBottom < 80;

                // 3. Escreve a letra
                parent.append(char);
                parent.appendChild(cursorRef);
                
                // 4. Executa o scroll se necessário
                if (shouldScroll) {
                    window.scrollTo(0, document.body.scrollHeight);
                }

                // Velocidade variável
                const randomDelay = baseSpeed + Math.random() * speedVariance;
                await wait(randomDelay);
            }
        }
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
});