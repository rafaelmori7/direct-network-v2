/*
 * Widget de revenda para sites de agências parceiras.
 *
 *   <script async src="https://SEU-SITE/widget.js" data-parceiro="timelapse"></script>
 *
 * Atributos opcionais:
 *   data-eventos="proprios"        só os eventos da agência (padrão: todos)
 *   data-tema="claro" | "escuro"   (padrão: segue o aparelho)
 *   data-limite="8"                quantos eventos mostrar (1 a 24, padrão 12)
 *   data-alvo="#revenda"           onde colocar o widget (padrão: logo depois do script)
 */
(function () {
  "use strict";
  var MESSAGE = "revenda-widget:altura";
  var frames = (window.__revendaWidgetFrames = window.__revendaWidgetFrames || {});

  if (!window.__revendaWidgetListening) {
    window.__revendaWidgetListening = true;
    window.addEventListener("message", function (event) {
      var data = event.data;
      if (!data || data.type !== MESSAGE || typeof data.height !== "number") return;
      var entry = frames[data.id];
      if (!entry || entry.origin !== event.origin || entry.frame.contentWindow !== event.source) return;
      entry.frame.style.height = Math.max(120, Math.min(data.height, 20000)) + "px";
    });
  }

  var scripts = document.querySelectorAll("script[data-parceiro]:not([data-revenda-pronto])");
  for (var i = 0; i < scripts.length; i++) mount(scripts[i]);

  function mount(script) {
    script.setAttribute("data-revenda-pronto", "");
    var slug = (script.getAttribute("data-parceiro") || "").toLowerCase();
    if (!/^[a-z0-9-]{3,40}$/.test(slug)) return;
    var origin = new URL(script.src, location.href).origin;
    var id = "w" + Math.random().toString(36).slice(2, 10);
    var query = ["id=" + id];
    ["eventos", "tema", "limite"].forEach(function (name) {
      var value = script.getAttribute("data-" + name);
      if (value) query.push(name + "=" + encodeURIComponent(value));
    });

    var frame = document.createElement("iframe");
    frame.src = origin + "/embed/" + slug + "?" + query.join("&");
    frame.title = "Revenda de ingressos";
    frame.loading = "lazy";
    frame.setAttribute("scrolling", "no");
    frame.style.cssText = "display:block;width:100%;height:640px;border:0;background:transparent;";
    frames[id] = { frame: frame, origin: origin };

    var target = script.getAttribute("data-alvo") && document.querySelector(script.getAttribute("data-alvo"));
    if (target) target.appendChild(frame);
    else script.parentNode.insertBefore(frame, script.nextSibling);
  }
})();
