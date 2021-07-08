const profileModel = require("../models/profileSchema");
const fs = require('fs');
const {
  MessageEmbed
} = require('discord.js');

module.exports = {
  name: "withdraw",
  aliases: ['wd', 'with'],
  permissions: [],
  description: "withdraw coins from your bank",
  async execute(message, args, cmd, client, Discord, profileData) {
    var amount = args[0].toLowerCase()

    if (amount == 'all') amount = parseInt(profileData.gold);
    if (amount == 'half') amount = parseInt(profileData.gold / 2);

    if (amount % 1 != 0 || amount <= 0) return message.channel.send(`Withdrawn amount must be a whole number(${amount} given)`);

    try {
      if (amount > profileData.bank) return message.channel.send(`You don't have that amount of coins to withdraw`);

      await profileModel.findOneAndUpdate({
        userID: message.author.id,
      }, {
        $inc: {
          gold: amount,
          bank: -amount,
        },
      });

      let GLOBALS = JSON.parse(fs.readFileSync("PROFILE.json", "utf8"))
      let defaults = JSON.parse(fs.readFileSync("dbs/defaults.json", "utf8"))
      let DEV = GLOBALS.DEV;

      let stripe = defaults["stripe"]

      let props = {
        "title": "**Withdrawal**"
      }
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
      const newEmbed = new MessageEmbed()
        .setColor(props.stripe)
        .setTitle(props.title)
        .setDescription(`**${message.author} Withdrew ${amount.toLocaleString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} Gold into their Wallet!**\n _Check your balance using .Balance_`)
        .setThumbnail(message.author.avatarURL({
          dynamic: true,
          format: 'png',
          size: 256
        }))
        .setFooter(defaults.footer.msg, defaults.footer.image)
        .setTimestamp();

      return message.channel.send(newEmbed);

    } catch (err) {
      console.log(err);
    }
  },
};