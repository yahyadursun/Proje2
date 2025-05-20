import User from "../models/UserModel.js";
import Channel from "../models/ChannelModel.js";
import mongoose from "mongoose";
import { populate } from "dotenv";

export const createChannel = async (request, response, next) => {
  try {
    const { name, members, description } = request.body;
    const userId = request.userId;

    let membersArr = members;
    if (typeof members === "string") {
      try {
        membersArr = JSON.parse(members);
      } catch (e) {
        membersArr = [];
      }
    }

    const admin = await User.findById(userId);

    if (!admin) {
      return response.status(400).json({ message: "admin bulunamadı!" });
    }

    const validMembers = await User.find({ _id: { $in: membersArr } });

    if (validMembers.length !== membersArr.length) {
      return response.status(400).json({ message: "kullanıcı bulunamadı!" });
    }

    let imagePath = undefined;
    if (request.file) {
      imagePath = request.file.path;
    }

    const newChannel = new Channel({
      name,
      members: membersArr,
      admin: userId,
      description: description || undefined,
      image: imagePath,
    });

    await newChannel.save();
    const populatedChannel = await Channel.findById(newChannel._id)
      .populate("members", "_id firstName lastName email image color")
      .populate("admin", "_id firstName lastName email image color");
    return response.status(201).json({ channel: populatedChannel });
  } catch (error) {
    console.log("[createChannel ERROR]", error);
    if (error && error.message) console.log("[createChannel ERROR message]", error.message);
    if (error && error.stack) console.log("[createChannel ERROR stack]", error.stack);
    return response.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserChannels = async (request, response, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(request.userId);
    const channels = await Channel.find({
      $or: [{ admin: userId }, { members: userId }],
    })
      .sort({ updatedAt: -1 })
      .populate("members", "_id firstName lastName email image color")
      .populate("admin", "_id firstName lastName email image color");

    return response.status(201).json({ channels });
  } catch (error) {
    console.log({ error });
    return response.status(500).json({ message: "Internal Server Error" });
  }
};

export const getChannelMessages = async (request, response, next) => {
  try {
    const { channelId } = request.params;
    const channel = await Channel.findById(channelId).populate({
      path: "messages",
      populate: {
        path: "sender",
        select: "firstName lastName email _id image color",
      },
    });
    if(!channel) {
      return response.status(404).send("Channel not found!")
    }
    const messages = channel.messages;
    return response.status(201).json({ messages });
  } catch (error) {
    console.log({ error });
    return response.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateChannel = async (request, response, next) => {
  try {
    const channelId = request.params.id;
    const userId = request.userId;
    const { name, description, members } = request.body;

    // Kanalı bul
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return response.status(404).json({ message: "Kanal bulunamadı!" });
    }
    // Sadece admin güncelleyebilir
    if (channel.admin.toString() !== userId) {
      return response.status(403).json({ message: "Sadece admin güncelleyebilir!" });
    }

    // members string olarak gelirse parse et
    let membersArr = members;
    if (typeof members === "string") {
      try {
        membersArr = JSON.parse(members);
      } catch (e) {
        membersArr = [];
      }
    }

    // Güncellenebilir alanlar
    if (name) channel.name = name;
    if (description !== undefined) channel.description = description;
    if (membersArr && Array.isArray(membersArr)) channel.members = membersArr;
    if (request.file) {
      channel.image = request.file.path;
    }

    await channel.save();
    const populatedChannel = await Channel.findById(channel._id)
      .populate("members", "_id firstName lastName email image color")
      .populate("admin", "_id firstName lastName email image color");
    return response.status(200).json({ channel: populatedChannel });
  } catch (error) {
    console.log("[updateChannel ERROR]", error);
    if (error && error.message) console.log("[updateChannel ERROR message]", error.message);
    if (error && error.stack) console.log("[updateChannel ERROR stack]", error.stack);
    return response.status(500).json({ message: "Internal Server Error" });
  }
};
