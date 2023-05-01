const mongoose = require('mongoose');

// 连接mongodb数据库
mongoose.connect("mongodb://127.0.0.1:27017/loseMg")
//mongoose.connect("mongodb://yuegeyu:595696073@127.0.0.1:27017/loseMg?authSource=admin")
.then(() => {
    console.log("数据库连接成功!")
})
.catch((err) => {
    console.log("数据库连接失败!", err);
})

// 丢失物品表
const LoseSchema = new mongoose.Schema({
    openid: {
        type: String
    },
    type: {
        type: Number,
    },
    classify1: {
        type: String
    },
    classify2: {
        type: String
    },
    name: {
        type: String
    },
    date: {
        type: String
    },
    region: {
        type: String
    },
    phone: {
        type: String
    },
    desc: {
        type: String,
        default: ''
    },
    imgList: {
        type: Array,
        default: []
    },
    time: {
        type: Number
    },
    commentList:{
        type:Array,
        default:[]
    },
    claimInfo:{//认领信息
        type:mongoose.Schema.Types.Mixed,//一个什么都存都接受的数值类型
        default:{}
    },//写object也可以但是这并不标准mongoDB不存在该类型的保存，object此处指js原生对象
    state:{//认领状态：0未认领，1认领中，2已认领
        type:Number,
        default:0
    }
})

// 收藏物品
const CollectionSchema = new mongoose.Schema({
    //收藏的什么，对应Los表的_id
    id: {//此处收藏的自写id即为物品表的_id
        type:mongoose.Schema.Types.ObjectId,//mongoDB中_id的存储格式
        ref:'Lose'
    },//对Lose表的映射
    openid: {//谁收藏的
        type: String,
    },
  
})

// 用户账号
const UserSchema = new mongoose.Schema({
    openid: {
        type: String
    },
    username: {
        type: String
    },
    password: {
        type: String
    },
    date: {
        type: Number
    } 
})


// 管理员账号
const AdminSchema = new mongoose.Schema({
    username: {
        type: String
    },
    password: {
        type: String
    },
    create_time: {
        type: Number
    },
    // 0 超级管理员 1 管理员
    role: {
        type: Number
    },
    nickname: {//昵称
        type: String
    }
})

const Lose = mongoose.model("Lose", LoseSchema);
const Collection = mongoose.model("Collection", CollectionSchema);
const User = mongoose.model("User", UserSchema);
const Admin = mongoose.model("Admin", AdminSchema);

// for (let i = 0; i < 10; i++) {
//     Lose.create({
//         openid: 'o1rUR5dHCRwTftgzmc6sh4hE8bwM',
//         type: 0,
//         classify1: '卡片、证件类',
//         classify2: '身份证',
//         name: '1',
//         date: '2',
//         region: '3',
//         phone: '4',
//         desc: '5',
//         imgList: [ "http://localhost:3001/file/b4109e31-00e7-44e9-af83-e7eaeb56f50d.png" ],
//         time: 1669212404681
//     })
// }

/* Admin.create({
    username:"123456",
    password:"123456",
    create_time:1681721489191,
    role:0,
    nickname:"Creator"

}) */

module.exports = {
    Lose,
    Collection,
    User,
    Admin,
}