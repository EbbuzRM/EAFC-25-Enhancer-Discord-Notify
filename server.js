require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 10000;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Funzione di parsing migliorata
const parseMessage = (data) => {
  try {
    const embed = data.embeds[0];
    const description = embed.description;

    // 1. Avvio Bot
    if (/Bot Started/i.test(description)) {
      return {
        type: 'start',
        color: 0x00FFFF, // Cyan
        fields: [{ name: "🚀 Stato", value: "Bot avviato", inline: false }]
      };
    }

    // 2. Arresto Bot
    if (/Bot Stopped/i.test(description)) {
      return {
        type: 'stop',
        color: 0xFF0000, // Rosso
        fields: [{ name: "⛔ Stato", value: "Bot arrestato", inline: false }]
      };
    }

    // 3. Statistiche
    if (/Profit:.*Coins:.*Search:.*Won:.*Lost:/i.test(description)) {
      const stats = description.match(/Profit: (.*?), Coins: (.*?), Search: (.*?), Won: (.*?), Lost: (.*)/i);
      return {
        type: 'stats',
        color: 0xFFFF00, // Giallo
        fields: [
          { name: "🪙 Monete", value: stats[2], inline: true },
          { name: "🔍 Ricerche", value: stats[3], inline: true },
          { name: "✅ Vinte", value: stats[4], inline: true },
          { name: "❌ Perse", value: stats[5], inline: true }
        ]
      };
    }

    // 4. Acquisto Fallito
    if (/Failed to Buy .+? at \d+ - Error Bid lost to another user/i.test(description)) {
      const match = description.match(/Failed to Buy (.+?) at (\d+) - Error Bid lost to another user/i);
      return {
        type: 'bidLost',
        color: 0xFF0000, // Rosso
        fields: [
          { name: "⚠️ Oggetto", value: match[1], inline: false },
          { name: "Prezzo ", value: `${match[2]} coins`, inline: true },
          { name: "Motivo", value: "Offerta superata", inline: true }
        ]
      };
    }

    // 5. Acquisto Riuscito
    if (/Successfully W: \d+ .+? at \d+, coins \d+/i.test(description)) {
      const match = description.match(/Successfully W: (\d+) (.+?) at (\d+), coins (\d+)/i);
      return {
        type: 'buy',
        color: 0x00FF00, // Verde
        fields: [
          { name: "🎉 Oggetto Acquistato", value: match[2], inline: false },
          { name: "Quantità", value: match[1], inline: true },
          { name: "Prezzo Unitario", value: `${match[3]} coins`, inline: true },
          { name: "Saldo Residuo", value: `${match[4]} coins`, inline: false }
        ]
      };
    }

    // 6. Vendita Oggetto
    if (/Successfully listed .+? for \d+ for 1 Hour, coins \d+/i.test(description)) {
      const match = description.match(/Successfully listed (.+?) for (\d+) for 1 Hour, coins (\d+)/i);
      return {
        type: 'sell',
        color: 0x0000FF, // Blu
        fields: [
          { name: "📦 Oggetto Listato", value: match[1], inline: false },
          { name: "Prezzo List", value: `${match[2]} coins`, inline: true },
          { name: "Durata", value: "1 Ora", inline: true },
          { name: "Saldo", value: `${match[3]} coins`, inline: false }
        ]
      };
    }

    // 7. Vendita con Profitto (FC26)
    if (/^.+ sold for \d+, profit is \d+, coins \d+/i.test(description)) {
      const match = description.match(/^(.+?) sold for (\d+), profit is (\d+), coins (\d+)/i);
      return {
        type: 'sold',
        color: 0x00FF00, // Verde
        fields: [
          { name: "💰 Oggetto Venduto", value: match[1], inline: false },
          { name: "Prezzo Vendita", value: `${match[2]} coins`, inline: true },
          { name: "Profitto", value: `${match[3]} coins`, inline: true },
          { name: "Saldo", value: `${match[4]} coins`, inline: false }
        ]
      };
    }

    return { type: 'unknown', color: 0x7289DA }; // Default

  } catch (error) {
    console.error('Errore parsing:', error);
    return { type: 'error', color: 0xFF0000 };
  }
};

app.post('/webhook', async (req, res) => {
  try {
    console.log("=== Richiesta ricevuta ===", JSON.stringify(req.body, null, 2));
    
    const result = parseMessage(req.body);
    
    if(result.type === 'error') {
      return res.status(400).send('Formato messaggio non valido');
    }

    const embed = {
      title: {
        'start': '🏁 Bot Avviato',
        'stop': '⛔ Bot Arrestato',
        'stats': '📊 Statistiche',
        'bidLost': '⚠️ Acquisto Fallito',
        'buy': '🛒 Acquisto Riuscito', 
        'sell': '📤 Vendita Effettuata',
        'sold': '💰 Vendita con Profitto'
      }[result.type] || '🔔 Notifica Generica',
      color: result.color,
      fields: result.fields,
      timestamp: new Date().toISOString()
    };

    await axios.post(DISCORD_WEBHOOK_URL, { embeds: [embed] });
    res.status(200).send('OK');

  } catch (error) {
    console.error('🔥 Errore critico:', error);
    res.status(500).send('Errore interno');
  }
});

app.get('/', (req, res) => res.send('✅ Server Online'));
app.listen(PORT, () => console.log(`🚀 Server attivo su http://localhost:${PORT}`));