const { BaseEvent } = require('a-djs-handler')
const fs = require('fs')
const VillainsEmbed = require('../../classes/vembed.class')

// Member Join
module.exports = class GuildMemberAddEvent extends BaseEvent {
    constructor() {
        super('guildMemberAdd')
    }

    async run(handler, member) {
        // Message Channels
        const channelIDs = JSON.parse(fs.readFileSync("dbs/channels.json", "utf8"))
        let ROLES = JSON.parse(fs.readFileSync("dbs/roles.json", "utf8"))
        // Add Minion Role
        let welcomeRole = ROLES.member;
        welcomeRole = member.guild.roles.cache.find(role => role.name === welcomeRole);
        if (welcomeRole?.id) {
            member.roles.add(welcomeRole.id);
        }
        // console.log(member) // If You Want The User Info in Console Who Joined Server Then You Can Add This Line. // Optional

        let consolePad = 20
        console.log("---")
        console.log("---MEMBER JOIN->>")
        console.log(
            "Guild:".padEnd(consolePad),
            `${member.guild.name} (ID:${member.guild.id})`
        )
        console.log(
            "Member:".padEnd(consolePad),
            `${member.user.username}#${member.user.discriminator} (ID:${member.user.id})`
        )
        console.log(
            "Member Role:".padEnd(consolePad),
            (
              welcomeRole?.id ?
                "Exists" :
                "Does not exist"
            ),
            `(Str:${ROLES.member}, ID:${welcomeRole?.id ? welcomeRole.id : "???"})`
        )
        console.log(
            "Welcome Channel:".padEnd(consolePad),
            (
              (
                (member.guild.id in channelIDs) &&
                (channelIDs[member.guild.id]?.welcome)
              ) ?
                `Yes (ID:${channelIDs[member.guild.id].welcome})` :
                "No"
            )
        )

        if (!(member.guild.id in channelIDs)) {
            return
        }

        const channel = member.guild.channels.cache.get(channelIDs[member.guild.id].welcome)
        try {
            let rules = [
                `Welcome <@${member.user.id}> to **${member.guild.name}**.`,
                "**Are you ready to become a Super Villain?**",
                "",
                `Please Read ${member.guild.channels.cache.get(channelIDs[member.guild.id].rules).toString()}.`,
                "",
                `Also to access the server channels, please go to ${member.guild.channels.cache.get(channelIDs[member.guild.id].roles).toString()}.`
            ]
            let props = {
                title: "Welcome to ${member.guild.name}",
                description: rules.join("\n")
            }
            const embed = new VillainsEmbed(props);

            return channel.send(embed);
        }
        catch (err) {
           throw (err);
        }
    }
}