import mongoose from "mongoose";
const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: false,
  },
  messageType: {
    type: String,
    enum: ["text", "file", "voice"],
    required: true,
  },
  content: {
    type: String,
    validate: {
      validator: function (v) {
        return this.messageType !== "text" || typeof v === "string";
      },
      message: "Text message must have a content string.",
    },
  },
  fileUrl: {
    type: String,
    required: function () {
      return this.messageType === "file";
    },
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  deletedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    default: [],
  }],
});

const Message = mongoose.model("Messages", messageSchema);
export default Message;
