const mongoose = require("mongoose")

const roomSchema = new mongoose.Schema({ 
    participans: { type: Array, required: true }, 
});
  
module.exports = mongoose.model("Room", roomSchema)