const {
    MessageEmbed
} = require('discord.js');
const fs = require('fs');

let GLOBALS = JSON.parse(fs.readFileSync("PROFILE.json", "utf8"))
let defaults = JSON.parse(fs.readFileSync("dbs/defaults.json", "utf8"))
let DEV = GLOBALS.DEV;

module.exports = {
    name: 'gamehelp',
    aliases: ['gh'],
    description: "This is a help embed",
    execute(message, args) {

        let stripe = defaults["stripe"]

        //FIXME: Emoji IDs
        let props = {
            "stripe": "#B217EE", // Purple; Default is B2EE17 (Green)
            "title": "***Game Help***",
            "emoji": "<:V1LLA1N:848458548082114570>",
            "url": "https://discord.com/KKYdRbZcPT"
        }
        switch (stripe) {
            default:
                stripe = "#B217EE";
                break;
        }

        // Hack in my stuff to differentiate
        if (DEV) {
            stripe = GLOBALS["stripe"]
            defaults.footer = GLOBALS.footer
        }

        props["stripe"] = stripe

        let helpData = JSON.parse(fs.readFileSync("game/dbs/help.json", "utf8"))

        let loadSection = args && args[0] && Object.keys(helpData).indexOf(args[0]) !== -1;
        if (loadSection) {
            helpData = {
                key: helpData[args[0]]
            }
        }

        const newEmbed = new MessageEmbed()
            .setColor(props.stripe)
            .setTitle(props.emoji + " " + props.title)
            .setURL(props.url)
            .setThumbnail(defaults.thumbnail)
            .setFooter(defaults.footer.msg, defaults.footer.image)
            .setTimestamp();

        for (let [section, sectionAttrs] of Object.entries(helpData)) {
            let value = sectionAttrs?.help ? sectionAttrs.help : " "
            if (!loadSection) {
                values = []
                for (let command in sectionAttrs.commands) {
                    values.push("`" + command + "`")
                }
                value = values.join(", ")
            }
            newEmbed.addField(
                "**" + sectionAttrs.section + "**" + (section != "key" ? " (`" + section + "`)" : ""),
                value
            )
            if (loadSection) {
                let shown = false
                for (let [command, commandAttrs] of Object.entries(sectionAttrs.commands)) {
                    let show = true
                    if (args && args[1] && args[1] !== command) {
                        show = false
                    }
                    if (show) {
                        shown = true
                        let value = commandAttrs.help.join("\n")
                        if ("aliases" in commandAttrs) {
                            value += "\n"
                            value += "[Aliases: " + commandAttrs.aliases.join(", ") + "]"
                        }
                        newEmbed.addField(
                            "`" + defaults.prefix + command + "`",
                            value
                        )
                    }
                }
                if (!shown && (args && args[1])) {
                    newEmbed.addField(
                        "Error",
                        "Command `" + args[1] + "` not present in `" + sectionAttrs.section + "`."
                    )
                }
            }
        }
        message.channel.send(newEmbed);
    }
}