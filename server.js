const express = require('express');
const mongoose = require('mongoose');
const tasksRouter = require('./routes/tasks');

const app = express();
app.use(express.json());

app.use('/api/tasks', tasksRouter);

// basic error handling
app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taskme';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => {
		app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
	})
	.catch(err => {
		console.error('MongoDB connection error', err);
		process.exit(1);
	});