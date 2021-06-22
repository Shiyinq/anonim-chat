const mongoose = require("mongoose")

const queueSchema = new mongoose.Schema({ 
    user_id: { type: Number, required: true }, 
});
  
module.exports = mongoose.model("Queue", queueSchema)