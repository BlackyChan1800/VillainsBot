module.exports = {
    name: 'discord',
    description: "This is to join the bot discord server",
    execute(message) {
        DISCORD_INVITE = "Gh2Jh5FpVS"
        message.channel.send('https://discord.gg/' + DISCORD_INVITE);
    }
}
