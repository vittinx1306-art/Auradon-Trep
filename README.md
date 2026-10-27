# Auradon Noir (MVP)
Site estático (HTML/CSS/JS) + Firebase Auth + Firestore (plano Spark). Sem Storage, sem Cloud Functions, sem Cloudinary.

## Configurar
1. Firebase: projeto novo, Authentication > E-mail/senha ativado, Firestore criado.
2. Cole `firestore.rules` em Firestore > Regras > Publicar (**antes** de subir os arquivos).
3. Cole a config Web no topo de `firebase.js`.
4. Suba tudo (menos `firestore.rules` e `README.md`) na raiz do repositório; ative GitHub Pages.
5. Authentication > Domínios autorizados: `seuusuario.github.io`.

## Testar (precisa de 2 contas)
Conta A e conta B, cada uma com um personagem (idades dentro das preferências um do outro). A curte B, B curte A: match aparece em "Matches". Teste o chat, desfazer, bloquear e denunciar. Denúncias ficam na coleção `reports` (console do Firebase).
Emulador (opcional): `firebase emulators:start --only firestore,auth` para testar as regras localmente; o site publicado não depende disso.

## Limitações conhecidas
- Fotos ficam no Firestore (JPEG ~50-100 KB, 1 por personagem). Sem limpeza externa porque não há Storage.
- O UID do dono fica no documento do personagem (visível via DevTools). A tela nunca o mostra.
- Idade 18+ é autodeclaração. Moderação é manual (reports).
- Bloqueio: quem bloqueia some da sua descoberta; o bloqueado não vê aviso, mas curtidas/mensagens são impedidas.
- Cotas gratuitas do Firestore (leituras/escritas/dia, 1 GiB) não são ilimitadas: confira em firebase.google.com/pricing. A descoberta lê ~20 perfis por lote.
- Não há "rever perfis passados", denúncia de mensagem individual nem aba "Mensagens" separada (o chat fica em Matches).
- Se dois personagens trocarem de conta de match após desfazer, o match não reabre (por desenho).
