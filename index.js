require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const Airtable = require('airtable');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Airtable setup
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const tableName = process.env.AIRTABLE_TABLE_NAME;

// Quand le bot est prêt
client.once('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
});

// Quand un message est envoyé
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const verificationChannel = 'vérification'; // change avec le nom exact du canal
    if (message.channel.name !== verificationChannel) return;

    const code = message.content.trim().toUpperCase();

    try {
        const records = await base(tableName).select({
            filterByFormula: `{Code Final}='${code}'`
        }).firstPage();

        if (records.length === 0) {
            message.reply("Code invalide, vérifie ton email.");
            return;
        }

        const record = records[0];
        if (record.fields.Utilisé) {
            message.reply("Ce code a déjà été utilisé !");
            return;
        }

        const role = message.guild.roles.cache.get(process.env.ROLE_ID);
        if (!role) return message.reply("Rôle introuvable !");

        await message.member.roles.add(role);
        await base(tableName).update(record.id, { Utilisé: true });

        message.reply("Code validé ! Rôle ajouté ✅");

    } catch (error) {
        console.error(error);
        message.reply("Erreur serveur, contacte un admin.");
    }
});

client.login(process.env.DISCORD_TOKEN);
