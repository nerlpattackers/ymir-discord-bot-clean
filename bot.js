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
   EVENT TOGGLES
===================================== */

let EVENT_TOGGLES = {
  loki: true,
  ymircup: true,
  growthhot: true
};

/* =====================================
   EMBEDS
===================================== */

const baseEmbed = (title, desc, color) =>
  new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .setColor(color)
    .setFooter({ text: "Legend of YMIR • Server Time (UTC+8)" })
    .setTimestamp();

const reminderEmbed = (title, desc) =>
  baseEmbed(title, desc, 0x3498db);

const startEmbed = (title, desc) =>
  baseEmbed(title, desc, 0xe74c3c);

/* =====================================
   SLASH COMMANDS (FIXED)
===================================== */

const commands = [
  new SlashCommandBuilder()
    .setName("event")
    .setDescription("Admin controls for Legend of YMIR events")
    .addSubcommand(sub =>
      sub
        .setName("toggle")
        .setDescription("Enable or disable an event")
        .addStringOption(opt =>
          opt
            .setName("event")
            .setDescription("Which event to toggle")
            .setRequired(true)
            .addChoices(
              { name: "Loki (World Boss)", value: "loki" },
              { name: "YMIR Cup", value: "ymircup" },
              { name: "Growth Hot Time", value: "growthhot" }
            )
        )
        .addStringOption(opt =>
          opt
            .setName("state")
            .setDescription("Turn the event ON or OFF")
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
   INTERACTIONS
===================================== */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({ content: "❌ Admin only.", ephemeral: true });
  }

  const sub = interaction.options.getSubcommand();

  if (sub === "toggle") {
    const event = interaction.options.getString("event");
    const state = interaction.options.getString("state");
    EVENT_TOGGLES[event] = state === "on";
    return interaction.reply(`✅ **${event}** is now **${state.toUpperCase()}**`);
  }

  if (sub === "status") {
    return interaction.reply({
      embeds: [
        reminderEmbed(
          "📊 Event Status",
          `
🧊 Phantom of Loki: ${EVENT_TOGGLES.loki ? "🟢 ENABLED" : "🔴 DISABLED"}
🏆 YMIR Cup: ${EVENT_TOGGLES.ymircup ? "🟢 ENABLED" : "🔴 DISABLED"}
📈 Growth Hot Time: ${EVENT_TOGGLES.growthhot ? "🟢 ENABLED" : "🔴 DISABLED"}
          `.trim()
        )
      ]
    });
  }
});

/* =====================================
   TIME (UTC+8)
===================================== */

function nowUTC8() {
  return new Date(Date.now() + 8 * 60 * 60 * 1000);
}

/* =====================================
   PHANTOM OF LOKI
   Tue / Thu / Sat
   12:00 & 22:00
===================================== */

const LOKI_DAYS = [2, 4, 6]; // Tue Thu Sat

async function checkLoki() {
  if (!EVENT_TOGGLES.loki) return;

  const now = nowUTC8();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();

  if (!LOKI_DAYS.includes(day)) return;

  const channel = await client.channels.fetch(CHANNEL_ID);

  if ([11, 21].includes(hour) && minute === 50) {
    channel.send({
      content: ROLE_PING,
      embeds: [
        reminderEmbed(
          "🧊 Phantom of Loki",
          "⏰ **10 MINUTES LEFT**\nPrepare your team and supplies!"
        )
      ]
    });
  }

  if ([12, 22].includes(hour) && minute === 0) {
    channel.send({
      content: ROLE_PING,
      embeds: [
        startEmbed(
          "🔥 PHANTOM OF LOKI HAS SPAWNED!",
          "⚔️ Click the boss icon to teleport.\n🎁 Hit at least once for rewards! Pogi ni lead"
        )
      ]
    });
  }
}

/* =====================================
   YMIR CUP
   Friday 20:00
===================================== */

async function checkYmirCup() {
  if (!EVENT_TOGGLES.ymircup) return;

  const now = nowUTC8();
  if (now.getDay() !== 5) return;

  const hour = now.getHours();
  const minute = now.getMinutes();
  const channel = await client.channels.fetch(CHANNEL_ID);

  if (hour === 19 && minute === 50) {
    channel.send({
      content: ROLE_PING,
      embeds: [
        reminderEmbed(
          "🏆 YMIR Cup",
          "⏰ **10 MINUTES LEFT**\nTop clans prepare for battle!"
        )
      ]
    });
  }

  if (hour === 20 && minute === 0) {
    channel.send({
      content: ROLE_PING,
      embeds: [
        startEmbed(
          "🏆 YMIR CUP HAS STARTED!",
          "🔥 Inter-server battle begins now!"
        )
      ]
    });
  }
}

/* =====================================
   GROWTH HOT TIME
   Weekday vs Weekend
   20:00–24:00
===================================== */

async function checkGrowthHotTime() {
  if (!EVENT_TOGGLES.growthhot) return;

  const now = nowUTC8();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();

  const isWeekend = day === 0 || day === 6;
  const channel = await client.channels.fetch(CHANNEL_ID);

  if (hour === 19 && minute === 50) {
    channel.send({
      content: ROLE_PING,
      embeds: [
        reminderEmbed(
          "📈 Growth Hot Time Incoming",
          isWeekend
            ? `🔥 **WEEKEND BUFFS**
• Glasir Forest: EXP +40%
• Hermod's Crossroads: EXP +40%
• Crossroads of Ragnarok: EXP +20% / PvP DEF +50%
• Hall of Valkyrie (Inter) +20%`
            : `⚔️ **WEEKDAY BUFFS**
Hunting EXP +20% For:
• Crossroads of Ragnarok: + PvP DEF +50%
• Hall of Valkyrie (Normal)`
        )
      ]
    });
  }

  if (hour === 20 && minute === 0) {
    channel.send({
      content: ROLE_PING,
      embeds: [
        startEmbed(
          "📈 GROWTH HOT TIME HAS STARTED!",
          "🔥 EXP & bonuses active until **24:00** kaya party na kayong mga ina niyo thanks"
        )
      ]
    });
  }
}

/* =====================================
   BOT START
===================================== */

client.once("ready", async () => {
  console.log(`🤖 Bot online as ${client.user.tag}`);
  await registerCommands();

  const channel = await client.channels.fetch(CHANNEL_ID);
  channel.send("✅ **Legend of YMIR Event Bot is ONLINE**");

  setInterval(() => {
    checkLoki();
    checkYmirCup();
    checkGrowthHotTime();
  }, 60 * 1000);
});

client.login(process.env.DISCORD_TOKEN);
