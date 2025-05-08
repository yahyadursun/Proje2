import User from "../models/UserModel.js";

export const searchContancts = async (request, response, next) => {
  try {
    const { searchTerm } = request.body;
    if (searchTerm === undefined || searchTerm === null){
        return  response.status(400).json({ message: "searchTerm is required" });
    }
    const sanitizedSearchTerm = searchTerm.replace(
      /[-[\]{}()*+?.,\\^$|#\s]/g,
      "\\$&"
    );

    const regex = new RegExp(sanitizedSearchTerm,"i");
    const contacts =await User.find({
        $and:[
            {_id:{$ne:request.userId}},{
                $or:[{firstName:regex},{lastName:regex},{email:regex}]
            },
        ],
    });
    return response.status(200).json({
        contacts
    });

      return response.status(200).json({ message: "Çikiş Başari!" });
  } catch (error) {
    console.log({ error });
    return response.status(500).json({ message: "Internal Server Error" });
  }
};
