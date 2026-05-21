const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ]
});

// ─────────────────────────────────────────────
// PRIX DES RESSOURCES DE BASE (modifiables)
// ─────────────────────────────────────────────
let prixRessources = {
  buche: 10,          // 1 bûche = 10€
  pepiteMagnetite: 1, // 1 pépite magnétite = 1€
  pepiteCuivre: 12,   // 1 pépite cuivre = 12€
};

// ─────────────────────────────────────────────
// MARGE (%) appliquée sur le coût de revient
// ─────────────────────────────────────────────
let marge = 15; // 15% de marge par défaut

// ─────────────────────────────────────────────
// CATALOGUE DES MEUBLES
// Chaque meuble est défini par ses ressources de base
// ─────────────────────────────────────────────
const catalogue = {
  // ── MEUBLES MÉTAL ──
  "fut en metal": {
    nom: "Fût en métal",
    categorie: "Métal",
    ressources: { pepiteMagnetite: 55 }
  },
  "etagere metal": {
    nom: "Étagère métal",
    categorie: "Métal",
    ressources: { pepiteMagnetite: 22 }
  },
  "seau": {
    nom: "Seau",
    categorie: "Métal",
    ressources: { pepiteMagnetite: 33 }
  },
  "grand casier": {
    nom: "Grand casier",
    categorie: "Métal",
    ressources: { pepiteMagnetite: 88 }
  },
  "chaise metal": {
    nom: "Chaise métal",
    categorie: "Métal",
    ressources: { pepiteMagnetite: 22 }
  },
  "bureau industriel": {
    nom: "Bureau industriel",
    categorie: "Métal",
    ressources: { pepiteMagnetite: 33, buche: 1 }
  },
  "evier industriel": {
    nom: "Évier industriel",
    categorie: "Métal",
    ressources: { pepiteMagnetite: 33, pepiteCuivre: 6 }
  },
  "etagere de police": {
    nom: "Étagère de police",
    categorie: "Métal",
    ressources: { pepiteMagnetite: 220 }
  },
  "barriere vauban": {
    nom: "Barrière Vauban",
    categorie: "Métal",
    ressources: { pepiteMagnetite: 11 }
  },

  // ── MEUBLES BOIS ──
  "table basse bois": {
    nom: "Table basse bois",
    categorie: "Bois",
    ressources: { buche: 2 }
  },
  "table": {
    nom: "Table",
    categorie: "Bois",
    ressources: { buche: 2.5 }
  },
  "table exterieur bois": {
    nom: "Table extérieur bois",
    categorie: "Bois",
    ressources: { buche: 5 }
  },
  "chaise bois": {
    nom: "Chaise bois",
    categorie: "Bois",
    ressources: { buche: 2.5 }
  },
  "caillebotis": {
    nom: "Caillebotis",
    categorie: "Bois",
    ressources: { buche: 2 }
  },
  "cajot": {
    nom: "Cajot",
    categorie: "Bois",
    ressources: { buche: 3 }
  },
  "volet bois": {
    nom: "Volet bois",
    categorie: "Bois",
    ressources: { buche: 3 }
  },
  "etagere bois": {
    nom: "Étagère bois",
    categorie: "Bois",
    ressources: { buche: 4 }
  },
  "table de nuit 1": {
    nom: "Table de nuit (1)",
    categorie: "Bois",
    ressources: { buche: 3 }
  },
  "table de nuit 2": {
    nom: "Table de nuit (2)",
    categorie: "Bois",
    ressources: { buche: 4 }
  },
  "table de nuit 3": {
    nom: "Table de nuit (3)",
    categorie: "Bois",
    ressources: { buche: 3 }
  },
  "comptoir de vente": {
    nom: "Comptoir de vente",
    categorie: "Bois",
    ressources: { buche: 5 }
  },
  "tabouret bois": {
    nom: "Tabouret bois",
    categorie: "Bois",
    ressources: { buche: 4 }
  },
  "etabli maison": {
    nom: "Établi maison",
    categorie: "Bois",
    ressources: { buche: 7.5 }
  },
  "caisse bois": {
    nom: "Caisse bois",
    categorie: "Bois",
    ressources: { buche: 4 }
  },
  "etagere murale": {
    nom: "Étagère murale",
    categorie: "Mixte",
    ressources: { buche: 1, pepiteMagnetite: 5.5 }
  },
  "etagere murale 1.8m": {
    nom: "Étagère murale 1.8m",
    categorie: "Mixte",
    ressources: { buche: 1.5, pepiteMagnetite: 5.5 }
  },
  "cagette de fruits": {
    nom: "Cagette de fruits",
    categorie: "Bois",
    ressources: { buche: 1 }
  },
};

