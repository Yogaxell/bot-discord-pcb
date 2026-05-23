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
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

const CATEGORIE_COMMANDES_ID = '1507304750641582102';
const SALON_LOGS_PRODUCTION = '1507716933271945307';
const ROLE_PDG = '1424397015411851322';
const ROLE_COPDG = '1424397015411851321';
const ROLE_RESTOKER = '1424397015411851319';

function isPDGouCoPDG(member) {
  return member.roles.cache.has(ROLE_PDG) || member.roles.cache.has(ROLE_COPDG);
}

function isRestoker(member) {
  return member.roles.cache.has(ROLE_RESTOKER) || member.roles.cache.has(ROLE_PDG);
}

let prixRessources = {
  buche: 10,
  pepiteMagnetite: 1,
  pepiteCuivre: 12,
  pepiteOr: 4,
};

const catalogue = {
  "chaise_metal":      { nom: "Chaise en métal",     categorie: "Métal",  prix: 75  },
  "fut_metal":         { nom: "Fût en métal",         categorie: "Métal",  prix: 85  },
  "seau":              { nom: "Seau",                 categorie: "Métal",  prix: 45  },
  "barriere_vauban":   { nom: "Barrière Vauban",      categorie: "Métal",  prix: 32  },
  "bureau_industriel": { nom: "Bureau industriel",    categorie: "Métal",  prix: 210 },
  "grand_casier":      { nom: "Grand casier",         categorie: "Métal",  prix: 310 },
  "evier_industriel":  { nom: "Évier industriel",     categorie: "Métal",  prix: 210 },
  "etagere_police":    { nom: "Étagère de police",    categorie: "Métal",  prix: 950 },
  "etagere_metal":     { nom: "Étagère métal",        categorie: "Métal",  prix: 150 },
  "table_basse_bois":  { nom: "Table basse bois",     categorie: "Bois",   prix: 32  },
  "table":             { nom: "Table",                categorie: "Bois",   prix: 25  },
  "table_exterieur":   { nom: "Table extérieur bois", categorie: "Bois",   prix: 110 },
  "chaise_bois":       { nom: "Chaise bois",          categorie: "Bois",   prix: 85  },
  "caillebotis":       { nom: "Caillebotis",          categorie: "Bois",   prix: 20  },
  "cajot":             { nom: "Cajot",                categorie: "Bois",   prix: 45  },
  "volet_bois":        { nom: "Volet bois",           categorie: "Bois",   prix: 95  },
  "etagere_bois":      { nom: "Étagère bois",         categorie: "Bois",   prix: 130 },
  "table_nuit_1":      { nom: "Table de nuit (1)",    categorie: "Bois",   prix: 42  },
  "table_nuit_2":      { nom: "Table de nuit (2)",    categorie: "Bois",   prix: 115 },
  "table_nuit_3":      { nom: "Table de nuit (3)",    categorie: "Bois",   prix: 50  },
  "comptoir_vente":    { nom: "Comptoir de vente",    categorie: "Bois",   prix: 170 },
  "tabouret_bois":     { nom: "Tabouret bois",        categorie: "Bois",   prix: 105 },
  "etabli_maison":     { nom: "Établi maison",        categorie: "Bois",   prix: 85  },
  "caisse_bois":       { nom: "Caisse bois",          categorie: "Bois",   prix: 115 },
  "etagere_murale":    { nom: "Étagère murale",       categorie: "Mixte",  prix: 35  },
  "etagere_murale_18": { nom: "Étagère murale 1.8m",  categorie: "Mixte",  prix: 45  },
  "cagette_fruits":    { nom: "Cagette de fruits",    categorie: "Bois",   prix: 30  },
};

// Prix de vente d'un circuit imprimé
const PRIX_CIRCUIT_IMPRIME = 200;

const paniers = new Map();
const attenteSaisie = new Map();

let messageVenteId = null;
let messagePDGId = null;
let channelVenteId = null;
let channelPDGId = null;

