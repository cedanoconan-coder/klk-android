/* Navegación independiente de klk: no depende del bloque principal de la aplicación. */
(() => {
  "use strict";
  const tabs = ["chats", "calls", "updates", "tools", "assistant"];
  const panelIds = ["chatsPanel", "requestsPanel", "peopleList", "callsPanel", "updatesPanel", "toolsPanel", "assistantPanel"];

  function navigate(tab) {
    if (!tabs.includes(tab)) return;
    const get = id => document.getElementById(id);
    const home = get("homeView");
    if (home) home.style.display = "block";

    panelIds.forEach(id => {
      const panel = get(id);
      if (panel) {
        panel.hidden = false;
        panel.style.display = "none";
      }
    });

    const isChats = tab === "chats";
    const search = get("homeSearch");
    const status = get("homeStatus");
    const filters = document.querySelector(".homeFilters");
    if (search) search.style.display = isChats ? "block" : "none";
    if (status) status.style.display = isChats ? "block" : "none";
    if (filters) filters.style.display = isChats ? "flex" : "none";

    if (isChats) {
      const chats = get("chatsPanel");
      if (chats) chats.style.display = "block";
      const requests = get("requestsPanel");
      const people = get("peopleList");
      if (requests) requests.style.display = "none";
      if (people) people.style.display = "none";
      const chatsFilter = document.querySelector('.homeFilters button[data-filter="chats"]');
      if (chatsFilter) {
        document.querySelectorAll(".homeFilters button").forEach(button => {
          button.classList.toggle("active", button === chatsFilter);
        });
      }
    } else {
      const panel = get(tab === "calls" ? "callsPanel" :
        tab === "updates" ? "updatesPanel" :
        tab === "tools" ? "toolsPanel" : "assistantPanel");
      if (panel) panel.style.display = "block";
    }

    document.querySelectorAll(".homeBottom button").forEach(button => {
      button.classList.toggle("active", button.dataset.tab === tab);
    });
    if (tab === "assistant") {
      const panel = get("assistantPanel");
      if (panel) panel.scrollIntoView({ block: "start", behavior: "smooth" });
    }
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
})();