require('dotenv').config();const {sql,filename}=require('../lib/storage');console.log(`Database ready: ${filename}`);console.log(sql.prepare('SELECT * FROM schema_migrations').all());sql.close();
