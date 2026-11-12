/* Navegación principal de klk: cinco destinos claros y herramientas agrupadas. */
(() => {
  "use strict";
  const tabs = ["chats", "contacts", "calls", "updates", "tools"];
  const panelIds = ["chatsPanel", "requestsPanel", "peopleList", "callsPanel", "updatesPanel", "toolsPanel", "assistantPanel"];

  // One primary destination and one contextual panel at a time.
  const contextualIds = ["explorerPanel", "settingsPanel", "assistantPanel", "homeProfilePanel", "contactProfilePanel"];
  function closeContextualPanels() {
    contextualIds.forEach(id => {
      const panel = document.getElementById(id);
      if (!panel) return;
      panel.hidden = true;
      panel.style.display = "none";
    });
    ["attachmentPanel", "stickersPanel"].forEach(id => {
      const panel = document.getElementById(id);
      if (!panel) return;
      panel.classList.remove("open");
      panel.style.display = "none";
    });
    document.querySelectorAll('[aria-expanded="true"]').forEach(control => {
      if (control.closest("#homeView") || control.id === "stickersToggle") {
        control.setAttribute("aria-expanded", "false");
      }
    });
  }

  function navigate(tab) {
    if (!tabs.includes(tab)) return;
    closeContextualPanels();
    const get = id => document.getElementById(id);
    const home = get("homeView");
    if (home) home.style.display = "block";

    panelIds.forEach(id => {
      const panel = get(id);
      if (panel) {
        panel.hidden = true;
        panel.style.display = "none";
      }
    });

    const isChats = tab === "chats";
    const isContacts = tab === "contacts";
    const search = get("homeSearch");
    const status = get("homeStatus");
    const filters = document.querySelector(".homeFilters");
    if (search) search.style.display = isChats ? "block" : "none";
    if (status) status.style.display = isChats ? "block" : "none";
    if (filters) filters.style.display = isContacts ? "flex" : "none";

    if (isChats) {
      const chats = get("chatsPanel");
      if (chats) chats.style.display = "block";
      const requests = get("requestsPanel");
      const people = get("peopleList");
      if (requests) requests.style.display = "none";
      if (people) people.style.display = "none";
    } else if (isContacts) {
      const requests = get("requestsPanel");
      const people = get("peopleList");
      if (requests) requests.style.display = "none";
      if (people) people.style.display = "block";
      const peopleFilter = document.querySelector('.homeFilters button[data-filter="people"]');
      if (peopleFilter) {
        document.querySelectorAll(".homeFilters button").forEach(button => {
          button.classList.toggle("active", button === peopleFilter);
        });
      }
    } else {
      const panel = get(tab === "calls" ? "callsPanel" :
        tab === "updates" ? "updatesPanel" : "toolsPanel");
      if (panel) panel.style.display = "block";
    }

    document.querySelectorAll(".homeBottom button").forEach(button => {
      const active = button.dataset.tab === tab;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    if (tab !== "chats" && tab !== "contacts") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.klkNavigateTab = navigate;
  document.querySelectorAll(".homeBottom button[data-tab]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      navigate(button.dataset.tab);
    }, true);
  });

  document.querySelectorAll("[data-go-tab]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      navigate(button.dataset.goTab);
    }, true);
  });


  // Explorador de klk: índice de pantallas, ajustes y comprobaciones visibles.
  function installExplorer() {
    const get = id => document.getElementById(id);
    const grid = get("toolsPanel")?.querySelector(".toolGrid");
    const home = get("homeView");
    if (!grid || !home || get("explorerPanel")) return;

    const tile = document.createElement("button");
    tile.type = "button";
    tile.innerHTML = '<span aria-hidden="true">🧭</span>Recorrido completo';
    tile.addEventListener("click", () => {
      navigate("tools");
      const panel = get("explorerPanel");
      if (panel) { closeContextualPanels(); panel.hidden = false; }
      if (panel) panel.scrollIntoView({behavior:"smooth", block:"start"});
    });
    grid.appendChild(tile);

    const panel = document.createElement("section");
    panel.id = "explorerPanel";
    panel.className = "homeUtilityPanel";
    panel.setAttribute("aria-label", "Recorrido completo por klk");
    panel.hidden = true;
    panel.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;justify-content:space-between">
        <h2 style="margin:8px 0">🧭 Recorrido completo</h2>
        <button type="button" data-explorer-close style="width:auto;margin:0;padding:9px 13px">Cerrar</button>
      </div>
      <p class="hint">Explora las secciones de klk, abre los ajustes y comprueba qué elementos están disponibles en esta versión.</p>
      <div role="status" aria-live="polite" style="padding:12px;border-radius:12px;background:var(--klk-soft);color:var(--klk-text);margin:12px 0">
        <strong id="explorerCount">Preparando revisión…</strong>
        <div id="explorerDetail" class="hint" style="margin-top:5px">El resultado se calcula en este teléfono.</div>
      </div>
      <h3 style="font-size:16px;margin:18px 0 8px">Pantallas principales</h3>
      <div class="toolGrid">
        <button type="button" data-explorer-tab="chats"><span>💬</span>Chats</button>
        <button type="button" data-explorer-tab="contacts"><span>👥</span>Contactos</button>
        <button type="button" data-explorer-tab="calls"><span>☎️</span>Llamadas</button>
        <button type="button" data-explorer-tab="updates"><span>◉</span>Novedades</button>
        <button type="button" data-explorer-tab="tools"><span>☷</span>Herramientas</button>
        <button type="button" data-explorer-target="assistant"><span>🤖</span>Asistente IA</button>
        <button type="button" data-explorer-target="profile"><span>🖼️</span>Mi perfil</button>
        <button type="button" data-explorer-target="invite"><span>＋</span>Invitaciones</button>
      </div>
      <h3 style="font-size:16px;margin:20px 0 8px">Configuración</h3>
      <div class="toolGrid">
        <button type="button" data-explorer-target="settings"><span>⚙️</span>Abrir todos los ajustes</button>
        <button type="button" data-explorer-target="privacy"><span>🛡️</span>Privacidad</button>
        <button type="button" data-explorer-target="notifications"><span>🔔</span>Notificaciones y sonidos</button>
        <button type="button" data-explorer-target="appearance"><span>🎨</span>Apariencia y lectura</button>
      </div>
      <h3 style="font-size:16px;margin:20px 0 8px">Revisión de componentes</h3>
      <div id="explorerChecks" style="display:grid;gap:8px"></div>
      <p class="hint" style="margin-top:12px">La revisión comprueba que los controles existan en la pantalla. No realiza llamadas reales, no envía mensajes ni modifica permisos o datos.</p>
      <button type="button" data-explorer-recheck class="secondary">↻ Volver a comprobar</button>
    `;
    const nav = home.querySelector(".homeBottom");
    home.insertBefore(panel, nav || null);

    const checkIds = [
      ["Navegación principal", "homeBottom"],
      ["Lista de chats", "chatsList"],
      ["Lista de contactos", "peopleList"],
      ["Solicitudes", "requestsList"],
      ["Panel de llamadas", "callsPanel"],
      ["Novedades", "updatesPanel"],
      ["Herramientas", "toolsPanel"],
      ["Asistente IA", "assistantPanel"],
      ["Mi perfil", "homeProfilePanel"],
      ["Perfil de contacto", "contactProfilePanel"],
      ["Configuración", "settingsPanel"],
      ["Mensajes y compositor", "messages"],
      ["Llamada y controles", "callOverlay"]
    ];
    function runChecks() {
      const host = get("explorerChecks");
      if (!host) return;
      host.replaceChildren();
      let passed = 0;
      checkIds.forEach(([label, id]) => {
        const exists = !!get(id);
        if (exists) passed++;
        const row = document.createElement("div");
        row.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid var(--klk-line);border-radius:10px;background:var(--klk-surface)";
        const name = document.createElement("span");
        name.textContent = label;
        const status = document.createElement("strong");
        status.textContent = exists ? "✓ Disponible" : "No encontrado";
        status.style.color = exists ? "#16834b" : "#b42318";
        row.append(name, status);
        host.appendChild(row);
      });
      const count = get("explorerCount");
      const detail = get("explorerDetail");
      if (count) count.textContent = passed + " de " + checkIds.length + " componentes encontrados";
      if (detail) detail.textContent = "Comprobación estructural local; no equivale a una prueba funcional del servidor.";
    }
    panel.addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.hasAttribute("data-explorer-close")) {
        panel.hidden = true;
        return;
      }
      if (button.dataset.explorerTab) {
        panel.hidden = true;
        navigate(button.dataset.explorerTab);
        return;
      }
      const target = button.dataset.explorerTarget;
      if (["settings","privacy","notifications","appearance"].includes(target)) {
        const settings = get("settingsPanel");
        if (settings) {
          closeContextualPanels();
          settings.hidden = false;
          settings.style.display = "block";
          settings.scrollTop = 0;
          const focusId = target === "appearance" ? "settingTheme" : target === "notifications" ? "settingSound" : target === "privacy" ? "settingPreview" : "settingTextSize";
          get(focusId)?.scrollIntoView({behavior:"smooth", block:"center"});
        }
      } else if (target === "profile") {
        panel.hidden = true;
        get("profileButton")?.click();
      } else if (target === "invite") {
        panel.hidden = true;
        navigate("tools");
        get("inviteMember")?.click();
      } else if (target === "assistant") {
        panel.hidden = true;
        navigate("tools");
        const assistant = get("assistantPanel");
        if (assistant) { closeContextualPanels(); assistant.hidden = false; assistant.style.display = "block"; assistant.scrollIntoView({behavior:"smooth", block:"start"}); }
      }
      if (button.hasAttribute("data-explorer-recheck")) runChecks();
    });
    runChecks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installExplorer, {once:true});
  } else {
    installExplorer();
  }

})();
