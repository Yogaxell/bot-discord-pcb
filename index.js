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
// PRIX DES RESSOURCES DE BASE
// ─────────────────────────────────────────────
let prixRessources = {
  buche: 10,
  pepiteMagnetite: 1,
  pepiteCuivre: 12,
};

let marge = 15;

// ─────────────────────────────────────────────
// CATALOGUE
// ─────────────────────────────────────────────
const catalogue = {
  "fut_metal": { nom: "Fût en métal", categorie: "Métal", ressources: { pepiteMagnetite: 55 } },
  "etagere_metal": { nom: "Étagère métal", categorie: "Métal", ressources: { pepiteMagnetite: 22 } },
  "seau": { nom: "Seau", categorie: "Métal", ressources: { pepiteMagnetite: 33 } },
  "grand_casier": { nom: "Grand casier", categorie: "Métal", ressources: { pepiteMagnetite: 88 } },
  "chaise_metal": { nom: "Chaise métal", categorie: "Métal", ressources: { pepiteMagnetite: 22 } },
  "bureau_industriel": { nom: "Bureau industriel", categorie: "Métal", ressources: { pepiteMagnetite: 33, buche: 1 } },
  "evier_industriel": { nom: "Évier industriel", categorie: "Métal", ressources: { pepiteMagnetite: 33, pepiteCuivre: 6 } },
  "etagere_police": { nom: "Étagère de police", categorie: "Métal", ressources: { pepiteMagnetite: 220 } },
  "barriere_vauban": { nom: "Barrière Vauban", categorie: "Métal", ressources: { pepiteMagnetite: 11 } },
  "table_basse_bois": { nom: "Table basse bois", categorie: "Bois", ressources: { buche: 2 } },
  "table": { nom: "Table", categorie: "Bois", ressources: { buche: 2.5 } },
  "table_exterieur": { nom: "Table extérieur bois", categorie: "Bois", ressources: { buche: 5 } },
  "chaise_bois": { nom: "Chaise bois", categorie: "Bois", ressources: { buche: 2.5 } },
  "caillebotis": { nom: "Caillebotis", categorie: "Bois", ressources: { buche: 2 } },
  "cajot": { nom: "Cajot", categorie: "Bois", ressources: { buche: 3 } },
  "volet_bois": { nom: "Volet bois", categorie: "Bois", ressources: { buche: 3 } },
  "etagere_bois": { nom: "Étagère bois", categorie: "Bois", ressources: { buche: 4 } },
  "table_nuit_1": { nom: "Table de nuit (1)", categorie: "Bois", ressources: { buche: 3 } },
  "table_nuit_2": { nom: "Table de nuit (2)", categorie: "Bois", ressources: { buche: 4 } },
  "table_nuit_3": { nom: "Table de nuit (3)", categorie: "Bois", ressources: { buche: 3 } },
  "comptoir_vente": { nom: "Comptoir de vente", categorie: "Bois", ressources: { buche: 5 } },
  "tabouret_bois": { nom: "Tabouret bois", categorie: "Bois", ressources: { buche: 4 } },
  "etabli_maison": { nom: "Établi maison", categorie: "Bois", ressources: { buche: 7.5 } },
  "caisse_bois": { nom: "Caisse bois", categorie: "Bois", ressources: { buche: 4 } },
  "etagere_murale": { nom: "Étagère murale", categorie: "Mixte", ressources: { buche: 1, pepiteMagnetite: 5.5 } },
  "etagere_murale_18": { nom: "Étagère murale 1.8m", categorie: "Mixte", ressources: { buche: 1.5, pepiteMagnetite: 5.5 } },
  "cagette_fruits": { nom: "Cagette de fruits", categorie: "Bois", ressources: { buche: 1 } },
};

// ─────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────
function calculerPrix(meuble, quantite = 1) {
  let coutRevient = 0;
  for (const [ressource, qte] of Object.entries(meuble.ressources)) {
    coutRevient += prixRessources[ressource] * qte;
  }
  coutRevient *= quantite;
  const prixVente = Math.ceil(coutRevient * (1 + marge / 100));
  return { coutRevient, prixVente };
}

