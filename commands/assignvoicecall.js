const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { loadData, saveData } = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('assignvoicecall')
    .setDescription('Assign the Lobby voice channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Voice channel to use as Lobby')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true)
    ),
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel', true);
    const guildData = loadData(interaction.guild.id);
    guildData.lobbyChannelId = channel.id;
    saveData(interaction.guild.id, guildData);
    await interaction.reply({ content: `Lobby voice channel set to ${channel}.`, ephemeral: true });
  }
};
