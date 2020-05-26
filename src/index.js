const express = require('express');
require('./db/mongoose');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();
const port = process.env.PORT;


app.use(express.json());
app.use(taskRouter);
app.use(userRouter);

app.get('/', (req, res) => res.send('Hello World!'));
app.post('/test', (req, res) => {
    console.log(req.body);
    res.send('Post Request received, this is the response for ya!!');
});


app.listen( port, () => {
    console.log('Server is up on port ' + port);
});