function buildCatalogueEmbed() {
  const parCategorie = {};
  for (const [id, meuble] of Object.entries(catalogue)) {
    if (!parCategorie[meuble.categorie]) parCategorie[meuble.categorie] = [];
    const { prixVente } = calculerPrix(meuble);
    parCategorie[meuble.categorie].push(`• ${meuble.nom} — **${prixVente}€**`);
  }

  const embed = new EmbedBuilder()
    .setTitle('🏪 PCB & Co — Catalogue & Prix')
    .setColor(0x2b2d31)
    .setDescription('Cliquez sur **Passer commande** pour commander un meuble !')
    .setTimestamp();

  for (const [cat, lignes] of Object.entries(parCategorie)) {
    const emoji = cat === 'Bois' ? '🪵' : cat === 'Métal' ? '🔩' : '🔧';
    embed.addFields({ name: `${emoji} ${cat}`, value: lignes.join('\n') });
  }

  embed.setFooter({ text: `Prix des ressources — Bûche: ${prixRessources.buche}€ | Magnétite: ${prixRessources.pepiteMagnetite}€ | Cuivre: ${prixRessources.pepiteCuivre}€ | Marge: ${marge}%` });

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
      { name: '📈 Marge', value: `${marge}%`, inline: true },
    )
    .setDescription('Utilisez les boutons pour modifier les prix, puis cliquez sur **Actualiser le catalogue**.')
    .setTimestamp();
}

function buildPDGButtons() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('set_buche').setLabel('Modifier Bûche').setStyle(ButtonStyle.Secondary).setEmoji('🪵'),
    new ButtonBuilder().setCustomId('set_magnetite').setLabel('Modifier Magnétite').setStyle(ButtonStyle.Secondary).setEmoji('🔩'),
    new ButtonBuilder().setCustomId('set_cuivre').setLabel('Modifier Cuivre').setStyle(ButtonStyle.Secondary).setEmoji('🟠'),
    new ButtonBuilder().setCustomId('set_marge').setLabel('Modifier Marge').setStyle(ButtonStyle.Secondary).setEmoji('📈'),
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('actualiser_catalogue').setLabel('🔄 Actualiser le catalogue').setStyle(ButtonStyle.Success),
  );
  return [row1, row2];
}

// IDs des messages permanents
let messageVenteId = null;
let messagePDGId = null;
let channelVenteId = null;
let channelPDGId = null;

// Commandes en attente de saisie (modal simulé par message)
const attenteSaisie = new Map();

// ─────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────
client.once('ready', () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Vérifier si on attend une saisie de ce user
  if (attenteSaisie.has(message.author.id)) {
    const { type, channelId } = attenteSaisie.get(message.author.id);
    const valeur = parseFloat(message.content.trim());

    if (isNaN(valeur) || valeur < 0) {
      await message.reply('❌ Valeur invalide, recommence.');
      return;
    }

    if (type === 'buche') prixRessources.buche = valeur;
    else if (type === 'magnetite') prixRessources.pepiteMagnetite = valeur;
    else if (type === 'cuivre') prixRessources.pepiteCuivre = valeur;
    else if (type === 'marge') marge = valeur;

    attenteSaisie.delete(message.author.id);
    await message.reply(`✅ Prix mis à jour !`);

    // Mettre à jour le message PDG
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

  // !setup-vente — envoie le message permanent dans ce salon
  if (commande === 'setup-vente') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Réservé au PDG.');
    }
    const msg = await message.channel.send({
      embeds: [buildCatalogueEmbed()],
      components: [buildCatalogueButtons()]
    });
    messageVenteId = msg.id;
    channelVenteId = message.channel.id;
    await message.delete().catch(() => {});
  }

  // !setup-pdg — envoie l'interface PDG dans ce salon
  if (commande === 'setup-pdg') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ Réservé au PDG.');
    }
    const msg = await message.channel.send({
      embeds: [buildPDGEmbed()],
      components: buildPDGButtons()
    });
    messagePDGId = msg.id;
    channelPDGId = message.channel.id;
    await message.delete().catch(() => {});
  }
});

