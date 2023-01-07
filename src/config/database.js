const mongoose = require('mongoose')

mongoose.set('useFindAndModify', true)
mongoose.connect(process.env.MONGO_URI, { 
		useNewUrlParser: true, 
		useUnifiedTopology: true 
	}).then(() => {
        console.log('✔ Database Connected')
    }).catch((err) => {
        console.error('✘ MONGODB ERROR: ', err.message)
    })