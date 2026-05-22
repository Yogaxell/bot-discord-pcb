const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ChannelType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

// ─────────────────────────────────────────────
// CATÉGORIE DES COMMANDES
// ─────────────────────────────────────────────
const CATEGORIE_COMMANDES_ID = '1507304750641582102';

// ─────────────────────────────────────────────
// PRIX DES RESSOURCES (pour calcul PDG)
// ─────────────────────────────────────────────
let prixRessources = {
  buche: 10,
  pepiteMagnetite: 1,
  pepiteCuivre: 12,
  pepiteOr: 4,
};

// ─────────────────────────────────────────────
// CATALOGUE AVEC PRIX FIXES
// ─────────────────────────────────────────────
const catalogue = {
  // ── MÉTAL ──
  "chaise_metal":       { nom: "Chaise en métal",     categorie: "Métal",  prix: 75  },
  "fut_metal":          { nom: "Fût en métal",         categorie: "Métal",  prix: 85  },
  "seau":               { nom: "Seau",                 categorie: "Métal",  prix: 45  },
  "barriere_vauban":    { nom: "Barrière Vauban",      categorie: "Métal",  prix: 32  },
  "bureau_industriel":  { nom: "Bureau industriel",    categorie: "Métal",  prix: 210 },
  "grand_casier":       { nom: "Grand casier",         categorie: "Métal",  prix: 320 },
  "evier_industriel":   { nom: "Évier industriel",     categorie: "Métal",  prix: 210 },
  "etagere_police":     { nom: "Étagère de police",    categorie: "Métal",  prix: 950 },
  "etagere_metal":      { nom: "Étagère métal",        categorie: "Métal",  prix: 150 },

  // ── BOIS ──
  "table_basse_bois":   { nom: "Table basse bois",     categorie: "Bois",   prix: 32  },
  "table":              { nom: "Table",                categorie: "Bois",   prix: 25  },
  "table_exterieur":    { nom: "Table extérieur bois", categorie: "Bois",   prix: 110 },
  "chaise_bois":        { nom: "Chaise bois",          categorie: "Bois",   prix: 85  },
  "caillebotis":        { nom: "Caillebotis",          categorie: "Bois",   prix: 20  },
  "cajot":              { nom: "Cajot",                categorie: "Bois",   prix: 45  },
  "volet_bois":         { nom: "Volet bois",           categorie: "Bois",   prix: 95  },
  "etagere_bois":       { nom: "Étagère bois",         categorie: "Bois",   prix: 130 },
  "table_nuit_1":       { nom: "Table de nuit (1)",    categorie: "Bois",   prix: 42  },
  "table_nuit_2":       { nom: "Table de nuit (2)",    categorie: "Bois",   prix: 115 },
  "table_nuit_3":       { nom: "Table de nuit (3)",    categorie: "Bois",   prix: 50  },
  "comptoir_vente":     { nom: "Comptoir de vente",    categorie: "Bois",   prix: 170 },
  "tabouret_bois":      { nom: "Tabouret bois",        categorie: "Bois",   prix: 105 },
  "etabli_maison":      { nom: "Établi maison",        categorie: "Bois",   prix: 85  },
  "caisse_bois":        { nom: "Caisse bois",          categorie: "Bois",   prix: 115 },
  "etagere_murale":     { nom: "Étagère murale",       categorie: "Mixte",  prix: 35  },
  "etagere_murale_18":  { nom: "Étagère murale 1.8m",  categorie: "Mixte",  prix: 45  },
  "cagette_fruits":     { nom: "Cagette de fruits",    categorie: "Bois",   prix: 30  },
};

// ─────────────────────────────────────────────
// COMMANDES EN COURS (panier)
// ─────────────────────────────────────────────
const paniers = new Map(); // userId -> [{ nom, qte, prix }]
const attenteSaisie = new Map(); // userId -> { type, ... }

// IDs messages permanents
let messageVenteId = null;
let messagePDGId = null;
let channelVenteId = null;
let channelPDGId = null;

