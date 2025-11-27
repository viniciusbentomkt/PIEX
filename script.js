document.addEventListener("DOMContentLoaded", function() {
    
    // =========================================================
    // 1. RECUPERAR PREFERÊNCIAS SALVAS (MEMÓRIA)
    // =========================================================
    // Assim que a página carrega, verificamos se o usuário tinha ativado algo antes.
    
    const body = document.body;
    const htmlElement = document.documentElement;

    // Verifica se o Alto Contraste estava ativo
    if (localStorage.getItem('highContrast') === 'true') {
        body.classList.add('high-contrast');
    }

    // Verifica se o Aumento de Fonte estava ativo
    if (localStorage.getItem('fontIncrease') === 'true') {
        htmlElement.classList.add('font-increase');
    }


    // =========================================================
    // 2. MENU HAMBÚRGUER (MOBILE)
    // =========================================================
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");

    if (hamburger && navMenu) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navMenu.classList.toggle("active");
        });

        document.querySelectorAll(".nav-menu a").forEach(link => {
            link.addEventListener("click", () => {
                hamburger.classList.remove("active");
                navMenu.classList.remove("active");
            });
        });
    }


    // =========================================================
    // 3. LÓGICA DO POPUP E BOTÕES
    // =========================================================
    const openBtn = document.getElementById("btn-open-accessibility");
    const closeBtn = document.getElementById("btn-close-popup");
    const popup = document.getElementById("accessibility-popup");
    const contrastBtn = document.getElementById("btn-contrast");
    const fontBtn = document.getElementById("btn-font-increase");

    // Abrir Popup
    if (openBtn && popup) {
        openBtn.addEventListener("click", () => {
            popup.classList.add("active");
        });
    }

    // Fechar Popup (Botão X)
    if (closeBtn && popup) {
        closeBtn.addEventListener("click", () => {
            popup.classList.remove("active");
        });
    }

    // Fechar Popup (Clicar fora)
    if (popup) {
        popup.addEventListener("click", (e) => {
            if (e.target === popup) {
                popup.classList.remove("active");
            }
        });
    }


    // =========================================================
    // 4. BOTÕES DE ACESSIBILIDADE (COM SALVAMENTO)
    // =========================================================

    // --- Botão de Alto Contraste ---
    if (contrastBtn) {
        contrastBtn.addEventListener("click", () => {
            // 1. Troca a classe (liga/desliga)
            body.classList.toggle("high-contrast");
            
            // 2. Verifica se ficou ligado ou desligado
            const isActive = body.classList.contains("high-contrast");
            
            // 3. Salva essa informação no navegador
            localStorage.setItem('highContrast', isActive);
        });
    }

    // --- Botão de Aumentar Fonte ---
    if (fontBtn) {
        fontBtn.addEventListener("click", () => {
            // 1. Troca a classe
            htmlElement.classList.toggle("font-increase");
            
            // 2. Verifica se ficou ligado ou desligado
            const isActive = htmlElement.classList.contains("font-increase");
            
            // 3. Salva essa informação
            localStorage.setItem('fontIncrease', isActive);
        });
    }
});