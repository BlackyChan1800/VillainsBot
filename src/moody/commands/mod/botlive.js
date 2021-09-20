//@ts-check

const BotActivityCommand = require('./botactivity')
const AdminCommand = require('../../classes/command/admincommand.class');

module.exports = class BotLiveCommand extends AdminCommand {
    constructor(client) {
        let comprops = {
            name: "botlive",
            group: "admin",
            memberName: "botlive",
            description: "Make bot Go Live"
        }
        super(
            client,
            {...comprops}
        )
    }

    async run(client, message, args) {
        await this.processArgs(message, args, this.flags)
        let twitchID = this.inputData.args.shift()
        args = [
            "watching",
            `https://twitch.tv/${twitchID}`,
            this.inputData.args.join(" ")
        ]
        let botActivity = new BotActivityCommand()
        botActivity.run(client, message, args, null, "")
    }

    async test(message) {
        let dummy = null
        const baseArgs = []
        const varArgs = [
          "",
          "villains_esc",
          "tridentesports",
          "villains_esc Rocket League",
          "tridentesports VALORANT"
        ]

        for(let added of varArgs) {
            let args = baseArgs.concat([ ...added.split(" ") ])
            dummy = new BotLiveCommand()
            dummy.props.footer.msg = args.join(" | ")
            dummy.run(client, message, args)
        }
    }
}
