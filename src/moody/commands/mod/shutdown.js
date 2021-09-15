//@ts-check

const AdminCommand = require('../../classes/command/admincommand.class');
const VillainsEmbed = require('../../classes/embed/vembed.class');

module.exports = class ShutDownCommand extends AdminCommand {
    constructor() {
        let comprops = {
            name: "shutdown",
            category: "meta",
            aliases: [ "sh" ],
            description: "Bot Shutdown"
        }
        let props = {
            caption: {
                text: "Bot Shutdown"
            }
        }
        super(
            {...comprops},
            {...props}
        )
    }

    async run(client, message, args, util, cmd) {
        this.props.description = `Shutting down <@${client.user.id}>.`
        this.pages.push(new VillainsEmbed({...this.props}))
        await this.send(message, this.pages)
        try {
            const pm2 = require('pm2')
            pm2.connect(function(err) {
                if (err) {
                    console.log(err)
                    process.exit(2)
                }

                pm2.list((err, list) => {
                    console.log(err, list)

                    // if (list.includes("run")) {
                    //     pm2.restart("run", (err, proc) => {
                    //         pm2.disconnect()
                    //     })
                    // }
                })
            })
        } catch (err) {
            // console.log(err)
            process.exit(1337)
        }
    }
}
