/*

Requirements :
- show user info with user's order total amount
- add person
- add order
- delete order

Contracts :

GET /persons : show all user
{
    "sucess": true,
    "data": [
        {
            "id": 1,
            "name": "budi",
            "gender": "male",
            "department": "IT"
        },
        {
            "id": 2,
            "name": "ani",
            "gender": "female",
            "department": "HR"
        }
    ],
    "error": {}
}

GET /persons/:id : show one user by id
response
{
    "success": true,
    "data":{
        {
            "id": 1,
            "name": "budi",
            "gender": "male",
            "department": "IT"
            "amount": 100000
        }
}

POST /persons : add person
{
    "name": "andi",
    "gender": "male",
    "department": "HR"    
}

{
    "success": true,
    "data": {
        "id": 1 // order id
    }
}

POST /orders : add order
{
    "user_id": 1,
    "price": 900,
    "product": "tablet"    
}

{
    "success": true,
    "data": {
        "id": 1 // order id
    }
}

DELETE /orders/:id : delete order
{
    "success": true,
    "data": {
        "id": 1 // order id
    }
}

*/

const express = require('express')
const mysql = require('mysql2')
const bodyParser = require('body-parser')
//
const redis = require('ioredis')

const app = express()

const commonResponse = function(data, error){
    if(error){
        return {
            success : false,
            error : error
        }
    }

    return {
        success : true,
        data : data,
        error : error
    }
}

const redisCon = new redis({
    host: 'localhost',
    port: 6379
})

const mysqlCon = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'RevoUmysql123',
    database: 'revou'
})

const query = (query, values) => {
    return new Promise((resolve, reject) => {
        mysqlCon.query(query, values, (err, result, fields) => {
            if(err) {
               reject(err) 
            }else{
               resolve(result)
            }
        })
    })
}

// const query = {} => {new Promise((resolve, reject) => {
//     return mysqlCon.query()
// })}

mysqlCon.connect((err) => {
    if (err) throw err

    console.log('mysql successfully connected')
})

app.use(bodyParser.json())

app.get('/persons', (req, res) => {
    mysqlCon.query("select * from revou.person", (err, result, fields) => {
      if (err){
        console.log(err)
        res.status(500).json(commonResponse(null, "server error"))
        res.end()
        return
      }
      
      console.log("err", err)
      console.log ("result", result)
      express.response.status(200).json(commonResponse(result, null))
    })
})

app.get('/persons/:id', async (req, res) => {
  try{
        const id = req.params.id
        const userKey = "user:"+id
        const cacheData = await redisCon.hgetall(userKey)
    
        if(Object.keys(cacheData).length !== 0){
        console.log("get data from cache")
        res.status(200).json(commonResponse(cacheData, null))
        res.end()
        return
        }
        //console.log("this wants to target revou database")
    
        const dbData = await query(`select
                p.id,
                p.name, 
                p.gender, 
                p.department, 
                sum(o.price) as amount
            from 
                revou.person as p
                left join revou.order as o
                on p.id = o.person_id
            where 
                p.id = 6
            group by 
                p.id`, id)
        
        await redisCon.hset(userKey, dbData[0])
        await redisCon.expire(userKey, 20)
                
        res.status(200).json(commonResponse(dbData[0], null))
        res.end()
  }catch(err){
    console.log(err)
    res.status(500).json(commonResponse(null, "server error"))
    res.end()
    return
  }

})

app.post('/persons', (req, res) => {
    
})

app.post('/orders', (req, res) => {
    const body = req.body

    mysqlCon.query(`
    insert into
        revou.order (person_id, price, product)
    values
    (?, ?, ?)
    `, [body.user_id, body.price, body.product], (err, result, fields) => {
        if (err){
            console.log(err)
            res.status(500).json(commonResponse(null, "server error"))
            res.end()
            return
          }
          
        res.status(200).json(commonResponse({
            id: result.insertId
        }, null))
        res.end()
    })
})

app.delete('/orders/:id', (req, res) => {
    const id = req.params.id  
    mysqlCon.query("delete from revou.order where id = ?", id, (err, result, fields) => {
        if (err){
            console.log(err)
            res.status(500).json(commonResponse(null, "server error"))
            res.end()
            return
          }

        if(result.affectedRows == 0){
            res.status(404).json(commonResponse(null, "data not found"))
            res.end()
            return
        }
          
        res.status(200).json(commonResponse({
            id: id
        }, null))
        res.end()
    })
})

app.listen(3000, () => {
    console.log("running in 3000")
})