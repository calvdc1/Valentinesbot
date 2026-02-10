const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const primaryCommandsPath = path.join(__dirname, 'commands');
const altCommandsPath = path.join(process.cwd(), 'commands');
const commandsPath = fs.existsSync(primaryCommandsPath) ? primaryCommandsPath : altCommandsPath;

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        commands.push(command.data.toJSON());
    }
} else {
    console.warn(`[WARNING] Commands directory not found at ${commandsPath}`);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const targetGuildId = process.env.GUILD_ID;

(async () => {
    try {
        if (targetGuildId) {
            console.log(`Refreshing ${commands.length} guild (/) commands for guild ${targetGuildId}.`);
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, targetGuildId),
                { body: commands },
            );
            console.log('Successfully reloaded guild (/) commands.');
        } else {
            console.log(`Refreshing ${commands.length} global application (/) commands.`);
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );
            console.log('Successfully reloaded global application (/) commands.');
        }
    } catch (error) {
        console.error(error);
    }
})();
