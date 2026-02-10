const { Events } = require('discord.js');
const { loadData, saveData } = require('../utils/storage');

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    const guild = oldState.guild || newState.guild;
    const guildData = loadData(guild.id);
    if (guildData.lobbyChannelId) {
      if (oldState.channelId === guildData.lobbyChannelId && newState.channelId !== guildData.lobbyChannelId) {
        const idx = guildData.queue.indexOf(oldState.member.id);
        if (idx !== -1) {
          guildData.queue.splice(idx, 1);
          saveData(guild.id, guildData);
        }
      }
    }
    if (oldState.channelId && guildData.activeChannels.includes(oldState.channelId)) {
      const channel = oldState.channel;
      if (channel && channel.members.size === 0) {
        try {
          await channel.delete();
        } catch (_) {}
        guildData.activeChannels = guildData.activeChannels.filter(id => id !== oldState.channelId);
        saveData(guild.id, guildData);
      }
    }
  }
};
