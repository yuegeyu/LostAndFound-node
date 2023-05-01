const express = require('express');
const app = express();
const { Lose, Collection, User, Admin } = require('./db');
const multer = require('multer');
const { v4 } = require('uuid');
const axios = require('axios');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

app.all("*", (req, res, next) => {  //跨域问题，访不同端口之间的访问
    res.setHeader("Access-Control-Allow-Origin", '*');
    res.setHeader("Access-Control-Allow-Headers", '*');
    /* res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header('Access-Control-Allow-Headers', ['mytoken','Content-Type']); */

    next();
})

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./file")
    },
    filename: (req, file, cb) => {
        let type = file.originalname.replace(/.+\./, ".");
        console.log(type);
        cb(null, `${v4()}${type}`)
    }
})

const upload = multer({ storage });

// 实现物品的发布功能
app.post("/publish", async (req, res) => {
    // 1. 获取前端传过来的数据, 
    // 2. 将数据存入Lose数据表里
    try {
        const { type, classify1, classify2, name, date, region, phone, desc, imgList, time, openid } = req.body;
        await Lose.create({
            type, classify1, classify2, name, date, region, phone, desc, imgList, time, openid
        });
        res.send("success");
    } catch (error) {
        console.log(error);
        res.send("error");
    }
})

// 上传图片
app.post("/uploadImg", upload.array("file", 6), (req, res) => {
    res.send(req.files);
})

// 获取首页的数据
app.get("/getLose", async (req, res) => {
    const { type } = req.query;
    const result = await Lose.find({
        type,
    }).sort({time:-1});//将数据使用sort函数实现降序排序，默认1为升序-1为降序
    res.send(result);//以此实现了发布的物品最新发布的在最上面
})

// 收藏物品
app.post("/toCollection", async (req, res) => {
    try {
        const {  id, openid } = req.body;
        await Collection.create({
          id, openid
        })
        res.send("success");
    } catch (error) {
        console.log(error);
        res.send("error");
    }

})

// 实现登录操作
app.get("/login", async (req, res) => {
    const { code } = req.query;
    console.log(code)
    try {
       
// const { data: { openid } } = await axios.get(`https://api.weixin.qq.com/sns/jscode2session?appid=wx1064ad4300f87c8b&secret=b4357db4524b9a7da42eec4691030f64&js_code=${code}&grant_type=authorization_code`)
 const { data: { openid } } = await axios.get(`https://api.weixin.qq.com/sns/jscode2session?appid=wx1064ad4300f87c8b&secret=6c85aa9e0a9875d36d57e149f229460d&js_code=${code}&grant_type=authorization_code`)
/* .then(res=>{
        console.log('请求openid接口成功了')   
        console.log(res)
        }).catch(err=>{
        console.log('请求openid接口失败了')   
            console.log(err)
        }); */
        //console.log(openid);
        //res.send(result)
        res.send(openid);
    } catch (error) {
        console.log('后端服务报错')
       // console.log(error);
        res.send("error");
    }
})

// 查询当前物品有没有被当前这个人收藏过
app.post("/checkCollection", async (req, res) => {
    const { id, openid } = req.body;
    const result = await Collection.find({
        id,
        openid
    });
    res.send(result);
})

// 取消收藏
app.post("/cancelCollection", async (req, res) => {
    try {
        const { id, openid } = req.body;
        await Collection.findOneAndRemove({
            id,
            openid
        });
        res.send("success");
    } catch (error) {
        console.log(error);
        res.send("error");
    }
})

// 获取收藏夹的数据
app.post("/getCollection", async (req, res) => {
    const { openid,type  } = req.body;
    const result = await Collection.find({
        openid,
       //因为collection表中已经没有type字段了所以在该表查询type无效，而lose表中还有
    }).populate('id');//联表查询外键，查询与id相关联的表
    const _result = result.filter(item =>item.id.type===type);//筛选当前寻主或寻物下的数据
    res.send(_result);
})

// 获取我的发布的数据
app.get("/getMyPublish", async (req, res) => {
    const { openid, type } = req.query;
    const result = await Lose.find({
        openid,
        type
    });
    res.send(result);
})

// 通过二级分类查数据
app.post("/getClassifyTwo", async (req, res) => {
    const { type, classify2 } = req.body;
    const result = await Lose.find({
        type,
        classify2
    });
    res.send(result);
})

// 模糊查询物品名字
app.get("/searchLose", async (req, res) => {
    const { name, type } = req.query;
    const _name = new RegExp(name, 'i');
    let result = null;
    if (type) {
        result = await Lose.find({
            name: _name,
            type
        });
    } else {
        result = await Lose.find({
            name: _name,
        });
    }

    res.send(result);
})


// 注册
app.post('/register', async (req, res) => {
    const { openid, username, password, date } = req.body;
    const result = await User.findOne({
        username
    });

    if (result) {
        res.send("Registered");
    } else {
        await User.create({
            openid,
            username,
            password,
            date
        });
        res.send("success");
    }
})

// 登录
app.post("/toLogin", async (req, res) => {
    const { username, password } = req.body;
    const result = await User.findOne({
        username
    });
    if (result) {
        if (result.password === password) {
            res.send("success");
        } else {
            res.send("pwdError")
        }
    } else {
        res.send("error");
    }
})

// 小程序端删除寻物或寻主数据
app.post("/deleteLose", async (req, res) => {
    const { _id } = req.body;
    try {
        await Lose.findByIdAndRemove(_id);
        await Collection.findOneAndRemove({//查询后删除与 上者不同，上者依据条件直接删除
            id:_id//此处需根据查询条件得到后进行删除
        })//因为coleection表的id保存的时Lose表的_id因此可以关联删除
        res.send("success");
    } catch (error) {
        res.send("error");
    }
})

