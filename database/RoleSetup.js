const mongoose = require('mongoose');

const roleSetupSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  roleId: {
    type: String,
  },
  managerRoleId: {
    type: String, // Used for storing the manager role ID
  },
});

module.exports = mongoose.model('RoleSetup', roleSetupSchema);