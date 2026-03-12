export default function Terms() {
  const s: [string, string][] = [
    ["Acceptance", "By using CreatorBrain you agree to these terms."],
    ["Use", "Lawful purposes only. No violating YouTube ToS."],
    ["No Guarantees", "Analytics provided as-is. No accuracy guarantees."],
    ["YouTube API", "Subject to YouTube Terms of Service (youtube.com/t/terms)."],
    ["Modifications", "We may modify or discontinue the service anytime."],
    ["Liability", "Not liable for damages from use of service."],
    ["Contact", "creatorbrain.app@gmail.com"],
  ];
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px", color: "#a1a1aa", lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f0f0f1", marginBottom: 4 }}>Terms of Service</h1>
      <p style={{ fontSize: 13, color: "#52525b", marginBottom: 32 }}>Last updated: March 2026</p>
      {s.map(([t, b]) => (
        <div key={t} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f1", marginBottom: 4 }}>{t}</h2>
          <p style={{ fontSize: 14 }}>{b}</p>
        </div>
      ))}
    </div>
  );
}