// ─────────────────────────────────────────────
// BUILDERS CATALOGUE
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
    .setDescription('Cliquez sur **Passer commande** pour commander !');
  for (const [cat, lignes] of Object.entries(parCategorie)) {
    const emoji = cat === 'Bois' ? '🪵' : cat === 'Métal' ? '🔩' : '🔧';
    embed.addFields({ name: `${emoji} ${cat}`, value: lignes.join('\n') });
  }
  return embed;
}

function buildCatalogueButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('passer_commande').setLabel('🛒 Passer commande').setStyle(ButtonStyle.Primary)
  );
}

// ─────────────────────────────────────────────
// BUILDERS PDG
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// BUILDERS PANIER
// ─────────────────────────────────────────────
function buildPanierEmbed(userId) {
  const panier = paniers.get(userId) || [];
  const total = panier.reduce((acc, item) => acc + item.prix * item.qte, 0);
  const embed = new EmbedBuilder().setTitle('🛒 Votre commande en cours').setColor(0x5865F2);
  if (panier.length === 0) {
    embed.setDescription('Votre panier est vide.\n\n👇 Sélectionnez un meuble dans les menus ci-dessous.');
  } else {
    const lignes = panier.map(item => `• ${item.nom} × ${item.qte} = **${item.prix * item.qte}€**`).join('\n');
    embed.setDescription(lignes + '\n\n👇 Ajoutez un autre meuble ou validez votre commande.');
    embed.addFields({ name: '💰 Total', value: `**${total}€**` });
  }
  return embed;
}

function buildMenuMetal() {
  const entries = Object.entries(catalogue).filter(([id, m]) => m.categorie === 'Métal');
  const options = entries.map(([id, m]) =>
    new StringSelectMenuOptionBuilder().setLabel(m.nom).setValue(id).setDescription(`${m.prix}€`)
  );
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId('choisir_meuble_metal').setPlaceholder('🔩 Meubles en métal...').addOptions(options)
  );
}

function buildMenuBois() {
  const entries = Object.entries(catalogue).filter(([id, m]) => m.categorie === 'Bois' || m.categorie === 'Mixte');
  const options = entries.map(([id, m]) =>
    new StringSelectMenuOptionBuilder().setLabel(m.nom).setValue(id).setDescription(`${m.prix}€`)
  );
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId('choisir_meuble_bois').setPlaceholder('🪵 Meubles en bois...').addOptions(options)
  );
}

function buildPanierButtons(userId) {
  const panier = paniers.get(userId) || [];
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('valider_commande').setLabel('✅ Valider la commande').setStyle(ButtonStyle.Success).setDisabled(panier.length === 0),
    new ButtonBuilder().setCustomId('annuler_commande').setLabel('❌ Annuler').setStyle(ButtonStyle.Danger),
  );
}

function getPanierComponents(userId) {
  return [buildMenuMetal(), buildMenuBois(), buildPanierButtons(userId)];
}

async function ouvrirModal(interaction, meubleId) {
  const meuble = catalogue[meubleId];
  const modal = new ModalBuilder()
    .setCustomId(`modal_qte_${meubleId}`)
    .setTitle(`${meuble.nom} — Quantité`);
  const input = new TextInputBuilder()
    .setCustomId('quantite')
    .setLabel(`Prix unitaire: ${meuble.prix}€ — Combien ?`)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ex: 2')
    .setMinLength(1).setMaxLength(3).setRequired(true);
  modal.addComponents(new ActionRowBuilder().addComponents(input));
  await interaction.showModal(modal);
}

// ─────────────────────────────────────────────
// PRODUCTION EMPLOYÉ
// ─────────────────────────────────────────────
function buildProductionEmbed() {
  return new EmbedBuilder()
    .setTitle('🏭 Rapport de production — Employé')
    .setColor(0x57F287)
    .setDescription(
      'Entrez les ressources que vous avez achetées.\n\n' +
      '**Circuits imprimés** (2 par session) :\n' +
      '• 1 bûche = 1 caoutchouc\n' +
      '• 1 bûche = 1 plastique\n' +
      '• 6 pépites de cuivre = 1 lingot = 18 petites plaques\n' +
      '• 20 pépites d\'or = 1 lingot = 10 petites plaques\n\n' +
      'Cliquez sur **Soumettre mon rapport** pour calculer !'
    );
}

function buildProductionButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('soumettre_production').setLabel('📋 Soumettre mon rapport').setStyle(ButtonStyle.Success),
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

  // Saisie PDG prix ressources
  if (attenteSaisie.has(message.author.id)) {
    const { type } = attenteSaisie.get(message.author.id);
    const valeur = parseFloat(message.content.trim());
    if (isNaN(valeur) || valeur < 0) { await message.reply('❌ Valeur invalide.'); return; }
    if (type === 'buche') prixRessources.buche = valeur;
    else if (type === 'magnetite') prixRessources.pepiteMagnetite = valeur;
    else if (type === 'cuivre') prixRessources.pepiteCuivre = valeur;
    else if (type === 'or') prixRessources.pepiteOr = valeur;
    attenteSaisie.delete(message.author.id);
    await message.reply('✅ Prix mis à jour !');
    if (channelPDGId && messagePDGId) {
      try {
        const ch = await client.channels.fetch(channelPDGId);
        const msg = await ch.messages.fetch(messagePDGId);
        await msg.edit({ embeds: [buildPDGEmbed()], components: buildPDGButtons() });
      } catch (e) {}
    }
    return;
  }

  const contenu = message.content.trim();
  if (!contenu.startsWith('!')) return;
  const args = contenu.slice(1).split(' ');
  const commande = args.shift().toLowerCase();

  if (commande === 'setup-vente') {
    if (!message.member.roles.cache.has(ROLE_PDG)) return message.reply('❌ Réservé au PDG.');
    const msg = await message.channel.send({ embeds: [buildCatalogueEmbed()], components: [buildCatalogueButtons()] });
    messageVenteId = msg.id;
    channelVenteId = message.channel.id;
    await message.delete().catch(() => {});
  }

  if (commande === 'setup-pdg') {
    if (!message.member.roles.cache.has(ROLE_PDG)) return message.reply('❌ Réservé au PDG.');
    const msg = await message.channel.send({ embeds: [buildPDGEmbed()], components: buildPDGButtons() });
    messagePDGId = msg.id;
    channelPDGId = message.channel.id;
    await message.delete().catch(() => {});
  }

  if (commande === 'setup-production') {
    const msg = await message.channel.send({ embeds: [buildProductionEmbed()], components: [buildProductionButtons()] });
    await message.delete().catch(() => {});
  }
});

