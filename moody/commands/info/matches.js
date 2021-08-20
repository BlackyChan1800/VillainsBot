const VillainsCommand = require('../../classes/vcommand.class');
const VillainsEmbed = require('../../classes/vembed.class');

const fs = require('fs');
const dasu = require('dasu');

function walk(dir) {
    let results = [];
    if (fs.existsSync(dir)) {
        let list = fs.readdirSync(dir);
        list.forEach(function (file) {
            file = dir + '/' + file;
            let stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                /* Recurse into a subdirectory */
                results = results.concat(walk(file));
            } else {
                /* Is a JSON file */
                if (file.endsWith(".json")) {
                    results.push(file);
                }
            }
        });
    } else {
        console.log(`FS Walk: '${dir}' doesn't exist!`);
    }
    return results;
}

module.exports = class MatchesCommand extends VillainsCommand {
    constructor() {
        super(
            {
                name: "matches",
                aliases: [ "match" ],
                category: "information",
                description: "Call match listings"
            }
        )
    }

    async action(client, message, cmd) {
        let args = this.inputData.args;
        let profile = {
            "team": {}
        }
        let handlerpath = "/team/"
        let filepath = ""
        let profiles = {}
        let validSpan = null
        if (args) {                             // args passed
            if (args[0]) {                      // first arg passed
                if (!isNaN(args[0])) {          // first arg is a number (could be teamID or tourney ID)
                    filepath += args[0]
                    if (args[1]) {              // second arg passed
                        if (!isNaN(args[1])) {  // second arg is a number (first was tourneyID, this is teamID)
                            handlerpath = "/tourney/"
                            profile.team.tourneyID = args[0]
                            profile.team.teamID = args[1]
                            filepath += '/' + profile.team.teamID
                            // third arg passed
                            // third arg is not a number
                            // this is a valid span
                            if (args[2] && isNaN(args[2]) && (["all","complete","completed","incomplete","next"].includes(args[2].toLowerCase()))) {
                                let span = args[2].toLowerCase()
                                if (span == "completed") {
                                    span = "complete"
                                }
                                profiles[span] = [ handlerpath + filepath + '-' + span + ".json" ]
                                validSpan = true
                            } else { // invalid span
                                // return all spans
                                validSpan = false
                            }
                        } else {  // second arg is text (first was teamID, this is span)
                            profile.team.teamID = args[0]
                            if (args[1] && isNaN(args[1]) && (["all","complete","completed","incomplete","next"].includes(args[1].toLowerCase()))) {
                                // this is a valid span
                                let span = args[1].toLowerCase()
                                if (span == "completed") {
                                    span = "complete"
                                }
                                profiles[span] = [ handlerpath + filepath + '-' + span + ".json" ]
                                validSpan = true
                            } else { // invalid span
                                // return all spans
                                validSpan = false
                            }
                        }
                    } else {  // no second arg passed
                        // invalid span
                        // return all spans for teamID
                        validSpan = false
                        if (cmd == "match") {
                            handlerpath = "/match/"
                            profiles[""] = [ handlerpath + filepath + ".json" ]
                            validSpan = true
                        }
                    }
                    if (!validSpan) {
                        for (let span of [ "all", "complete", "incomplete", "next" ]) {
                            profiles[span] = [ handlerpath + filepath + '-' + span + ".json" ]
                        }
                    }
                } else if (["all","complete","completed","incomplete","next"].includes(args[0].toLowerCase())) {
                    // first arg is text
                    // this is a valid span
                    // return all rosters for span
                    let span = args[0].toLowerCase()
                    if (span == "completed") {
                        span = "complete"
                    }
                    if (!profiles[span]) {
                        profiles[span] = []
                    }
                    let locPath = "./rosters/dbs/teams"
                    let files = walk(locPath)
                    for (let file of files) {
                        let fData = JSON.parse(fs.readFileSync(file, "utf8"))
                        let tourneyID = 0
                        let teamID = 0
                        if (fData?.team?.tourneyID) {
                            tourneyID = fData.team.tourneyID
                        }
                        if (fData?.team?.lpl?.tourneyID) {
                            tourneyID = fData.team.lpl.tourneyID
                        }
                        if (fData?.team?.teamID) {
                            teamID = fData.team.teamID
                        }
                        if (fData?.team?.lpl?.teamID) {
                            teamID = fData.team.lpl.teamID
                        }
                        if (teamID > 0) {
                            let handlerpath = "/team/"
                            let filepath = fData.team.teamID
                            if (tourneyID > 0) {
                                handlerpath = "/tourney/"
                                filepath = fData.team.tourneyID + '/' + filepath
                            }
                            profiles[span].push(
                                handlerpath + filepath + '-' + span + ".json"
                            )
                        }
                    }
                }
            }
        }

        let defaults = JSON.parse(fs.readFileSync("dbs/defaults.json","utf8"))

        let pages = []

        for (let [span, files] of Object.entries(profiles)) {
            for (let filepath of files) {
                let req = dasu.req

                let url = new URL("http://villainsoce.mymm1.com:80" + filepath)

                let params = {
                    method: 'GET',
                    protocol: url.protocol,
                    hostname: url.hostname,
                    port: url.port,
                    path: url.pathname
                }

                // if (DEV) {
                //     console.log(`Fetching:${url.toString()}`)
                // }

                let props = []
                props.description = "Something got stuffed up here..."

                let title = (span.charAt(0).toUpperCase() + span.slice(1) + " Matches Schedule").trim()
                props.url = url.toString().includes('-') ? url.toString().substr(0,url.toString().indexOf('-')) : url
                let embed = new VillainsEmbed({...props})

                await req(params, function (err, res, data) {
                    try {
                        let json = JSON.parse(data)
                        let game_details = json["events"]

                        let noMatches = Object.entries(game_details).length == 0

                        let emoji = ""
                        let emojiKey = json?.gameID?.detected ? json.gameID.detected : json.game
                        let emojiName = emojiKey
                        if (emojiName == "val") {
                            emojiName = "valorant"
                        }

                        let foundEmoji = false

                        let cachedEmoji = message.guild.emojis.cache.find(emoji => emoji.name === emojiName);
                        if (cachedEmoji?.available) {
                            foundEmoji = true
                            emoji += `${cachedEmoji}`;
                        }

                        if (!foundEmoji) {
                            if (emojiKey) {
                                emoji += '[' + emojiKey + "] "
                            }
                        }

                        if (!noMatches) {
                            props.description = "__***" + emoji + json.team + "***__"
                            if (json?.team_url) {
                                props.description = `[${props.description}](${json.team_url} '${json.team_url}')`
                            }

                            let teamName = ""
                            let teamURL = "https://letsplay.live/"

                            if (json?.tournament_id) {
                                teamName += json.tournament_id + '/'
                                teamURL += "tournaments/" + json.tournament_id + '/'
                            }
                            if (json?.team_id) {
                                teamName += json.team_id
                                teamURL += "team/" + json.team_id
                            }
                            if (teamName != "") {
                                teamName = "LPL Team #" + teamName
                                props.description += ` *([${teamName}](${teamURL} '${teamURL}'))*`
                            }

                            embed.setDescription(props.description)
                        }

                        if (json?.team_avatar && json.team_avatar != "") {
                            embed.setAuthor(title, defaults.thumbnail, url)
                            embed.setThumbnail(json.team_avatar)
                        } else {
                            embed.setTitle(title)
                        }

                        for (let [timestamp, match] of Object.entries(game_details)) {
                            if (!match) {
                                noMatches = true
                                continue
                            }

                            let name = ""
                            let value = ""
                            if (match.discord.status == "complete") {
                                name += ((match.discord.winner == match.discord.team) ? "🟩" : "🟥");
                                value += "Started"
                            } else {
                                name += emoji
                                value += "Starting"
                            }
                            name += match.discord.team + " 🆚 " + match.discord.opponent
                            value += ": <t:" + match.discord.timestamp + ":f>" + "\n";
                            if(match.discord.timestamp < (60 * 60 * 24 * 5)) {
                              value = ""
                            }
                            if(match.discord.status == "incomplete" || (match.discord.scoreKeys.bySide.home != 0 || match.discord.scoreKeys.bySide.opponent != 0)) {
                                value += '[';
                                if(match.discord.status == "complete") {
                                    value += "Final ";
                                }
                                value += "Score: " + match.discord.scoreKeys.bySide.home + " - " + match.discord.scoreKeys.bySide.opponent;
                                value += `](${match.discord.url} '${match.discord.url}')`;
                            }
                            embed.addField(name, value)
                        }

                        if (noMatches) {
                            let teamName = "LPL Team #"
                            let teamURL = "https://letsplay.live/"

                            if (json?.tournament_id) {
                                teamName += json.tournament_id + '/'
                                teamURL += "tournaments/" + json.tournament_id + '/'
                            }
                            if (json?.team_id) {
                                teamName += json.team_id
                                teamURL += "team/" + json.team_id
                            }
                            if (json?.team) {
                                teamName = json.team + " (" + teamName + ')'
                            }

                            embed.setDescription(
                                [
                                    "__***" + emoji + teamName + "***__",
                                    `No selected matches found for [${teamName}](${teamURL} '${teamURL}').`
                                ].join("\n")
                            )
                        }
                    } catch(e) {
                        console.log(e)
                        // console.log(`Malformed JSON:${url}`)
                    }
                });
                pages.push(embed)
            }
        }

        if (pages.length) {
            await this.send(message, pages, [], "", true)
            this.null = true
        } else {
            // something got stuffed up
            this.error = true
            this.props.description = [
                `${message.author}, the correct usage is:`,
                "`" + this.prefix + "matches [all|incomplete|complete|next]`",
                "`" + this.prefix + "matches <LPL teamID> [all|incomplete|complete|next]`",
                "`" + this.prefix + "matches <LPL tourneyID> <LPL teamID> [all|incomplete|complete|next]`"
            ].join("\n")
            return
        }
    }
}
