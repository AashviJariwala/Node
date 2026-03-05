const user=require("../models/user");
const role=require("../models/role");
const department=require("../models/department");
const roleDept=require("../models/roleDept");
const ApiError = require("../utils/ApiError");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

exports.idCardVerification = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    
    const filePath = req.file.path;

    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));

    // Call FastAPI
    const response = await axios.post(
      "http://127.0.0.1:8000/extract-text",
      form,
      {
        headers: form.getHeaders(),
      }
    );
    console.log(response);
    var arr1=response.data.text.split("\n");
    var arr2=[];
    var flag=false;
    for(var i of arr1){
      if(i.includes("Department") || i.includes("Designation")){
        arr2.push(i)
        flag=true
      }
    }
    if(flag==false){
      return res
      .status(200)
      .send({ success: true, msg:"Invalid id card" });
    }

    const result = arr2.map(item => {
      const cleaned = item.replace('&', '').trim();
      const [key, value] = cleaned.split(':');
      return {
        label: key.trim(),
        value: value.trim()
      };
    });

    for( var i of result){
      if(i.label=="IEE Department")
        var dept=i.value
      else
        var roles=i.value
    }
    
    const findRole=await role.findOne({name:roles.toLowerCase()})
    const findDept=await department.findOne({name:dept.toLowerCase()})
    const findRoleDept=await roleDept.findOne({rid:findRole._id,did:findDept._id})

    const editUser=await user.findOneAndUpdate({_id:req.user._id},{$set:{rdid:findRoleDept._id,idCard:req.file.filename,isVerified:1}},{new:true});
    console.log(editUser);
    
    return res
        .status(200)
        .send({ success: true, data: editUser });
  } catch (err) {
    console.error("FastAPI Error:", err.message);
    return next(new ApiError(err));
  }
};