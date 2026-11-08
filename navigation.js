/* Navegación principal de klk: cinco destinos claros y herramientas agrupadas. */
(() => {
  "use strict";
  const tabs = ["chats", "contacts", "calls", "updates", "tools"];
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
    const isContacts = tab === "contacts";
    const search = get("homeSearch");
    const status = get("homeStatus");
    const filters = document.querySelector(".homeFilters");
    if (search) search.style.display = (isChats || isContacts) ? "block" : "none";
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
})();
