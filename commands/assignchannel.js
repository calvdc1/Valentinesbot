const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { loadData, saveData } = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('assignchannel')
    .setDescription('Assign the dashboard text channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Text channel to use as dashboard')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel', true);
    const guildData = loadData(interaction.guild.id);
    guildData.dashboardChannelId = channel.id;
    saveData(interaction.guild.id, guildData);
    await interaction.reply({ content: `Dashboard channel set to ${channel}.`, ephemeral: true });
  }
};
