// const { User, SuperAdmin, Admin, Worker, Customer } = require("../models/User")

// const createUser = async (req,res) => {
//     try{
//         const { name, email, phone, password, role } = req.body;

//         let user;
//         switch(role){
//             case "superadmin":
//                 user = SuperAdmin.create({ name, email, phone, password, role})
//                 break;
//             case "admin":
//                 user = Admin.create({ name, email, phone, password, role})
//                 break;
//             case "worker":
//                 user = Worker.create({ name, email, phone, password, role})
//                 break;
//             case "Customer":
//                 user = Customer.create({ name, email, phone, password, role})
//                 break;
//             default:
//                 return res.status(400).json({ message: "Invalid role" });            
//         }

//         res.status(201).json(user)

//     }catch(error){
//         console.log(error);
//         res.status(500).json({ message: "Server Error"})
//     }
   
// }