// ─────────────────────────────────────────────
// FONCTIONS UTILITAIRES
// ─────────────────────────────────────────────

function calculerPrix(meuble, quantite = 1) {
  let coutRevient = 0;
  for (const [ressource, qte] of Object.entries(meuble.ressources)) {
    coutRevient += prixRessources[ressource] * qte;
  }
  coutRevient *= quantite;
  const prixVente = coutRevient * (1 + marge / 100);
  return { coutRevient, prixVente };
}

function nomRessource(key) {
  const noms = {
    buche: "Bûche",
    pepiteMagnetite: "Pépite de magnétite",
    pepiteCuivre: "Pépite de cuivre",
  };
  return noms[key] || key;
}

function trouverMeuble(nom) {
  const cle = nom.toLowerCase().trim();
  // Recherche exacte
  if (catalogue[cle]) return catalogue[cle];
  // Recherche partielle
  for (const [k, v] of Object.entries(catalogue)) {
    if (k.includes(cle) || v.nom.toLowerCase().includes(cle)) return v;
  }
  return null;
}

// ─────────────────────────────────────────────
// ÉVÉNEMENTS DU BOT
// ─────────────────────────────────────────────

client.once('ready', () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const contenu = message.content.trim();
  if (!contenu.startsWith('!')) return;

  const args = contenu.slice(1).split(' ');
  const commande = args.shift().toLowerCase();

  // ──────────────────────────────
  // !aide — affiche toutes les commandes
  // ──────────────────────────────
  if (commande === 'aide') {
    const embed = new EmbedBuilder()
      .setTitle('📋 Commandes du bot PCB & Co')
      .setColor(0x2b2d31)
      .addFields(
        {
          name: '🛒 Commandes clients',
          value:
            '`!prix [meuble] [quantité]` — Calcule le prix d\'un meuble\n' +
            '`!catalogue` — Affiche tous les meubles disponibles\n' +
            '`!commande [meuble] [quantité]` — Passe une commande'
        },
        {
          name: '🔧 Commandes PDG (salon privé uniquement)',
          value:
            '`!setprix [ressource] [prix]` — Modifie le prix d\'une ressource\n' +
            '`!setmarge [%]` — Modifie la marge appliquée\n' +
            '`!ressources` — Affiche les prix actuels des ressources'
        }
      )
      .setFooter({ text: 'PCB & Co — Bot de gestion' });
    return message.reply({ embeds: [embed] });
  }

  // ──────────────────────────────
  // !catalogue — liste tous les meubles
  // ──────────────────────────────
  if (commande === 'catalogue') {
    const parCategorie = {};
    for (const meuble of Object.values(catalogue)) {
      if (!parCategorie[meuble.categorie]) parCategorie[meuble.categorie] = [];
      parCategorie[meuble.categorie].push(meuble.nom);
    }

    const embed = new EmbedBuilder()
      .setTitle('📦 Catalogue PCB & Co')
      .setColor(0x5865F2);

    for (const [cat, meubles] of Object.entries(parCategorie)) {
      const emoji = cat === 'Bois' ? '🪵' : cat === 'Métal' ? '🔩' : '🔧';
      embed.addFields({ name: `${emoji} ${cat}`, value: meubles.join('\n') });
    }

    return message.reply({ embeds: [embed] });
  }

  // ──────────────────────────────
  // !prix [meuble] [quantité?]
  // ──────────────────────────────
  if (commande === 'prix') {
    const quantite = parseInt(args[args.length - 1]);
    const qte = isNaN(quantite) ? 1 : quantite;
    const nomMeuble = isNaN(quantite) ? args.join(' ') : args.slice(0, -1).join(' ');

    if (!nomMeuble) return message.reply('❌ Usage : `!prix [nom du meuble] [quantité facultative]`');

    const meuble = trouverMeuble(nomMeuble);
    if (!meuble) return message.reply(`❌ Meuble introuvable : **${nomMeuble}**\nTape \`!catalogue\` pour voir la liste.`);

    const { coutRevient, prixVente } = calculerPrix(meuble, qte);

    const detailRessources = Object.entries(meuble.ressources)
      .map(([r, q]) => `• ${nomRessource(r)} : ${q * qte} × ${prixRessources[r]}€ = **${(q * qte * prixRessources[r]).toFixed(2)}€**`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setTitle(`💰 Prix — ${meuble.nom}${qte > 1 ? ` × ${qte}` : ''}`)
      .setColor(0x57F287)
      .addFields(
        { name: '📦 Ressources nécessaires', value: detailRessources },
        { name: '🏭 Coût de revient', value: `${coutRevient.toFixed(2)}€`, inline: true },
        { name: `📈 Prix de vente (marge ${marge}%)`, value: `**${prixVente.toFixed(2)}€**`, inline: true }
      );

    return message.reply({ embeds: [embed] });
  }

  // ──────────────────────────────
  // !commande [meuble] [quantité?]
  // ──────────────────────────────
  if (commande === 'commande') {
    const quantite = parseInt(args[args.length - 1]);
    const qte = isNaN(quantite) ? 1 : quantite;
    const nomMeuble = isNaN(quantite) ? args.join(' ') : args.slice(0, -1).join(' ');

    if (!nomMeuble) return message.reply('❌ Usage : `!commande [nom du meuble] [quantité facultative]`');

    const meuble = trouverMeuble(nomMeuble);
    if (!meuble) return message.reply(`❌ Meuble introuvable : **${nomMeuble}**\nTape \`!catalogue\` pour voir la liste.`);

    const { prixVente } = calculerPrix(meuble, qte);

    const embed = new EmbedBuilder()
      .setTitle('🛒 Nouvelle commande')
      .setColor(0xFEE75C)
      .addFields(
        { name: 'Client', value: `<@${message.author.id}>`, inline: true },
        { name: 'Meuble', value: meuble.nom, inline: true },
        { name: 'Quantité', value: `${qte}`, inline: true },
        { name: 'Prix total', value: `**${prixVente.toFixed(2)}€**`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'PCB & Co — En attente de traitement' });

    await message.reply({ embeds: [embed] });

    // Notifie dans le canal si c'est un salon public
    return message.channel.send(`📣 <@${message.guild.ownerId}> — Nouvelle commande de <@${message.author.id}> !`);
  }

  // ──────────────────────────────
  // !ressources — affiche les prix actuels
  // ──────────────────────────────
  if (commande === 'ressources') {
    const embed = new EmbedBuilder()
      .setTitle('📊 Prix actuels des ressources')
      .setColor(0xEB459E)
      .addFields(
        { name: '🪵 Bûche', value: `${prixRessources.buche}€`, inline: true },
        { name: '🔩 Pépite de magnétite', value: `${prixRessources.pepiteMagnetite}€`, inline: true },
        { name: '🟠 Pépite de cuivre', value: `${prixRessources.pepiteCuivre}€`, inline: true },
        { name: '📈 Marge appliquée', value: `${marge}%`, inline: true }
      );
    return message.reply({ embeds: [embed] });
  }

  // ──────────────────────────────
  // !setprix [ressource] [prix] — PDG uniquement
  // ──────────────────────────────
  if (commande === 'setprix') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Commande réservée au PDG.');
    }

    const ressource = args[0]?.toLowerCase();
    const prix = parseFloat(args[1]);

    const mapping = {
      'buche': 'buche',
      'bûche': 'buche',
      'magnetite': 'pepiteMagnetite',
      'magnétite': 'pepiteMagnetite',
      'cuivre': 'pepiteCuivre',
    };

    const cle = mapping[ressource];
    if (!cle) return message.reply('❌ Ressource inconnue. Utilise : `buche`, `magnetite`, `cuivre`');
    if (isNaN(prix) || prix <= 0) return message.reply('❌ Prix invalide.');

    prixRessources[cle] = prix;
    return message.reply(`✅ Prix de **${nomRessource(cle)}** mis à jour : **${prix}€**`);
  }

  // ──────────────────────────────
  // !setmarge [%] — PDG uniquement
  // ──────────────────────────────
  if (commande === 'setmarge') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Commande réservée au PDG.');
    }

    const nouvelleMarge = parseFloat(args[0]);
    if (isNaN(nouvelleMarge) || nouvelleMarge < 0) return message.reply('❌ Marge invalide.');

    marge = nouvelleMarge;
    return message.reply(`✅ Marge mise à jour : **${marge}%**`);
  }
});

const token = process.env.TOKEN;
console.log("Token trouvé:", token ? "OUI" : "NON");
client.login(token);
