require('dotenv').config()
express = require('express')
app = express()
const connectDB = require('./db/connect')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const authRouter = require('./routes/auth')
const messagesRouter = require('./routes/messages')

const ws = require('ws')
const jwt = require('jsonwebtoken')

//models
const Message = require('./models/Message')



app.use(express.json())
app.use(cookieParser())
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL
}))


app.use('/api/v1/auth', authRouter)
app.use('/api/v1/messages', messagesRouter)

const PORT = process.env.PORT || 5000
//5:03:00 min in the video

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI)
        const server = app.listen(PORT, () =>
        console.log(`Server is running on Port ${PORT}`)
        )
        const wss = new ws.WebSocketServer({ server })
        wss.on('connection', (connection, req) => {

            const notifyOnlineUsers = () => {
                [...wss.clients].forEach(client => {
                    client.send(JSON.stringify({
                        online: [...wss.clients].map(c => ({userId: c.userId, username: c.username, name: c.name}))
                    }
                    ))
                });
            }

            connection.isAlive = true

            connection.timer = setInterval(() => {
                connection.ping();
                connection.deathTimer = setTimeout(() => {
                  connection.isAlive = false;
                  clearInterval(connection.timer);
                  connection.terminate();
                  notifyOnlineUsers();
                  console.log('disconnected');
                }, 1000);
              }, 5000);

            connection.on('pong', () => {
                clearTimeout(connection.deathTimer)
            })

            //read username and id from cookie in the connection
            console.log('connected')
            // console.log(req.headers)
            const cookies = req.headers.cookie
            if (cookies) {
                const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='))
                if(tokenCookieString) {
                    const token = tokenCookieString.split('=')[1]
                    if(token) {
                        try {
                            const payload = jwt.verify(token, process.env.JWT_SECRET)
                            const {userId, username, name} = payload
                            connection.userId = userId
                            connection.username = username
                            connection.name = name
                            // console.log(`New client connected: userId=${userId}, username=${username}`)
                        } catch (error) {
                            console.log(error)
                        }
                        
                    }
                }
            }
            connection.on('message', async (message) => {
                const messageData = JSON.parse(message.toString())
                const {recipient, text, file, snap, type, _id} = messageData
            
                if (recipient && (type === 'newMessage')) {
                    [...wss.clients]
                        .filter(c => c.userId === recipient)
                        .forEach(c => c.send(JSON.stringify(
                        {
                            text,
                            file: file ? {
                                data: file?.data,
                                fileName: file?.fileName
                            } : null,
                            snap: snap ? {
                                data: snap,
                                fileName: `${Date.now()}.webm`,
                            } : null,
                            sender: connection.userId,
                            recipient,
                            _id: _id,
                        }
                         )))
                } else if (recipient && (type === 'delete')) {
                    [...wss.clients]
                        .filter(c => c.userId === recipient)
                        .forEach(c => c.send(JSON.stringify(
                        {
                            sender: connection.userId,
                            recipient,
                            removeThisMessage: _id,
                        }
                         )))
                }
            });

           

            //show everyone the online users
            notifyOnlineUsers()

            
        });
        

    } catch (error) {
        console.log(error)
    }
}

start()
