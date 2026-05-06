require('dotenv').config()
let express = require('express');
let user = require('../Model/user')
let jwt = require('jsonwebtoken')
let {v4: uuidv4} = require('uuid');
let projects = require('../Model/projects');
let routes = express();

let days = 3, hours = 24, minutes = 60, seconds = 60;

let maxAge = days * hours * minutes * seconds; //time for the jwt token to expire

//jwt token function
let createToken = (id)=>{

    return jwt.sign({id: id}, process.env.JWT_SECRET, {

	    expiresIn: maxAge

    });

}


//just for debug and testing
routes.get('/', (req, res)=>{

    return res.send('Hello world');

});

//api for registering new users
routes.post('/register', async(req, res)=>{

    let u = new user({
        email: req.body.email,
        username: req.body.username,
        password: req.body.password
    })

    try{
        let a1 = await u.save();
        let token = createToken(a1._id);
	    res.cookie('cowork', token, {httpOnly: true, secure:true, sameSite: 'None', maxAge : maxAge * 1000})
        res.json({toLink: '/', username: a1.username})

    }catch(err){
        console.log(err)
        return res.json({toLink: '/register'})
    }
    
    

})

//api for logging in users
routes.post('/login', async(req, res)=>{

    let username = req.body.username
    let password = req.body.password
    let u = await user.findOne({username})
    //console.log(u);
    let token = req.cookies.cowork;

    //verifying here with the availability of token
    if(token){

        jwt.verify(token, 'SECRET', (err, tokenDecoded)=>{

            if(err){
                console.log(err)
                return res.json({toLink: '/'})
            }else{
                return res.json({toLink: '/dashboard/yourproject'})
            }

        })

    }else{

        //if token not found, then authenticate by giving new token.
        if(u){
            
            let t = createToken(u._id);
            res.cookie('cowork', t, {httpOnly: true, secure:true, sameSite: 'None',maxAge: maxAge })
            return res.json({toLink: '/dashboard', username: u.username});
            
        }else{

            return res.json({toLink: '/'});

        }

    }

    

})

//api to check whether the user is already logged in or not
routes.get('/getlogin', (req, res)=>{

    let token = req.cookies.cowork;
    

    if(!token) return res.json({ toLink: '/' }) 

    jwt.verify(token, 'SECRET', async(err, tokenDecoded) => {
        if(err) return res.json({ toLink: '/' })
        let u = await user.findById(tokenDecoded.id)  
        return res.json({ toLink: '/dashboard', username: u.username})      
    })

})

//To create project
routes.post('/createproject', async(req, res) => {
    let code = uuidv4().substring(0, 8); 

    let token = req.cookies.cowork;
    let username = "";

    //verifying here with the availability of token
    if(token){

        jwt.verify(token, 'SECRET', async(err, tokenDecoded)=>{

            if(err){
                console.log(err)
                
            }else{
                let u = await user.findById(tokenDecoded.id);
                username = u.username;

                let project = new projects({
                    name: req.body.name,
                    code: code,
                    members: [username]
                })
                u.projects.push(code)
                await u.save();
                await project.save();
                return res.json({toLink: `/project/${code}`, members: project.members, code: code, content: ''})
            }

        })

    }

    
})

//To join a project
routes.post('/joinproject', (req, res) => {
    let token = req.cookies.cowork;
    let code = req.body.code;

    if(!token) return res.json({ error: 'Not authenticated' })
        
    
    jwt.verify(token, 'SECRET', async(err, tokenDecoded) => {
        if(err) return res.json({ error: 'Invalid token' }) 

        let u = await user.findById(tokenDecoded.id);
        let project = await projects.findOne({ code: code });

        if(!project) return res.json({ error: 'Project not found' })

        if(project.members.includes(u.username)){
            return res.json({ toLink: `/project/${code}`, members: project.members, code: code, content: project.content})
        }

        
        u.projects.push(code);
        await u.save();

        project.members.push(u.username)
        await project.save();
       
        return res.json({ toLink: `/project/${code}`, members: project.members, code:code, content: project.content})
    })
})

routes.post('/savedata', async(req, res)=>{

    let content = req.body.content;
    let code = req.body.code;

    await projects.findOneAndUpdate({code: code}, {content: content});
    res.json({status: 'Update successful'})


})

routes.get('/getproject', (req, res)=>{

    let token = req.cookies.cowork;
    

    if(!token) return res.json({ toLink: '/' }) 
    let projects_temp = [];
    jwt.verify(token, 'SECRET', async(err, tokenDecoded) => {
        if(err) return res.json({ toLink: '/' })
        let u = await user.findById(tokenDecoded.id)  
        for(let i = 0; i < u.projects.length; i++){
            
            let p = await projects.findOne({code: u.projects[i]})
            
            if(p){
                projects_temp.push({
                    name: p.name,
                    code: p.code
                })
            }

        }
        
        return res.json({projects: projects_temp})
    })

})

routes.get('/logout', (req, res)=>{

    res.cookie('cowork', '', {maxAge : 1})

    return res.json({toLink: '/'})

})


module.exports = routes;