// 小程序端修改寻物或寻主数据
app.post("/updateLose", async (req, res) => {
    const { type, classify1, classify2, name, date, region, phone, desc, imgList, time, openid, id } = req.body;
    try {
        await Lose.findByIdAndUpdate(id, {
            type, classify1, classify2, name, date, region, phone, desc, imgList, time, openid,
        })
        res.send("success");
    } catch (error) {
        res.send("error");
    }
})

// 查询物品详情数据
app.post("/getDetail", async (req, res) => {
    const { _id } = req.body;
    try {
        const result = await Lose.findById(_id);
        res.send(result);
    } catch (error) {
        res.send("error");
    }
})

// 管理员登录
app.post("/admin/login", async (req, res) => {
    const { username, password } = req.body;
    const result = await Admin.findOne({
        username
    })

    if (result && result.password === password) {
        // 登录成功
        res.send(result);
    } else {
        res.send("error");
    }
})

// 寻主/寻物数据
app.post("/admin/getLose", async (req, res) => {
    const { type, page, size } = req.body;
    try {
        const result = await Lose.find({
            type
        }).skip((page - 1) * size).limit(size);
        const total = await Lose.find({
            type
        }).countDocuments();
        res.send({
            result,
            total
        })
    } catch (error) {
        res.send(error);
        console.log(error)
    }

})

// 删除寻物/寻主数据
app.post("/admin/delete", async (req, res) => {
    const { _id } = req.body;
    try {
        await Lose.findByIdAndRemove(_id);
        res.send("success");
    } catch (error) {
        res.send(error);
    }
})

// 用户数据
app.post("/admin/getUser", async (req, res) => {
    const { page, size, search } = req.body;
    try {
        if (search) {
            const username = new RegExp(search, 'i');
            const result = await User.find({
                username
            })
                .skip((page - 1) * size).limit(size);
            const total = await User.find().countDocuments();

            res.send({
                result,
                total
            })
        } else {
            const result = await User.find()
                .skip((page - 1) * size).limit(size);
            const total = await User.find().countDocuments();

            res.send({
                result,
                total
            })
        }
    } catch (error) {
        res.send(error);
    }
})

// 删除用户信息
app.post("/admin/deleteUser", async (req, res) => {
    const { _id } = req.body;
    try {
        await User.findByIdAndRemove(_id);
        res.send("success");
    } catch (error) {
        res.send("error");
    }
})

// 管理员信息
app.post("/admin/getAdmin", async (req, res) => {
    const { page, size, search } = req.body;
    try {
        if (search) {
            const username = new RegExp(search, 'i');
            const result = await Admin.find({
                username
            })
                .skip((page - 1) * size).limit(size);
            const total = await Admin.find().countDocuments();

            res.send({
                result,
                total
            })
        } else {
            const result = await Admin.find()
                .skip((page - 1) * size).limit(size);
            const total = await Admin.find().countDocuments();

            res.send({
                result,
                total
            })
        }
    } catch (error) {
        res.send(error);
    }
})

// 删除管理员信息
app.post("/admin/deleteAdmin", async (req, res) => {
    const { _id, username } = req.body;
    try {
        const { role } = await Admin.findOne({
            username
        });
        if (role === 1) {
            res.send("noPower");
        } else {
            await Admin.findByIdAndRemove(_id);
            res.send("success");
        }
    } catch (error) {
        res.send("error");
    }
})

// 新增管理员
app.post("/admin/addAdmin", async (req, res) => {
    const { username, password, role, nickname, _id } = req.body;

    try {
        if (_id) {
            // 编辑
            await Admin.findByIdAndUpdate(_id, {
                username,
                password,
                role,
                nickname,
            })
        } else {
            // 新增
            await Admin.create({
                username,
                password,
                role,
                nickname,
                create_time: new Date().getTime()
            })
        }
        res.send("success");
    } catch (error) {
        res.send("error");
    }
})

// 查询当前管理员权限
app.post("/admin/getPower", async (req, res) => {
    const { username } = req.body;

    try {
        const { role } = await Admin.findOne({
            username
        });
        if (role === 0) {
            res.send(true);
        } else {
            res.send(false);
        }
    } catch (error) {
        res.send("error");
    }
})
//提交评论
app.post("/addComment",async(req,res)=>{
    const {avatarUrl,nickName,content,time,_id}=req.body;
    try{
        let result=await Lose.findById(_id);
        let {commentList} =result;
        commentList.push({
            avatarUrl,
            nickName,content,time,
        })
        await Lose.findByIdAndUpdate(_id,{
            commentList
        })
        result["commentList"]=commentList;
        res.send({
            status:"success",
            data:result
        });
    } catch(error){
        res.send({
            status:"error",
            data:error
        });
    }
})
//认领
app.post('/toClaim',async(req,res)=>{
    try{
        const {desc,img_url,openid,_id}=req.body;
        await Lose.findByIdAndUpdate(_id,{
            claimInfo:{
                desc,
                img_url,
                openid
            },
            state:1
        });
        res.send("success")
    }catch(error){
        console.log(error)
        res.send("error");

    }
})

//审核认领
app.post("/admin/reviewClaim",async(req,res)=>{
    try{
        const {_id,state} =req.body;
        await Lose.findByIdAndUpdate(_id,{
            state
        });
        res.send("success");
    }catch(error){
        console.log(error);
        res.send("error");
    }
})

//hellow
 app.get("/hello",async(req,res)=>{
    res.send('hello')
}) 

app.listen(3001, () => {
    console.log('server running!');
})