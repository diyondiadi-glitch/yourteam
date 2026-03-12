export default function Privacy() {
  const s: [string, string][] = [
    ["Information We Collect", "We collect your YouTube channel data (name, subs, video titles, views, thumbnails) from the public YouTube Data API. Stored only in your browser localStorage. Never on our servers."],
    ["How We Use It", "Used solely to provide AI analytics. Never sold or shared."],
    ["Google OAuth", "Optional. Read-only access. Revoke anytime at myaccount.google.com/permissions."],
    ["Data Storage", "Browser localStorage only. Disconnecting removes all data instantly."],
    ["YouTube API", "By using CreatorBrain you agree to YouTube Terms (youtube.com/t/terms) and Google Privacy Policy (policies.google.com/privacy)."],
    ["Cookies", "No tracking cookies."],
    ["Children", "Not for under 13s."],
    ["Contact", "creatorbrain.app@gmail.com"],
  ];
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px", color: "#a1a1aa", lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f0f0f1", marginBottom: 4 }}>Privacy Policy</h1>
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
