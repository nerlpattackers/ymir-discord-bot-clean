require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

/* =====================================
   CLIENT
===================================== */

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const CHANNEL_ID = process.env.CHANNEL_ID;
const ROLE_PING = `<@&${process.env.ROLE_ID}>`;

/* =====================================
   RUNTIME EVENT TOGGLES
===================================== */

let EVENT_TOGGLES = {
  loki: true,
  serverbattle: true,
  ymircup: true
};

/* =====================================
   EMBED HELPERS
===================================== */

const infoEmbed = (title, desc, color = 0x5865f2) =>
  new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .setColor(color)
    .setFooter({ text: "Legend of YMIR • Event Control" })
    .setTimestamp();

const reminderEmbed = (title, desc) =>
  new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .setColor(0x3498db)
    .setFooter({ text: "Legend of YMIR • Server Time (UTC+8)" })
    .setTimestamp();

const startEmbed = (title, desc) =>
  new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .setColor(0xe74c3c)
    .setFooter({ text: "Legend of YMIR • Fight with honor" })
    .setTimestamp();

/* =====================================
   SLASH COMMANDS
===================================== */

const commands = [
  new SlashCommandBuilder()
    .setName("event")
    .setDescription("Admin controls for game events")
    .addSubcommand(sub =>
      sub
        .setName("toggle")
        .setDescription("Enable or disable an event")
        .addStringOption(opt =>
          opt
            .setName("event")
            .setDescription("Event name")
            .setRequired(true)
            .addChoices(
              { name: "Loki (World Boss)", value: "loki" },
              { name: "Server Battle", value: "serverbattle" },
              { name: "YMIR Cup", value: "ymircup" }
            )
        )
        .addStringOption(opt =>
          opt
            .setName("state")
            .setDescription("Turn event on or off")
            .setRequired(true)
            .addChoices(
              { name: "ON", value: "on" },
              { name: "OFF", value: "off" }
            )
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("status")
        .setDescription("View current event status")
    )
].map(cmd => cmd.toJSON());

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
  console.log("✅ Slash commands registered");
}

/* =====================================
   INTERACTION HANDLER
===================================== */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // Admin only
  if (
    !interaction.member.permissions.has(
      PermissionsBitField.Flags.Administrator
    )
  ) {
    return interaction.reply({
      content: "❌ You do not have permission to use this command.",
      ephemeral: true
    });
  }

  if (interaction.commandName === "event") {
    const sub = interaction.options.getSubcommand();

    /* -------- TOGGLE -------- */
    if (sub === "toggle") {
      const event = interaction.options.getString("event");
      const state = interaction.options.getString("state");

      EVENT_TOGGLES[event] = state === "on";

      return interaction.reply({
        embeds: [
          infoEmbed(
            "🎛️ Event Updated",
            `**${event.toUpperCase()}** is now **${state.toUpperCase()}**`,
            state === "on" ? 0x2ecc71 : 0xe74c3c
          )
        ]
      });
    }

    /* -------- STATUS -------- */
    if (sub === "status") {
      const statusText = `
🧊 **Phantom of Loki:** ${EVENT_TOGGLES.loki ? "🟢 ENABLED" : "🔴 DISABLED"}
🏰 **Server Battle:** ${EVENT_TOGGLES.serverbattle ? "🟢 ENABLED" : "🔴 DISABLED"}
🏆 **YMIR Cup:** ${EVENT_TOGGLES.ymircup ? "🟢 ENABLED" : "🔴 DISABLED"}
      `;

      return interaction.reply({
        embeds: [
          infoEmbed(
            "📊 Event Status",
            statusText.trim()
          )
        ]
      });
    }
  }
});

/* =====================================
   (EVENT LOGIC REMAINS UNCHANGED)
   Loki / Server Battle / YMIR Cup
===================================== */

// 👉 Keep your existing checkLoki(), checkServerBattle(), checkYmirCup() here
// 👉 They already respect EVENT_TOGGLES

/* =====================================
   BOT START
===================================== */

client.once("ready", async () => {
  console.log(`🤖 Bot online as ${client.user.tag}`);
  await registerCommands();

  setInterval(() => {
    // checkLoki();
    // checkServerBattle();
    // checkYmirCup();
  }, 60 * 1000);
});

console.log("DISCORD_TOKEN exists:", !!process.env.DISCORD_TOKEN);
console.log("DISCORD_TOKEN length:", process.env.DISCORD_TOKEN?.length);
console.log("DISCORD_TOKEN type:", typeof process.env.DISCORD_TOKEN);

client.login(process.env.DISCORD_TOKEN);
