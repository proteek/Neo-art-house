document.addEventListener("DOMContentLoaded", async () => {
  const list = document.querySelector("[data-admin-cases]");
  if (!list || !window.NAH_FIREBASE) return;
  await nahRequireAdmin();
  const search = document.querySelector("[data-admin-search]");
  const status = document.querySelector("[data-admin-status]");
  const draw = () => {
    const q = (search?.value || "").toLowerCase();
    const s = status?.value || "";
    const rows = [...adminCases]
      .sort((a,b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .filter(c => (!s || c.status === s) && (!q || JSON.stringify(c).toLowerCase().includes(q)));
    list.innerHTML = rows.length
      ? rows.map(caseSummary).join("")
      : '<div class="empty-state"><h3>No cases yet.</h3><p>New client submissions will appear here automatically.</p></div>';
    list.querySelectorAll("[data-case-id]").forEach(b => b.addEventListener("click", () => renderAdminDetail(caseById(b.dataset.caseId))));
  };
  search?.addEventListener("input", draw);
  status?.addEventListener("change", draw);
  list.innerHTML = '<div class="empty-state"><p>Connecting to Firestore…</p></div>';
  window.NAH_FIREBASE.db.collection("reviewCases").onSnapshot(
    snap => {
      adminCases = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      draw();
    },
    err => {
      console.error(err);
      list.innerHTML = '<div class="empty-state"><h3>Could not load cases.</h3><p>Firestore returned an access or connection error.</p></div>';
    }
  );
});