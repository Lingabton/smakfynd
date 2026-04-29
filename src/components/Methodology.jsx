// src/components/Methodology.jsx
function Methodology() {
  return (
    <div style={{
      maxWidth: 640, margin: "0 auto", padding: "80px 20px 60px",
      borderTop: `1px solid ${t.bdrL}`,
    }}>
      <h2 style={{
        margin: "0 0 20px", fontSize: 24,
        fontFamily: t.serif, fontWeight: 400,
        color: t.tx, lineHeight: 1.2,
      }}>Så fungerar Smakfynd-poängen</h2>

      <p style={{ margin: "0 0 16px", fontSize: 14, color: t.txM, lineHeight: 1.7 }}>
        Varje vin får en poäng mellan 0 och 100, baserad på tre saker:
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
        <div>
          <div style={{ marginBottom: 2 }}>
            <span style={{ fontFamily: t.serif, fontSize: 20, color: t.tx }}>75 %</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: t.tx, marginLeft: 8 }}>Kvalitet</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: t.txM, lineHeight: 1.6 }}>
            Vägt snitt av crowd-betyg från Vivino och expertbetyg från upp till sex kritiker (Suckling, Decanter, Falstaff m.fl.). Konsensusbonus när crowd och experter är överens.
          </p>
        </div>

        <div>
          <div style={{ marginBottom: 2 }}>
            <span style={{ fontFamily: t.serif, fontSize: 20, color: t.tx }}>25 %</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: t.tx, marginLeft: 8 }}>Prisvärde</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: t.txM, lineHeight: 1.6 }}>
            Literpriset jämfört med medianen i samma kategori. Ett rött vin för 112 kr får hög prisvärde-poäng eftersom medianen är 279 kr.
          </p>
        </div>

        <div>
          <div style={{ marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: t.tx }}>Eko-bonus</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: t.txM, lineHeight: 1.6 }}>
            En liten bonus för ekologiska viner.
          </p>
        </div>
      </div>

      <p style={{ margin: "0 0 0", fontSize: 14, color: t.tx, lineHeight: 1.7, fontWeight: 500 }}>
        Resultatet: en enda siffra som säger hur mycket smak du får per krona — inte hur prestigefullt vinet är.
      </p>

      <hr style={{ border: "none", borderTop: `1px solid ${t.bdrL}`, margin: "28px 0 20px" }} />

      <p style={{ margin: 0, fontSize: 12, color: t.txL, lineHeight: 1.7, fontStyle: "italic" }}>
        Smakfynd är byggt av Gabriel Linton, forskare i entreprenörskap och innovation. Sajten finns för att Systembolagets sortiment är svårnavigerat och vinguider tenderar att ranka "bäst" snarare än "smartast köp". Ingen koppling till Systembolaget. Drivs av Olav Innovation AB.
      </p>
    </div>
  );
}
