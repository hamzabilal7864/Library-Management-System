const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const bookRoutes = require('./routes/bookRoutes');
const issueRoutes = require('./routes/issueRoutes');
const statisticsRoutes = require('./routes/StatisticRoutes');



dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/issue', issueRoutes);
app.use('/api', statisticsRoutes);

app.get('/', (req,res)=>{
  res.send({
    activestatus:true,
    error:false,
  })
})

mongoose.connect(process.env.MONGODB_URI, {
  
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.log('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
