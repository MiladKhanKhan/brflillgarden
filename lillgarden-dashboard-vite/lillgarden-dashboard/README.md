# Brf Lillgården – Ekonomisk uppföljning

En liten webbdashboard för att följa upp resultat- och balansräkning per
kvartal, med jämförelse över tid och nyckeltal per kvadratmeter.

Datan för Q1 2023–Q2 2026 är förifylld. Nya kvartal lägger du till direkt i
appen under "Data & perioder" – allt sparas i din webbläsares **localStorage**
(dvs. lokalt på din dator, i den webbläsare du använder).

> **Viktigt om data:** Eftersom datan sparas i webbläsaren ser olika personer
> (eller du i en annan webbläsare/dator) inte automatiskt samma uppdateringar.
> Om flera i styrelsen ska kunna mata in och se samma siffror behövs en delad
> databas istället – hör av dig om du vill bygga om till det (t.ex. med
> Supabase, som har ett gratis-tier som räcker gott för det här).

---

## 1. Testa lokalt (valfritt)

Kräver [Node.js](https://nodejs.org/) (version 18 eller senare).

```bash
npm install
npm run dev
```

Öppna länken som visas (oftast `http://localhost:5173`).

---

## 2. Lägg upp på GitHub

1. Skapa ett konto på [github.com](https://github.com) om du inte redan har ett.
2. Skapa ett nytt repository (kan vara privat eller publikt).
3. Ladda upp alla filer i den här mappen till repot. Enklast:
   - Via GitHub Desktop (grafiskt program), eller
   - Via webbläsaren: "Add file" → "Upload files" → dra in alla filer/mappar.

---

## 3. Hosta på Vercel (gratis)

1. Skapa ett konto på [vercel.com](https://vercel.com) – logga in med ditt
   GitHub-konto, det är enklast.
2. Klicka "Add New..." → "Project".
3. Välj ditt repo (Lillgården-dashboarden).
4. Vercel känner automatiskt igen att det är ett Vite-projekt – lämna
   inställningarna som de är.
5. **Lösenordsskydd (valfritt men rekommenderat):** under "Environment
   Variables", lägg till:
   - Name: `VITE_SITE_PASSWORD`
   - Value: ett lösenord ni i styrelsen kommer överens om
6. Klicka "Deploy".

Efter någon minut får du en länk, t.ex. `lillgarden-ekonomi.vercel.app`, som
du kan dela med styrelsen/medlemmarna.

### Uppdatera sajten senare

Varje gång du ändrar kod och laddar upp den (pushar) till GitHub bygger
Vercel om sajten automatiskt. Inga manuella steg behövs.

### Byta lösenord senare

Gå till projektet i Vercel → Settings → Environment Variables → ändra
`VITE_SITE_PASSWORD` → klicka "Redeploy" (under Deployments-fliken, tre
prickar på senaste deploy → Redeploy).

---

## 4. Alternativ: Netlify

Samma princip som Vercel:

1. Skapa konto på [netlify.com](https://netlify.com), logga in med GitHub.
2. "Add new site" → "Import an existing project" → välj ditt repo.
3. Build command: `npm run build`, Publish directory: `dist`.
4. Lägg till miljövariabeln `VITE_SITE_PASSWORD` under Site settings →
   Environment variables.
5. Deploy.

---

## Om lösenordsskyddet

Skyddet i den här appen är medvetet enkelt: ett gemensamt lösenord som
styrelsen delar. Det stoppar förbipasserande och sökmotorer, men är **inte**
skydd mot någon som aktivt vill komma åt sidan (lösenordet syns i den
byggda koden för den som letar). För föreningens ekonomiska data, som till
stor del ändå är offentlig via årsredovisningen, är det normalt en rimlig
nivå. Om ni vill ha riktig inloggning per person kan Cloudflare Access
(gratis) läggas på framför sajten – säg till om du vill ha hjälp med det.

---

## Filstruktur

```
src/
  data.js           – kontokategorier + förifylld kvartalsdata
  useLocalStorage.js – sparar inställningar/perioder i webbläsaren
  PasswordGate.jsx  – enkelt lösenordsskydd
  App.jsx           – hela dashboarden (översikt, RR, BR, dataformulär)
  main.jsx, index.css
```