client.on('interactionCreate', async (interaction) => {

  // ── PASSER COMMANDE ──
  if (interaction.isButton() && interaction.customId === 'passer_commande') {
    paniers.set(interaction.user.id, []);
    await interaction.reply({
      embeds: [buildPanierEmbed(interaction.user.id)],
      components: getPanierComponents(interaction.user.id),
      ephemeral: true
    });
  }

  // ── MENUS MEUBLES ──
  if (interaction.isStringSelectMenu() && (interaction.customId === 'choisir_meuble_metal' || interaction.customId === 'choisir_meuble_bois')) {
    await ouvrirModal(interaction, interaction.values[0]);
  }

  // ── MODAL QUANTITÉ ──
  if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_qte_')) {
    const meubleId = interaction.customId.replace('modal_qte_', '');
    const meuble = catalogue[meubleId];
    const qte = parseInt(interaction.fields.getTextInputValue('quantite'));
    if (isNaN(qte) || qte <= 0) { await interaction.reply({ content: '❌ Quantité invalide.', ephemeral: true }); return; }
    if (!paniers.has(interaction.user.id)) paniers.set(interaction.user.id, []);
    const panier = paniers.get(interaction.user.id);
    const existing = panier.find(i => i.id === meubleId);
    if (existing) { existing.qte += qte; }
    else { panier.push({ id: meubleId, nom: meuble.nom, qte, prix: meuble.prix }); }
    try {
      await interaction.deferUpdate();
      await interaction.editReply({ embeds: [buildPanierEmbed(interaction.user.id)], components: getPanierComponents(interaction.user.id) });
    } catch (e) {
      await interaction.reply({ embeds: [buildPanierEmbed(interaction.user.id)], components: getPanierComponents(interaction.user.id), ephemeral: true });
    }
  }

  // ── VALIDER COMMANDE ──
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
      .setTimestamp().setFooter({ text: 'PCB & Co' });
    const rowSalon = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`cloturer_${salon.id}`).setLabel('🔒 Clôturer la commande').setStyle(ButtonStyle.Danger),
    );
    await salon.send({ embeds: [embed], components: [rowSalon] });
    await salon.send(`Bonjour <@${member.id}> ! Votre commande a été enregistrée. Total : **${total}€**. Un membre de l'équipe vous contactera bientôt.`);
    paniers.delete(interaction.user.id);
    await interaction.update({ content: `✅ Commande validée ! Rendez-vous dans <#${salon.id}>`, embeds: [], components: [] });
  }

  // ── ANNULER ──
  if (interaction.isButton() && interaction.customId === 'annuler_commande') {
    paniers.delete(interaction.user.id);
    await interaction.update({ content: '❌ Commande annulée.', embeds: [], components: [] });
  }

  // ── CLÔTURER ──
  if (interaction.isButton() && interaction.customId.startsWith('cloturer_')) {
    if (!isPDGouCoPDG(interaction.member)) {
      return interaction.reply({ content: '❌ Réservé au PDG et Co-PDG.', ephemeral: true });
    }
    const salonId = interaction.customId.split('_')[1];
    await interaction.reply({ content: '🔒 Commande clôturée, suppression dans 5 secondes...' });
    setTimeout(async () => {
      const ch = interaction.guild.channels.cache.get(salonId);
      if (ch) await ch.delete().catch(() => {});
    }, 5000);
  }

  // ── SOUMETTRE PRODUCTION ──
  if (interaction.isButton() && interaction.customId === 'soumettre_production') {
    if (!isRestoker(interaction.member)) {
      return interaction.reply({ content: '❌ Réservé aux Restokers.', ephemeral: true });
    }
    const modal = new ModalBuilder()
      .setCustomId('modal_production')
      .setTitle('📋 Rapport de production');

    const inputBuches = new TextInputBuilder()
      .setCustomId('buches')
      .setLabel(`Nombre de bûches achetées (${prixRessources.buche}€/u)`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: 200')
      .setRequired(true);

    const inputCuivre = new TextInputBuilder()
      .setCustomId('cuivre')
      .setLabel(`Pépites de cuivre achetées (${prixRessources.pepiteCuivre}€/u)`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: 36')
      .setRequired(true);

    const inputOr = new TextInputBuilder()
      .setCustomId('or')
      .setLabel(`Pépites d'or achetées (${prixRessources.pepiteOr}€/u)`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: 200')
      .setRequired(true);

    const inputMagnetite = new TextInputBuilder()
      .setCustomId('magnetite')
      .setLabel(`Pépites de magnétite achetées (${prixRessources.pepiteMagnetite}€/u)`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: 0 (mettre 0 si aucune)')
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(inputBuches),
      new ActionRowBuilder().addComponents(inputCuivre),
      new ActionRowBuilder().addComponents(inputOr),
      new ActionRowBuilder().addComponents(inputMagnetite),
    );

    await interaction.showModal(modal);
  }

  // ── MODAL PRODUCTION ──
  if (interaction.isModalSubmit() && interaction.customId === 'modal_production') {
    const buches = parseInt(interaction.fields.getTextInputValue('buches')) || 0;
    const cuivre = parseInt(interaction.fields.getTextInputValue('cuivre')) || 0;
    const or = parseInt(interaction.fields.getTextInputValue('or')) || 0;
    const magnetite = parseInt(interaction.fields.getTextInputValue('magnetite')) || 0;

    // Calcul circuits imprimés (le jeu produit 2x le résultat Excel)
    // Bûches : floor(bûches / 2) * 2
    // Or : floor(or / 20) * 10 * 2
    // Cuivre : floor(cuivre / 6) * 18 * 2
    const circuitsViaBuches = Math.floor(buches / 2) * 2;
    const circuitsViaCuivre = Math.floor(cuivre / 6) * 18 * 2;
    const circuitsViaOr = Math.floor(or / 20) * 10 * 2;
    const nbCircuits = Math.min(circuitsViaBuches, circuitsViaCuivre, circuitsViaOr);

    // Coût total employé
    const coutBuches = buches * prixRessources.buche;
    const coutCuivre = cuivre * prixRessources.pepiteCuivre;
    const coutOr = or * prixRessources.pepiteOr;
    const coutMagnetite = magnetite * prixRessources.pepiteMagnetite;
    const coutTotal = coutBuches + coutCuivre + coutOr + coutMagnetite;

    // Chiffre d'affaires
    const ca = nbCircuits * PRIX_CIRCUIT_IMPRIME;

    // Embed résultat pour l'employé
    const embedResultat = new EmbedBuilder()
      .setTitle('✅ Rapport de production calculé')
      .setColor(0x57F287)
      .addFields(
        { name: '📦 Ressources achetées', value:
          `• Bûches : ${buches} × ${prixRessources.buche}€ = **${coutBuches}€**\n` +
          `• Pépites de cuivre : ${cuivre} × ${prixRessources.pepiteCuivre}€ = **${coutCuivre}€**\n` +
          `• Pépites d'or : ${or} × ${prixRessources.pepiteOr}€ = **${coutOr}€**\n` +
          `• Pépites de magnétite : ${magnetite} × ${prixRessources.pepiteMagnetite}€ = **${coutMagnetite}€**`
        },
        { name: '💸 Total dépensé (à rembourser)', value: `**${coutTotal}€**`, inline: true },
        { name: '🔌 Circuits imprimés fabriqués', value: `**${nbCircuits}**`, inline: true },
        { name: '💰 CA généré pour l\'entreprise', value: `**${ca}€**`, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: `Rapport de ${interaction.user.username}` });

    await interaction.reply({ embeds: [embedResultat], ephemeral: true });

    // Log dans le salon production
    try {
      const logChannel = await interaction.client.channels.fetch(SALON_LOGS_PRODUCTION);
      const embedLog = new EmbedBuilder()
        .setTitle('🏭 Nouveau rapport de production')
        .setColor(0x5865F2)
        .addFields(
          { name: 'Employé', value: `<@${interaction.user.id}>`, inline: true },
          { name: '🔌 Circuits fabriqués', value: `**${nbCircuits}**`, inline: true },
          { name: '💰 CA généré', value: `**${ca}€**`, inline: true },
          { name: '💸 À rembourser', value: `**${coutTotal}€**`, inline: true },
          { name: '📦 Détail ressources', value:
            `Bûches: ${buches} | Cuivre: ${cuivre} | Or: ${or} | Magnétite: ${magnetite}`
          },
        )
        .setTimestamp();
      await logChannel.send({ embeds: [embedLog] });
    } catch (e) {
      console.error('Erreur envoi log production:', e);
    }
  }

  // ── BOUTONS PDG ──
  if (interaction.isButton() && ['set_buche', 'set_magnetite', 'set_cuivre', 'set_or'].includes(interaction.customId)) {
    if (!interaction.member.roles.cache.has(ROLE_PDG)) {
      return interaction.reply({ content: '❌ Réservé au PDG.', ephemeral: true });
    }
    const type = interaction.customId.replace('set_', '');
    const noms = { buche: 'Bûche', magnetite: 'Magnétite', cuivre: 'Cuivre', or: 'Or' };
    attenteSaisie.set(interaction.user.id, { type });
    await interaction.reply({ content: `💬 Entrez le nouveau prix pour **${noms[type]}** :`, ephemeral: true });
  }

  // ── ACTUALISER CATALOGUE ──
  if (interaction.isButton() && interaction.customId === 'actualiser_catalogue') {
    if (!interaction.member.roles.cache.has(ROLE_PDG)) {
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
      await interaction.followUp({ content: '⚠️ Tape `!setup-vente` dans le salon vente.', ephemeral: true });
    }
  }
});

const token = process.env.TOKEN;
console.log("Token trouvé:", token ? "OUI" : "NON");
client.login(token);
