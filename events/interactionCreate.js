const { Events, ChannelType, PermissionFlagsBits } = require('discord.js');
const { loadData, saveData } = require('../utils/storage');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (error) {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: 'Error executing command.', ephemeral: true });
        } else {
          await interaction.reply({ content: 'Error executing command.', ephemeral: true });
        }
      }
    } else if (interaction.isButton()) {
      if (interaction.customId === 'match_me') {
        await handleMatchMe(interaction);
      }
    }
  }
};

async function handleMatchMe(interaction) {
  const guild = interaction.guild;
  const member = interaction.member;
  const guildData = loadData(guild.id);
  if (!guildData.lobbyChannelId) {
    return interaction.reply({ content: 'System not set up. Ask an admin to run /setup.', ephemeral: true });
  }
  if (!member.voice.channel || member.voice.channel.id !== guildData.lobbyChannelId) {
    return interaction.reply({ content: `You must be in the <#${guildData.lobbyChannelId}> voice channel to find a match.`, ephemeral: true });
  }
  if (guildData.queue.includes(member.id)) {
    return interaction.reply({ content: 'You are already in the queue.', ephemeral: true });
  }
  guildData.queue.push(member.id);
  saveData(guild.id, guildData);
  await interaction.reply({ content: 'Searching for a match...', ephemeral: true });
  if (guildData.queue.length >= 2) {
    const user1Id = guildData.queue.shift();
    const user2Id = guildData.queue.shift();
    saveData(guild.id, guildData);
    const user1 = await guild.members.fetch(user1Id).catch(() => null);
    const user2 = await guild.members.fetch(user2Id).catch(() => null);
    const user1InLobby = user1 && user1.voice.channelId === guildData.lobbyChannelId;
    const user2InLobby = user2 && user2.voice.channelId === guildData.lobbyChannelId;
    if (user1InLobby && user2InLobby) {
      const privateChannel = await guild.channels.create({
        name: 'Date Room',
        type: ChannelType.GuildVoice,
        parent: guildData.categoryId,
        permissionOverwrites: [
          { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.MoveMembers, PermissionFlagsBits.ManageChannels] },
          { id: user1.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] },
          { id: user2.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] }
        ]
      });
      try {
        if (user1.voice.channel) await user1.voice.setChannel(privateChannel);
        if (user2.voice.channel) await user2.voice.setChannel(privateChannel);
      } catch (_) {}
      guildData.activeChannels.push(privateChannel.id);
      saveData(guild.id, guildData);
    }
  }
}
