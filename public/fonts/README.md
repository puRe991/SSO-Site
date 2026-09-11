# Schriften

| Schrift | Rolle | Lizenz | Quelle |
| --- | --- | --- | --- |
| Fraunces (Variable) | Überschriften, Logo, Eyebrows (`--font-display`) | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Fraunces |
| Nunito (Variable) | Fließtext, UI (`--font-body`) | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Nunito |

Beide Familien sind als Variable Fonts eingebunden (eine Datei pro Subset deckt
den kompletten Gewichtsbereich ab) und werden selbst ausgeliefert, damit keine
Anfragen an Google-Server gehen. Die `@font-face`-Regeln stehen in
`src/styles/fonts.css`.

Zum Aktualisieren: Subsets `latin` und `latin-ext` von Google Fonts als woff2
ziehen und die Dateien hier unter gleichem Namen ersetzen.