// ─────────────────────────────────────────────
// BUILDERS
// ─────────────────────────────────────────────
function buildCatalogueEmbed() {
  const parCategorie = {};
  for (const [id, meuble] of Object.entries(catalogue)) {
    if (!parCategorie[meuble.categorie]) parCategorie[meuble.categorie] = [];
    parCategorie[meuble.categorie].push(`• ${meuble.nom} — **${meuble.prix}€**`);
  }

  const embed = new EmbedBuilder()
    .setTitle('🏪 PCB & Co — Catalogue')
    .setColor(0x2b2d31)
    .setDescription('Cliquez sur **Passer commande** pour passer votre commande !');

  for (const [cat, lignes] of Object.entries(parCategorie)) {
    const emoji = cat === 'Bois' ? '🪵' : cat === 'Métal' ? '🔩' : '🔧';
    embed.addFields({ name: `${emoji} ${cat}`, value: lignes.join('\n') });
  }

  return embed;
}

function buildCatalogueButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('passer_commande')
      .setLabel('🛒 Passer commande')
      .setStyle(ButtonStyle.Primary)
  );
}

function buildPDGEmbed() {
  return new EmbedBuilder()
    .setTitle('⚙️ Interface PDG — Gestion des prix')
    .setColor(0xED4245)
    .addFields(
      { name: '🪵 Bûche', value: `${prixRessources.buche}€`, inline: true },
      { name: '🔩 Magnétite', value: `${prixRessources.pepiteMagnetite}€`, inline: true },
      { name: '🟠 Cuivre', value: `${prixRessources.pepiteCuivre}€`, inline: true },
      { name: '✨ Or', value: `${prixRessources.pepiteOr}€`, inline: true },
    )
    .setDescription('Modifiez les prix des ressources puis cliquez sur **Actualiser le catalogue**.')
    .setTimestamp();
}

function buildPDGButtons() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('set_buche').setLabel('Bûche').setStyle(ButtonStyle.Secondary).setEmoji('🪵'),
    new ButtonBuilder().setCustomId('set_magnetite').setLabel('Magnétite').setStyle(ButtonStyle.Secondary).setEmoji('🔩'),
    new ButtonBuilder().setCustomId('set_cuivre').setLabel('Cuivre').setStyle(ButtonStyle.Secondary).setEmoji('🟠'),
    new ButtonBuilder().setCustomId('set_or').setLabel('Or').setStyle(ButtonStyle.Secondary).setEmoji('✨'),
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('actualiser_catalogue').setLabel('🔄 Actualiser le catalogue').setStyle(ButtonStyle.Success),
  );
  return [row1, row2];
}

function buildPanierEmbed(userId) {
  const panier = paniers.get(userId) || [];
  const total = panier.reduce((acc, item) => acc + item.prix * item.qte, 0);

  const embed = new EmbedBuilder()
    .setTitle('🛒 Votre commande en cours')
    .setColor(0x5865F2);

  if (panier.length === 0) {
    embed.setDescription('Votre panier est vide.');
  } else {
    const lignes = panier.map(item => `• ${item.nom} × ${item.qte} = **${item.prix * item.qte}€**`).join('\n');
    embed.setDescription(lignes);
    embed.addFields({ name: '💰 Total', value: `**${total}€**` });
  }

  return embed;
}

function buildMenuMeubles(page = 0) {
  const entries = Object.entries(catalogue);
  const start = page * 25;
  const slice = entries.slice(start, start + 25);

  const options = slice.map(([id, m]) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(m.nom)
      .setValue(id)
      .setDescription(`${m.prix}€`)
  );

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`choisir_meuble_${page}`)
      .setPlaceholder('Choisissez un meuble...')
      .addOptions(options)
  );

  return row;
}

function buildPanierButtons(userId) {
  const panier = paniers.get(userId) || [];
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ajouter_meuble')
      .setLabel('➕ Ajouter un meuble')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('valider_commande')
      .setLabel('✅ Valider la commande')
      .setStyle(ButtonStyle.Success)
      .setDisabled(panier.length === 0),
    new ButtonBuilder()
      .setCustomId('annuler_commande')
      .setLabel('❌ Annuler')
      .setStyle(ButtonStyle.Danger),
  );
}

