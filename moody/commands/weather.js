const VillainsCommand = require('../classes/vcommand.class');
const VillainsEmbed = require('../classes/vembed.class');

const weather = require('weather-js');

module.exports = class WeatherCommand extends VillainsCommand {
    constructor() {
        super({
            name: "weather",
            aliases: [ "w" ],
            category: "diagnostic",
            description: "Check your weather!"
        })
    }

    async run(client, message, args) {
        let props = {
            caption: { text: "Weather" },
            players: { bot:{}, user: {} }
        }

        let degreeType = "C"
        if (["C","F"].indexOf(args[args.length - 1].toUpperCase()) > -1) {
            degreeType = args.pop().toUpperCase()
        }
        let search = args.join(" ")
        weather.find({
            search: search,
            degreeType: degreeType
        }, await function(error, result) {
            if(error || !args[0] || result === undefined || result.length === 0) {
                props.caption.text = "Error"
                props.color = "RED"
                if(error) {
                    props.description = error
                } else if(!args[0]) {
                    props.description = "Please specify a location"
                } else if(result === undefined || result.length === 0) {
                    props.description = "**Invalid** Location"
                } else {
                    props.description = "Something got stuffed up here..."
                }
            } else {
                let current = result[0].current;
                let location = result[0].location;
                props.description = `**${current.skytext}**`
                props.caption.text = `Weather forecast for ${current.observationpoint}`
                props.players.bot.url = `https://www.accuweather.com/en/search-locations?query=` + encodeURI(`${current.observationpoint}`)
                props.players.user.avatar = current.imageUrl
                props.fields = [
                    {
                        name: "Timezone",
                        value: "UTC" + (parseInt(location.timezone) >= 0 ? '+' : "") + location.timezone,
                        inline: true
                    },
                    {
                        name: "Degree Type",
                        value: degreeType,
                        inline: true
                    },
                    {
                        name: "Temperature",
                        value: `${current.temperature}°${degreeType}`,
                        inline: true
                    },
                    {
                        name: "Wind",
                        value: current.winddisplay,
                        inline: true
                    },
                    {
                        name: "Feels Like",
                        value: `${current.feelslike}°${degreeType}`,
                        inline: true
                    },
                    {
                        name: "Humidity",
                        value: `${current.humidity}%`,
                        inline: true
                    }
                ]
            }
            let embed = new VillainsEmbed(props)
            message.channel.send(embed)
        })
    }
}