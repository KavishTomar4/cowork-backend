let express = require('express');
let user = require('../Model/user')
let jwt = require('jsonwebtoken')
let {v4: uuidv4} = require('uuid');
let projects = require('../Model/projects');
let routes = express();

let days = 3, hours = 24, minutes = 60, seconds = 60;
let maxAge = days * hours * minutes * seconds;

let getToken = (req) => {
    let auth = req.headers.authorization;
    if(auth && auth.startsWith('Bearer ')) return auth.split(' ')[1];
    return null;
}

let createToken = (id) => {
    return jwt.sign({id: id}, process.env.JWT_SECRET, { expiresIn: maxAge });
}

routes.get('/', (req, res) => {
    return res.send('Hello world');
});

routes.post('/register', async(req, res) => {
    let u = new user({
        email: req.body.email,
        username: req.body.username,
        password: req.body.password
    })
    try {
        let a1 = await u.save();
        let token = createToken(a1._id);
        res.json({ toLink: '/', username: a1.username, token: token })
    } catch(err) {
        console.log(err)
        return res.json({ toLink: '/register' })
    }
})

routes.post('/login', async(req, res) => {
    let username = req.body.username
    let password = req.body.password
    let u = await user.findOne({username})

    if(u) {
        let t = createToken(u._id);
        return res.json({ toLink: '/dashboard', username: u.username, token: t });
    } else {
        return res.json({ toLink: '/' });
    }
})

routes.get('/getlogin', (req, res) => {
    let token = getToken(req);
    if(!token) return res.json({ toLink: '/' })
    jwt.verify(token, process.env.JWT_SECRET, async(err, tokenDecoded) => {
        if(err) return res.json({ toLink: '/' })
        let u = await user.findById(tokenDecoded.id)
        return res.json({ toLink: '/dashboard', username: u.username })
    })
})

routes.post('/createproject', async(req, res) => {
    let code = uuidv4().substring(0, 8);
    let token = getToken(req);
    if(!token) return res.json({ error: 'Not authenticated' })
    jwt.verify(token, process.env.JWT_SECRET, async(err, tokenDecoded) => {
        if(err) return res.json({ error: 'Invalid token' })
        let u = await user.findById(tokenDecoded.id);
        let project = new projects({
            name: req.body.name,
            code: code,
            members: [u.username]
        })
        u.projects.push(code)
        await u.save();
        await project.save();
        return res.json({ toLink: `/project/${code}`, members: project.members, code: code, content: '' })
    })
})

routes.post('/joinproject', (req, res) => {
    let token = getToken(req);
    let code = req.body.code;
    if(!token) return res.json({ error: 'Not authenticated' })
    jwt.verify(token, process.env.JWT_SECRET, async(err, tokenDecoded) => {
        if(err) return res.json({ error: 'Invalid token' })
        let u = await user.findById(tokenDecoded.id);
        let project = await projects.findOne({ code: code });
        if(!project) return res.json({ error: 'Project not found' })
        if(project.members.includes(u.username)) {
            return res.json({ toLink: `/project/${code}`, members: project.members, code: code, content: project.content })
        }
        u.projects.push(code);
        await u.save();
        project.members.push(u.username)
        await project.save();
        return res.json({ toLink: `/project/${code}`, members: project.members, code: code, content: project.content })
    })
})

routes.post('/savedata', async(req, res) => {
    let content = req.body.content;
    let code = req.body.code;
    await projects.findOneAndUpdate({code: code}, {content: content});
    res.json({ status: 'Update successful' })
})

routes.get('/getproject', (req, res) => {
    let token = getToken(req);
    if(!token) return res.json({ toLink: '/' })
    let projects_temp = [];
    jwt.verify(token, process.env.JWT_SECRET, async(err, tokenDecoded) => {
        if(err) return res.json({ toLink: '/' })
        let u = await user.findById(tokenDecoded.id)
        for(let i = 0; i < u.projects.length; i++) {
            let p = await projects.findOne({code: u.projects[i]})
            if(p) projects_temp.push({ name: p.name, code: p.code })
        }
        return res.json({ projects: projects_temp })
    })
})

routes.get('/logout', (req, res) => {
    return res.json({ toLink: '/' })
})

module.exports = routes;