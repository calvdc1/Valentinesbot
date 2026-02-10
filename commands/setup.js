const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { loadData, saveData } = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Sets up the Blind Dating category and channels')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild;
    const botMember = guild.members.cache.get(interaction.client.user.id);
    if (!botMember.permissions.has(PermissionFlagsBits.Administrator)) {
      const requiredPerms = [
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.MoveMembers
      ];
      const missingPerms = requiredPerms.filter(perm => !botMember.permissions.has(perm));
      if (missingPerms.length > 0) {
        return interaction.editReply({ content: '❌ Missing Permissions! I need Manage Channels, Manage Roles, Move Members.' });
      }
    }
    const guildData = loadData(guild.id);
    try {
      const category = await guild.channels.create({
        name: 'Blind Dating',
        type: ChannelType.GuildCategory
      });
      const lobbyChannel = await guild.channels.create({
        name: 'Lobby',
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
            deny: [PermissionFlagsBits.Speak]
          },
          {
            id: interaction.client.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.MoveMembers, PermissionFlagsBits.ManageChannels]
          }
        ]
      });
      const dashboardChannel = await guild.channels.create({
        name: 'dashboard',
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            allow: [PermissionFlagsBits.ViewChannel],
            deny: [PermissionFlagsBits.SendMessages]
          },
          {
            id: interaction.client.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
          }
        ]
      });
      const matchButton = new ButtonBuilder().setCustomId('match_me').setLabel('Match Me').setStyle(ButtonStyle.Success).setEmoji('💘');
      const row = new ActionRowBuilder().addComponents(matchButton);
      const embed = new EmbedBuilder().setColor(0xFF69B4).setTitle('Blind Dating Voice Channel').setDescription('Join the Lobby voice channel and click the button below to be matched in a private voice channel!').setFooter({ text: 'Find your valentine!' });
      await dashboardChannel.send({ embeds: [embed], components: [row] });
      guildData.categoryId = category.id;
      guildData.lobbyChannelId = lobbyChannel.id;
      guildData.dashboardChannelId = dashboardChannel.id;
      saveData(guild.id, guildData);
      await interaction.editReply({ content: `Setup complete in ${dashboardChannel}.` });
    } catch (error) {
      await interaction.editReply({ content: 'Error setting up channels.' });
    }
  }
};
