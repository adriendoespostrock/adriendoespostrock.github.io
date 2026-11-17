# Déploiement de Mes bus

La page est publiée séparément à l’adresse `https://adriendoespostrock.github.io/bus/`. Le dépôt et cette page sont publics; l’URL seule ne constitue pas une protection. Le proxy refuse les appels sans code d’accès.

## Activer les horaires

1. Dans Cloudflare, ouvre **Workers & Pages**, crée un Worker, puis colle le contenu de `worker.js` et déploie-le.
2. Dans les paramètres du Worker, ajoute deux secrets chiffrés :
   - `IDFM_API_KEY` : ta clé PRIM.
   - `APP_ACCESS_CODE` : un mot de passe long que tu choisis.
3. Ouvre la page `/bus/`, touche **Réglages**, saisis l’URL HTTPS du Worker (par exemple `https://nom-du-worker.<compte>.workers.dev`) et le même code d’accès.

La clé PRIM reste dans Cloudflare et n’est jamais envoyée au navigateur. La page n’interroge l’API que lorsque tu touches « Récupérer les horaires »; ouvrir la page ou changer d’arrêt ne lance aucun appel. Dans Réglages, tu peux choisir de mémoriser le code d’accès dans le stockage local de Safari pour le retrouver après actualisation. Garde-le privé : toute personne qui le possède peut appeler le proxy.

Les références utilisées sont configurées dans `worker.js`. L’API IDFM doit être autorisée pour la clé et pour les lignes interrogées.