// ─────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────
client.once('ready', () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Saisie PDG
  if (attenteSaisie.has(message.author.id)) {
    const { type } = attenteSaisie.get(message.author.id);
    const valeur = parseFloat(message.content.trim());

    if (isNaN(valeur) || valeur < 0) {
      await message.reply('❌ Valeur invalide, recommence.');
      return;
    }

    if (type === 'buche') prixRessources.buche = valeur;
    else if (type === 'magnetite') prixRessources.pepiteMagnetite = valeur;
    else if (type === 'cuivre') prixRessources.pepiteCuivre = valeur;
    else if (type === 'or') prixRessources.pepiteOr = valeur;

    attenteSaisie.delete(message.author.id);
    await message.reply(`✅ Prix mis à jour !`);

    if (channelPDGId && messagePDGId) {
      try {
        const ch = await client.channels.fetch(channelPDGId);
        const msg = await ch.messages.fetch(messagePDGId);
        await msg.edit({ embeds: [buildPDGEmbed()], components: buildPDGButtons() });
      } catch (e) {}
    }
    return;
  }

  // Saisie quantité commande
  if (attenteSaisie.has(`qte_${message.author.id}`)) {
    const { meubleId, interactionChannelId } = attenteSaisie.get(`qte_${message.author.id}`);
    const qte = parseInt(message.content.trim());

    if (isNaN(qte) || qte <= 0) {
      await message.reply('❌ Quantité invalide, recommence.');
      return;
    }

    const meuble = catalogue[meubleId];
    if (!paniers.has(message.author.id)) paniers.set(message.author.id, []);
    const panier = paniers.get(message.author.id);

    // Si le meuble est déjà dans le panier, on additionne
    const existing = panier.find(i => i.id === meubleId);
    if (existing) {
      existing.qte += qte;
    } else {
      panier.push({ id: meubleId, nom: meuble.nom, qte, prix: meuble.prix });
    }

    attenteSaisie.delete(`qte_${message.author.id}`);
    await message.delete().catch(() => {});

    // Mettre à jour le message du panier
    try {
      const ch = await client.channels.fetch(interactionChannelId);
      const msgs = await ch.messages.fetch({ limit: 10 });
      const panierMsg = msgs.find(m => m.author.id === client.user.id && m.embeds[0]?.title === '🛒 Votre commande en cours');
      if (panierMsg) {
        await panierMsg.edit({
          embeds: [buildPanierEmbed(message.author.id)],
          components: [buildPanierButtons(message.author.id)]
        });
      }
    } catch (e) {}
    return;
  }

  const contenu = message.content.trim();
  if (!contenu.startsWith('!')) return;
  const args = contenu.slice(1).split(' ');
  const commande = args.shift().toLowerCase();

  if (commande === 'setup-vente') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply('❌ Réservé au PDG.');
    const msg = await message.channel.send({ embeds: [buildCatalogueEmbed()], components: [buildCatalogueButtons()] });
    messageVenteId = msg.id;
    channelVenteId = message.channel.id;
    await message.delete().catch(() => {});
  }

  if (commande === 'setup-pdg') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply('❌ Réservé au PDG.');
    const msg = await message.channel.send({ embeds: [buildPDGEmbed()], components: buildPDGButtons() });
    messagePDGId = msg.id;
    channelPDGId = message.channel.id;
    await message.delete().catch(() => {});
  }
});