client.on('interactionCreate', async (interaction) => {

  // ── BOUTON PASSER COMMANDE ──
  if (interaction.isButton() && interaction.customId === 'passer_commande') {
    // Créer un menu de sélection du meuble
    const options = Object.entries(catalogue).map(([id, m]) => {
      const { prixVente } = calculerPrix(m);
      return new StringSelectMenuOptionBuilder()
        .setLabel(m.nom)
        .setValue(id)
        .setDescription(`${prixVente}€`);
    });

    // Discord limite à 25 options par menu, on prend les 25 premiers
    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('choisir_meuble')
        .setPlaceholder('Choisissez un meuble...')
        .addOptions(options.slice(0, 25))
    );

    await interaction.reply({
      content: '🛒 **Quel meuble souhaitez-vous commander ?**',
      components: [row],
      ephemeral: true
    });
  }

  // ── MENU CHOISIR MEUBLE ──
  if (interaction.isStringSelectMenu() && interaction.customId === 'choisir_meuble') {
    const meubleId = interaction.values[0];
    const meuble = catalogue[meubleId];
    const { prixVente } = calculerPrix(meuble);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`confirmer_commande_${meubleId}_1`)
        .setLabel('✅ Confirmer (x1)')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`annuler_commande`)
        .setLabel('❌ Annuler')
        .setStyle(ButtonStyle.Danger),
    );

    await interaction.update({
      content: `Vous avez sélectionné **${meuble.nom}** pour **${prixVente}€**. Confirmer ?`,
      components: [row],
    });
  }

  // ── BOUTON CONFIRMER COMMANDE ──
  if (interaction.isButton() && interaction.customId.startsWith('confirmer_commande_')) {
    const parts = interaction.customId.split('_');
    const meubleId = parts.slice(2, -1).join('_');
    const meuble = catalogue[meubleId];
    const { prixVente } = calculerPrix(meuble);
    const guild = interaction.guild;
    const member = interaction.member;

    // Créer le salon privé
    const salon = await guild.channels.create({
      name: `commande-${member.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: member.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
        },
        {
          id: guild.members.me.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
        },
      ],
    });

    const embed = new EmbedBuilder()
      .setTitle('🛒 Nouvelle commande')
      .setColor(0xFEE75C)
      .addFields(
        { name: 'Client', value: `<@${member.id}>`, inline: true },
        { name: 'Meuble', value: meuble.nom, inline: true },
        { name: 'Prix total', value: `**${prixVente}€**`, inline: true },
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
    await salon.send(`Bonjour <@${member.id}> ! Votre commande pour **${meuble.nom}** a bien été enregistrée. Prix : **${prixVente}€**. Un membre de l'équipe vous contactera bientôt.`);

    await interaction.update({
      content: `✅ Commande créée ! Rendez-vous dans <#${salon.id}>`,
      components: [],
    });
  }

  // ── BOUTON ANNULER ──
  if (interaction.isButton() && interaction.customId === 'annuler_commande') {
    await interaction.update({ content: '❌ Commande annulée.', components: [] });
  }

  // ── BOUTON CLOTURER COMMANDE ──
  if (interaction.isButton() && interaction.customId.startsWith('cloturer_')) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ Réservé au PDG.', ephemeral: true });
    }
    const salonId = interaction.customId.split('_')[1];
    await interaction.reply({ content: '🔒 Salon clôturé, suppression dans 5 secondes...' });
    setTimeout(async () => {
      const ch = interaction.guild.channels.cache.get(salonId);
      if (ch) await ch.delete().catch(() => {});
    }, 5000);
  }

  // ── BOUTONS PDG ──
  if (interaction.isButton() && ['set_buche', 'set_magnetite', 'set_cuivre', 'set_marge'].includes(interaction.customId)) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ Réservé au PDG.', ephemeral: true });
    }
    const type = interaction.customId.replace('set_', '');
    const noms = { buche: 'Bûche', magnetite: 'Magnétite', cuivre: 'Cuivre', marge: 'Marge (%)' };
    attenteSaisie.set(interaction.user.id, { type, channelId: interaction.channel.id });
    await interaction.reply({ content: `💬 Entrez le nouveau prix pour **${noms[type]}** :`, ephemeral: true });
  }

  // ── BOUTON ACTUALISER CATALOGUE ──
  if (interaction.isButton() && interaction.customId === 'actualiser_catalogue') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ Réservé au PDG.', ephemeral: true });
    }

    // Mettre à jour le message PDG
    await interaction.update({ embeds: [buildPDGEmbed()], components: buildPDGButtons() });
    messagePDGId = interaction.message.id;
    channelPDGId = interaction.channel.id;

    // Mettre à jour le message vente
    if (channelVenteId && messageVenteId) {
      try {
        const ch = await client.channels.fetch(channelVenteId);
        const msg = await ch.messages.fetch(messageVenteId);
        await msg.edit({ embeds: [buildCatalogueEmbed()], components: [buildCatalogueButtons()] });
        await interaction.followUp({ content: '✅ Catalogue mis à jour !', ephemeral: true });
      } catch (e) {
        await interaction.followUp({ content: '⚠️ Catalogue PDG mis à jour mais impossible de trouver le salon vente. Refais `!setup-vente`.', ephemeral: true });
      }
    } else {
      await interaction.followUp({ content: '⚠️ Aucun salon vente configuré. Tape `!setup-vente` dans le bon salon.', ephemeral: true });
    }
  }
});

const token = process.env.TOKEN;
console.log("Token trouvé:", token ? "OUI" : "NON");
client.login(token);
