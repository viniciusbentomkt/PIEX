// =============================================
// 1. LÓGICA DO MENU HAMBÚRGUER (MOBILE)
// =============================================
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");

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


// =============================================
// 2. LÓGICA DE ACESSIBILIDADE (COM POPUP)
// =============================================

// --- Seletores dos Elementos ---
const openAccessibilityButton = document.getElementById("btn-open-accessibility");
const closeAccessibilityButton = document.getElementById("btn-close-popup");
const accessibilityPopup = document.getElementById("accessibility-popup");

const contrastButton = document.getElementById("btn-contrast");
const fontIncreaseButton = document.getElementById("btn-font-increase");

const body = document.body;
const htmlElement = document.documentElement; // Seleciona a tag <html>

// --- Event Listeners para Abrir e Fechar o Popup ---
openAccessibilityButton.addEventListener("click", () => {
    accessibilityPopup.classList.add("active");
});

closeAccessibilityButton.addEventListener("click", () => {
    accessibilityPopup.classList.remove("active");
});

// Opcional: Fechar o popup se clicar fora da caixa (no overlay)
accessibilityPopup.addEventListener("click", (e) => {
    // Verifica se o clique foi no container (overlay) e não no conteúdo
    if (e.target === accessibilityPopup) {
        accessibilityPopup.classList.remove("active");
    }
});


// --- Event Listeners dos Botões de Acessibilidade (Dentro do Popup) ---

// Botão de Alto Contraste
contrastButton.addEventListener("click", () => {
    body.classList.toggle("high-contrast");
});

// Botão de Aumentar Fonte
fontIncreaseButton.addEventListener("click", () => {
    htmlElement.classList.toggle("font-increase");
});