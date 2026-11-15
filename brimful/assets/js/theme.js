// Runs before first paint so the saved theme and motion choice apply without a flash. No tracking.
(function () {
  try {
    var s = JSON.parse(localStorage.getItem("brimful:v1") || "null");
    var st = (s && s.settings) || {};
    if (st.theme === "dark" || st.theme === "light") document.documentElement.dataset.theme = st.theme;
    if (st.motion === "off") document.documentElement.dataset.motion = "off";
  } catch (e) { /* storage unavailable: defaults apply */ }
})();
