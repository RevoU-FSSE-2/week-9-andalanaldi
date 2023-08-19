/*

Requirements :
- show user info with user's total balance = total income - total expense
- add income / expense transaction
- update income / expense transaction
- delete income / expense transaction

Contracts :

GET /users/:id : show one client by id
response
{
    "success": true,
    "data":{
        {
            "id": 1,
            "name": "Albert",
            "address": "Jakarta",
            "Balance": 100000, 
            "expense": 5000 
        }
}

POST /transactions : add income / expense transaction
{
    "type": "income",
    "amount": 5000,
    "user_id": 1    
}

{
    "success": true,
    "data": {
        "id": 1 // transaction id
    }
}

PUT /transactions/:id : add transaction
{
    "type": "income",
    "amount": 5000,
    "user_id": 1      
}

{
    "success": true,
    "data": {
        "id": 1 // transaction id
    }
}

DELETE /transactions/:id : delete transactions
{
    "success": true,
    "data": {
        "id": 1 // transaction id
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

app.get('/users', (req, res) => {
    mysqlCon.query("select * from revou.user", (err, result, fields) => {
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

app.get('/users/:id', async (req, res) => {
  try{
        const id = req.params.id
        // const type= req.params.type
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
                u.id,
                u.name, 
                u.address,  
                sum(case when t.type = 'income' then t.amount else 0 end) as total_income,
                sum(case when t.type = 'expense' then t.amount else 0 end) as total_expense
            from 
                revou.users as u
                left join revou.transaction as t
                on u.id = t.user_id
            where 
                u.id = ?
            group by 
                u.id`, id)
        
        const userBalance = dbData[0].total_income - dbData[0].total_expense
        dbData[0].balance = userBalance

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

app.post('/users', (req, res) => {
    
})

app.post('/transactions', (req, res) => {
    const body = req.body

    mysqlCon.query(`
    insert into
        revou.transaction (user_id, type, amount)
    values
    (?, ?, ?)
    `, [body.user_id, body.type, body.amount], (err, result, fields) => {
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

app.put('/transactions/:id', async (req, res) => {
    const id = req.params.id
    const { type, amount } = req.body

    try {
        await query(`
            update revou.transaction
            set type = ?, amount = ?
            where id = ?
        `, [type, amount, id])

        res.status(200).json(commonResponse({ id }, null))
    } catch (err) {
        console.log(err)
        res.status(500).json(commonResponse(null, "server error"))
    }
})


app.delete('/transactions/:id', (req, res) => {
    const id = req.params.id  
    mysqlCon.query("delete from revou.transaction where id = ?", id, (err, result, fields) => {
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