client.on('interactionCreate', async (interaction) => {

  // ── BOUTON PASSER COMMANDE ──
  if (interaction.isButton() && interaction.customId === 'passer_commande') {
    paniers.set(interaction.user.id, []);
    await interaction.reply({
      embeds: [buildPanierEmbed(interaction.user.id)],
      components: [buildMenuMeubles(0), buildPanierButtons(interaction.user.id)],
      ephemeral: true
    });
  }

  // ── BOUTON AJOUTER MEUBLE ──
  if (interaction.isButton() && interaction.customId === 'ajouter_meuble') {
    await interaction.update({
      embeds: [buildPanierEmbed(interaction.user.id)],
      components: [buildMenuMeubles(0), buildPanierButtons(interaction.user.id)],
    });
  }

  // ── MENU CHOISIR MEUBLE ──
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith('choisir_meuble_')) {
    const meubleId = interaction.values[0];
    const meuble = catalogue[meubleId];

    attenteSaisie.set(`qte_${interaction.user.id}`, {
      meubleId,
      interactionChannelId: interaction.channel.id
    });

    await interaction.update({
      embeds: [buildPanierEmbed(interaction.user.id)],
      components: [buildPanierButtons(interaction.user.id)],
    });

    await interaction.followUp({
      content: `Combien de **${meuble.nom}** souhaitez-vous ? (tapez un nombre)`,
      ephemeral: true
    });
  }

  // ── BOUTON VALIDER COMMANDE ──
  if (interaction.isButton() && interaction.customId === 'valider_commande') {
    const panier = paniers.get(interaction.user.id) || [];
    if (panier.length === 0) return interaction.reply({ content: '❌ Panier vide.', ephemeral: true });

    const guild = interaction.guild;
    const member = interaction.member;
    const total = panier.reduce((acc, item) => acc + item.prix * item.qte, 0);

    const salon = await guild.channels.create({
      name: `commande-${member.user.username}`,
      type: ChannelType.GuildText,
      parent: CATEGORIE_COMMANDES_ID,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: member.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: guild.members.me.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      ],
    });

    const lignes = panier.map(item => `• ${item.nom} × ${item.qte} = **${item.prix * item.qte}€**`).join('\n');

    const embed = new EmbedBuilder()
      .setTitle('🛒 Nouvelle commande')
      .setColor(0xFEE75C)
      .addFields(
        { name: 'Client', value: `<@${member.id}>` },
        { name: 'Meubles commandés', value: lignes },
        { name: '💰 Total', value: `**${total}€**` },
      )
      .setTimestamp()
      .setFooter({ text: 'PCB & Co' });

    const rowSalon = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`cloturer_${salon.id}`)
        .setLabel('🔒 Clôturer la commande')
        .setStyle(ButtonStyle.Danger),
    );

    await salon.send({ embeds: [embed], components: [rowSalon] });
    await salon.send(`Bonjour <@${member.id}> ! Votre commande a bien été enregistrée. Total : **${total}€**. Un membre de l'équipe vous contactera bientôt.`);

    paniers.delete(interaction.user.id);

    await interaction.update({
      content: `✅ Commande validée ! Rendez-vous dans <#${salon.id}>`,
      embeds: [],
      components: [],
    });
  }

  // ── BOUTON ANNULER ──
  if (interaction.isButton() && interaction.customId === 'annuler_commande') {
    paniers.delete(interaction.user.id);
    await interaction.update({ content: '❌ Commande annulée.', embeds: [], components: [] });
  }

  // ── BOUTON CLÔTURER ──
  if (interaction.isButton() && interaction.customId.startsWith('cloturer_')) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ Réservé au PDG.', ephemeral: true });
    }
    const salonId = interaction.customId.split('_')[1];
    await interaction.reply({ content: '🔒 Commande clôturée, suppression dans 5 secondes...' });
    setTimeout(async () => {
      const ch = interaction.guild.channels.cache.get(salonId);
      if (ch) await ch.delete().catch(() => {});
    }, 5000);
  }

  // ── BOUTONS PDG MODIFIER PRIX ──
  if (interaction.isButton() && ['set_buche', 'set_magnetite', 'set_cuivre', 'set_or'].includes(interaction.customId)) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ Réservé au PDG.', ephemeral: true });
    }
    const type = interaction.customId.replace('set_', '');
    const noms = { buche: 'Bûche', magnetite: 'Magnétite', cuivre: 'Cuivre', or: 'Or' };
    attenteSaisie.set(interaction.user.id, { type });
    await interaction.reply({ content: `💬 Entrez le nouveau prix pour **${noms[type]}** :`, ephemeral: true });
  }

  // ── BOUTON ACTUALISER CATALOGUE ──
  if (interaction.isButton() && interaction.customId === 'actualiser_catalogue') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ Réservé au PDG.', ephemeral: true });
    }

    messagePDGId = interaction.message.id;
    channelPDGId = interaction.channel.id;
    await interaction.update({ embeds: [buildPDGEmbed()], components: buildPDGButtons() });

    if (channelVenteId && messageVenteId) {
      try {
        const ch = await client.channels.fetch(channelVenteId);
        const msg = await ch.messages.fetch(messageVenteId);
        await msg.edit({ embeds: [buildCatalogueEmbed()], components: [buildCatalogueButtons()] });
        await interaction.followUp({ content: '✅ Catalogue mis à jour !', ephemeral: true });
      } catch (e) {
        await interaction.followUp({ content: '⚠️ Refais `!setup-vente` dans le bon salon.', ephemeral: true });
      }
    } else {
      await interaction.followUp({ content: '⚠️ Aucun salon vente configuré. Tape `!setup-vente`.', ephemeral: true });
    }
  }
});

const token = process.env.TOKEN;
console.log("Token trouvé:", token ? "OUI" : "NON");
client.login(token);
