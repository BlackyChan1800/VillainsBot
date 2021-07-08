const fs = require('fs');
const weather = require('weather-js');

const Discord = require('discord.js');

let GLOBALS = JSON.parse(fs.readFileSync("PROFILE.json", "utf8"))
let defaults = JSON.parse(fs.readFileSync("dbs/defaults.json", "utf8"))
let DEV = GLOBALS.DEV

module.exports = {
    name: 'weather',
    description: "Check your weather!",
    async execute(message, args, cmd, client, Discord) {
        let props = {}
        let stripe = defaults["stripe"]
        switch (stripe) {
            default:
                stripe = "#B2EE17";
                break;
        }

        // Hack in my stuff to differentiate
        if (DEV) {
            stripe = GLOBALS["stripe"]
            defaults.footer = GLOBALS.footer
        }

        props["stripe"] = stripe

        const InvalidLocationEmbed = new Discord.MessageEmbed()
            .setTitle("Error")
            .setDescription("**Invalid** Location")
            .setColor('RED')

        weather.find({search: args.join(" "), degreeType: 'C'}, function (error, result) {
            if(error) return message.channel.send(error);
            if(!args[0]) return message.channel.send('Please specify a location')

            if(result === undefined || result.length === 0) return message.channel.send(InvalidLocationEmbed);

            var current = result[0].current;
            var location = result[0].location;

            const weatherinfo = new Discord.MessageEmbed()
                .setDescription(`**${current.skytext}**`)
                .setAuthor(`Weather forecast for ${current.observationpoint}`)
                .setThumbnail(current.imageUrl)
                .setColor(props.stripe)
                .addField('Timezone', `UTC${location.timezone}`, true)
                .addField('Degree Type', 'Celsius', true)
                .addField('Temperature', `${current.temperature}°`, true)
                .addField('Wind', current.winddisplay, true)
                .addField('Feels like', `${current.feelslike}°`, true)
                .addField('Humidity', `${current.humidity}%`, true)
                .setFooter(defaults.footer.msg, defaults.footer.image)
                .setTimestamp();

            message.channel.send(weatherinfo)
        })
    }
}