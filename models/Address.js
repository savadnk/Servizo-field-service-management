const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        required: true
    }, 
    label: { type: String},
    street: { type: String, required: true },
     city:   { type: String, required: true },
  state:  { type: String, required: true },
  pincode:{ type: String, required: true },
    latitude: {type: Number},
    longitude: {type: Number},
    address: {type: String},
    isDefault: {type: Boolean, default: false}
},{
    timestamps: true
});

const Address = mongoose.model("Address", AddressSchema)

module.exports = Address;