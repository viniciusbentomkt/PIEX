// Minimal JS: toggle nav on mobile, set footer year, simple contact validation
(function(){
  // Toggle each nav by ID pattern (handles pages with different nav IDs)
  document.querySelectorAll(".nav-toggle").forEach(function(btn){
    btn.addEventListener("click", function(){
      // find sibling nav (nextElementSibling might not be nav due to markup differences)
      var nav = btn.parentElement.querySelector(".nav");
      if(!nav) return;
      var isVisible = nav.style.display === "flex" || nav.style.display === "block";
      nav.style.display = isVisible ? "none" : "block";
    });
  });

  // Set year in all footers
  var year = new Date().getFullYear();
  document.querySelectorAll("[id^='year']").forEach(function(el){ el.textContent = year });

  // Simple contact form handling: prevent real submit and show a message
  var form = document.getElementById("contactForm");
  if(form){
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var name = form.querySelector('[name="name"]').value.trim();
      var email = form.querySelector('[name="email"]').value.trim();
      var msgEl = document.getElementById("formMsg");
      if(!name || !email){
        msgEl.textContent = "Preencha nome e e-mail.";
        msgEl.style.color = "crimson";
        return;
      }
      // Simular envio: você pode integrar Formspree/Netlify/Getform sem backend
      msgEl.style.color = "green";
      msgEl.textContent = "Obrigado! Sua mensagem foi registrada (simulada).";
      form.reset();
    });
  }
})();