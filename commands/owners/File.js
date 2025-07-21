const fs = require("fs");
const path = require("path");
const access = require("../../owner");
const { createEmbed } = require("../../embed");
const emoji = require("../../emoji");

module.exports = {
  name: "files",
  description: "Show bot project structure (Owner only)",
  async execute(client, message, args) {
    if (message.author.id !== access.ownerID) {
      return message.reply({
        embeds: [createEmbed("#FF0000", `${emoji.error} | You are not authorized to use this command.`, message.author, client)]
      });
    }

    const baseDir = path.join(__dirname, "../../");

    // System-related files/folders to ignore
    const ignoreList = [
      "node_modules",
      "package-lock.json",
      "package.json",
      ".npm",
      ".git",
      ".gitignore",
      ".env",
      "logs",
      "README.md"
    ];

    let fileCount = 0;
    let folderCount = 0;

    function buildTree(dir, prefix = "") {
      const items = fs.readdirSync(dir).sort();
      let output = "";

      for (const item of items) {
        if (ignoreList.includes(item)) continue;

        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        const isDir = stats.isDirectory();

        if (isDir) {
          folderCount++;
          output += `${prefix}📁 ${item}/\n`;
          output += buildTree(fullPath, prefix + "  ");
        } else {
          fileCount++;
          output += `${prefix}📄 ${item}\n`;
        }
      }

      return output;
    }

    const tree = buildTree(baseDir);
    const trimmedTree = tree.length > 3900 ? tree.substring(0, 3900) + "\n..." : tree;

    const embed = createEmbed(
      "#00FFFF",
      `**Bot File Structure**\n\`\`\`\n${trimmedTree}\n\`\`\`\nTotal Files: \`${fileCount}\`\nTotal Folders: \`${folderCount}\``,
      message.author,
      client
    );

    return message.channel.send({ embeds: [embed] });
  }
};