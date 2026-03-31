# EAFC 25/26 Enhancer Discord Notify

Server Node.js che funge da ponte tra il bot di trading FC Enhancer e Discord. Riceve notifiche dal bot, le parsea e le inoltra formattate tramite webhook Discord.

## Funzionalità

- 🛒 Acquisto riuscito
- 📤 Vendita effettuata
- 💰 Vendita con profitto (FC26)
- ⚠️ Acquisto fallito (offerta superata)
- 📊 Statistiche bot
- 🚀 Avvio/arresto bot

## Installazione

```bash
npm install
```

## Configurazione

Crea un file `.env`:

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL
PORT=3800
```

## Utilizzo

```bash
node server.js
```

Il server sarà attivo su `http://localhost:3800`.

## Configurazione Bot

Imposta l'URL del webhook nel bot FC Enhancer a:

```
http://localhost:3800/webhook
```
