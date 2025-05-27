import User from "../models/UserModel.js";
import Channel from "../models/ChannelModel.js";
import mongoose from "mongoose";
import { populate } from "dotenv";
import fs from "fs";
import path from "path";

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
      creator: userId,
      admins: [userId], // Creating the channel automatically adds the creator as an admin
      description: description || undefined,
      image: imagePath,
    });

    await newChannel.save();
    const populatedChannel = await Channel.findById(newChannel._id)
      .populate("members", "_id firstName lastName email image color")
      .populate("admin", "_id firstName lastName email image color")
      .populate("creator", "_id firstName lastName email image color")
      .populate("admins", "_id firstName lastName email image color");
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
      $or: [{ admin: userId }, { members: userId }, { admins: userId }],
    })
      .sort({ updatedAt: -1 })
      .populate("members", "_id firstName lastName email image color")
      .populate("admin", "_id firstName lastName email image color")
      .populate("creator", "_id firstName lastName email image color")
      .populate("admins", "_id firstName lastName email image color");

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
    
    // Sadece admin veya yöneticiler güncelleyebilir
    const isAdmin = channel.admins.some(admin => admin.toString() === userId);
    const isMainAdmin = channel.admin.toString() === userId;
    
    if (!isAdmin && !isMainAdmin) {
      return response.status(403).json({ message: "Bu işlem için yetkiniz yok!" });
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
      .populate("admin", "_id firstName lastName email image color")
      .populate("creator", "_id firstName lastName email image color")
      .populate("admins", "_id firstName lastName email image color");
    return response.status(200).json({ channel: populatedChannel });
  } catch (error) {
    console.log("[updateChannel ERROR]", error);
    if (error && error.message) console.log("[updateChannel ERROR message]", error.message);
    if (error && error.stack) console.log("[updateChannel ERROR stack]", error.stack);
    return response.status(500).json({ message: "Internal Server Error" });
  }
};

export const addChannelAdmin = async (request, response, next) => {
  try {
    const { channelId, userId: newAdminId } = request.body;
    const currentUserId = request.userId;

    console.log('addChannelAdmin payload:', { channelId, newAdminId, currentUserId });

    const channel = await Channel.findById(channelId);
    if (!channel) {
      console.log('Channel not found:', channelId);
      return response.status(404).json({ message: "Kanal bulunamadı!" });
    }

    console.log('Channel admins:', channel.admins);
    console.log('Channel creator:', channel.creator);

    // Mevcut kullanıcının admin olup olmadığını kontrol et
    const isAdmin = Array.isArray(channel.admins) && channel.admins.some(admin => admin && admin.toString() === currentUserId);
    const isCreator = channel.creator && channel.creator.toString() === currentUserId;
    console.log('isAdmin:', isAdmin, 'isCreator:', isCreator);
    
    if (!isAdmin && !isCreator) {
      console.log('Yetkisiz istek: user', currentUserId, 'admins:', channel.admins, 'creator:', channel.creator);
      return response.status(403).json({ message: "Bu işlem için yetkiniz yok!" });
    }

    // Yeni admin kullanıcı var mı kontrol et
    const newAdmin = await User.findById(newAdminId);
    if (!newAdmin) {
      console.log('Eklenecek admin bulunamadı:', newAdminId);
      return response.status(400).json({ message: "Eklenecek admin bulunamadı!" });
    }

    // Kullanıcı zaten admin mi kontrol et
    if (channel.admins.some(admin => admin && admin.toString() === newAdminId)) {
      console.log('Bu kullanıcı zaten admin:', newAdminId);
      return response.status(400).json({ message: "Bu kullanıcı zaten admin!" });
    }

    // Admin listesine ekle
    channel.admins.push(newAdminId);
    await channel.save();

    const populatedChannel = await Channel.findById(channel._id)
      .populate("members", "_id firstName lastName email image color")
      .populate("admin", "_id firstName lastName email image color")
      .populate("creator", "_id firstName lastName email image color")
      .populate("admins", "_id firstName lastName email image color");

    console.log('Admin başarıyla eklendi:', newAdminId);
    return response.status(200).json({ channel: populatedChannel });
  } catch (error) {
    console.log("[addChannelAdmin ERROR]", error);
    return response.status(500).json({ message: "Internal Server Error", error: error.message, stack: error.stack });
  }
};

export const removeChannelAdmin = async (request, response, next) => {
  try {
    const { channelId, userId: adminToRemoveId } = request.body;
    const currentUserId = request.userId;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return response.status(404).json({ message: "Kanal bulunamadı!" });
    }

    // Sadece kanal yaratıcısı admini kaldırabilir
    if (channel.creator.toString() !== currentUserId) {
      return response.status(403).json({ message: "Sadece kanal kurucusu admin kaldırabilir!" });
    }

    // Kullanıcı kendisini kaldıramaz
    if (adminToRemoveId === currentUserId) {
      return response.status(400).json({ message: "Kendinizi admin olarak kaldıramazsınız!" });
    }

    // Admin listesinden kaldır
    channel.admins = channel.admins.filter(admin => admin.toString() !== adminToRemoveId);
    await channel.save();

    const populatedChannel = await Channel.findById(channel._id)
      .populate("members", "_id firstName lastName email image color")
      .populate("admin", "_id firstName lastName email image color")
      .populate("creator", "_id firstName lastName email image color")
      .populate("admins", "_id firstName lastName email image color");

    return response.status(200).json({ channel: populatedChannel });
  } catch (error) {
    console.log("[removeChannelAdmin ERROR]", error);
    return response.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteChannel = async (request, response, next) => {
  try {
    const { channelId } = request.params;
    const userId = request.userId;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return response.status(404).json({ message: "Kanal bulunamadı!" });
    }

    // Sadece kanalı oluşturan kullanıcı silebilir
    if (channel.creator.toString() !== userId) {
      return response.status(403).json({ message: "Sadece kanal kurucusu kanalı silebilir!" });
    }

    // Kanalın resmi varsa sil
    if (channel.image) {
      try {
        fs.unlinkSync(channel.image);
      } catch (err) {
        console.log("Resim silinirken bir hata oluştu:", err);
      }
    }

    await Channel.findByIdAndDelete(channelId);

    return response.status(200).json({ message: "Kanal başarıyla silindi" });
  } catch (error) {
    console.log("[deleteChannel ERROR]", error);
    return response.status(500).json({ message: "Internal Server Error" });
  }
};
