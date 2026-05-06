require('dotenv').config()
let http = require('http')
let cors = require('cors')
let express = require('express')
let mainRoutes = require('./Routes/mainRoutes')
let mongoose = require('mongoose')
let cookieParser = require('cookie-parser');
let {Server} = require('socket.io')
let app = express()
let server = http.createServer(app);

let corsOptions = {
    origin: 'https://cowork-frontend-production.up.railway.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}


app.use(cors(corsOptions))

let io = new Server(server, {
    cors: corsOptions
});


//to parse json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//to parse cookies
app.use(cookieParser());

//middleware for apis
app.use('/api', mainRoutes)


//connection to mongodb database called cowork
mongoose.connect(process.env.MONGO_URI)
let con = mongoose.connection

//
io.on('connection', (socket)=>{

    console.log('A new user just Joined');

    socket.on('join_room', (code)=>{
        socket.join(code);
        console.log(`User joined room: ${code}`)
    })

    socket.on('send_content', (data) => {
        io.to(data.room).emit('receive_content', data)
    })

})

io.on('disconnect', ()=>{
	
})


//checking connection
con.on('open', ()=>{

    server.listen(process.env.PORT || 4000, '0.0.0.0', ()=> console.log('Connected Successfully'))
    

});
