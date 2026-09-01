export function LiveReloadScript() {
  const source = `
(function () {
  if (window.__imLivePatch) return;
  window.__imLivePatch = true;
  var LABELS = {
    pending: "Pending",
    assigned: "Assigned",
    on_the_way: "On the way",
    in_progress: "In progress",
    completed: "Completed",
    cancelled: "Cancelled",
    available: "Available",
    on_job: "On job",
    off_shift: "Off shift"
  };
  function mark(live) {
    var el = document.querySelector("[data-live-indicator]");
    if (!el) return;
    el.setAttribute("data-connected", live ? "true" : "false");
    var label = el.querySelector("[data-live-label]");
    if (label) label.textContent = live ? "Live" : "Connecting";
  }
  function inr(n) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  }
  function compact(n) {
    return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  }
  function patchStatus(node, status) {
    if (!node) return;
    node.setAttribute("data-status", status);
    var text = node.querySelector("[data-status-label]") || node;
    if (text) text.textContent = LABELS[status] || status;
  }
  function applyBooking(b) {
    document.querySelectorAll("[data-booking-id='" + b.id + "']").forEach(function (row) {
      patchStatus(row.querySelector("[data-booking-status]"), b.status);
      var mech = row.querySelector("[data-booking-mechanic]");
      if (mech) mech.textContent = (b.mechanic && b.mechanic.name) || "Unassigned";
    });
  }
  function applyDashboard(d) {
    var k = d.kpis || {};
    var map = {
      totalBookings: compact(k.totalBookings || 0),
      todaysBookings: String(k.todaysBookings || 0),
      completedBookings: compact(k.completedBookings || 0),
      pendingBookings: String(k.pendingBookings || 0),
      cancelledBookings: String(k.cancelledBookings || 0),
      totalRevenue: inr(k.totalRevenue || 0),
      activeMechanics: String(k.activeMechanics || 0),
      newCustomers: String(k.newCustomers || 0)
    };
    Object.keys(map).forEach(function (key) {
      var el = document.querySelector("[data-kpi='" + key + "']");
      if (el) el.textContent = map[key];
    });
  }
  var dashTimer;
  function refreshKpis() {
    clearTimeout(dashTimer);
    dashTimer = setTimeout(function () {
      fetch("/api/dashboard", { cache: "no-store" })
        .then(function (r) { return r.json(); })
        .then(applyDashboard)
        .catch(function () {});
    }, 200);
  }
  try {
    var es = new EventSource("/api/events");
    es.onopen = function () { mark(true); };
    es.onerror = function () { mark(es.readyState === 1); };
    es.addEventListener("booking.updated", function (event) {
      mark(true);
      var parsed = {};
      try {
        parsed = JSON.parse(event.data);
        if (parsed && parsed.payload) applyBooking(parsed.payload);
      } catch (e) {}
      refreshKpis();
      window.dispatchEvent(new CustomEvent("im:booking-updated", { detail: parsed }));
    });
    es.addEventListener("notification", function (event) {
      try {
        var msg = JSON.parse(event.data);
        window.dispatchEvent(new CustomEvent("im:notice", { detail: (msg && msg.payload) || {} }));
      } catch (e) {}
    });
  } catch (e) {}
})();`;

  return <script dangerouslySetInnerHTML={{ __html: source }} />;
}
