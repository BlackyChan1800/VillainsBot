//@ts-check

const ModCommand = require('../../classes/command/modcommand.class');

module.exports = class BanCommand extends ModCommand {
    constructor(client) {
        let comprops = {
            name: "ban",
            group: "mod",
            memberName: "ban",
            description: "Ban user",
            guildOnly: true,
            clientPermissions: [
                "BAN_MEMBERS"
            ],
            userPermissions: [
                "BAN_MEMBERS"
            ]
        }
        super(
            client,
            {...comprops},
            {
                flags: {
                    bot: "optional"
                }
            }
        )
    }

    async action(client, message) {
        // Convert to Guild Member
        const member = await message.guild.members.fetch(this.inputData.loaded.id)

        if (!member) {
            this.error = true
            this.props.description = `Couldn't convert ${this.inputData.loaded} (ID:${this.inputData.loaded.id}) to a Member object.`
            return
        }

        if(! this.DEV) {
            // Do the thing
            let reason = this.inputData.args.join(" ")
            member.ban({ reason: reason })
            this.props.description = `<@${member.id}> has been Struck with the Ban Hammer`
            if(this.inputData.args.join(" ") != "") {
                this.props.description += "\n"
                this.props.description += `Reason: [${reason}]`
            }
            this.props.image = "https://thumbs.gfycat.com/EquatorialDamagedGnat-small.gif"
        } else {
            // Describe the thing
            this.props.description = `<@${member.id}> *would be* **banned** if this wasn't in DEV Mode`
        }
    }

    async test(client, message) {
        let dummy = null
        const baseArgs = []
        const varArgs = [
          "",
          message.author.username,
          message.author.id,
          client.user.username,
          "Wanrae"
        ]

        for(let added of varArgs) {
            let args = baseArgs.concat([ ...added.split(" ") ])
            dummy = new BanCommand(client)
            dummy.props.footer.msg = args.join(" | ")
            await dummy.run(message, args)
        }
    }
}
