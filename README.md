[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-24ddc0f5d75046c5622901739e7c5dd533143b0c8e959d652212380cedb1ea36.svg)](https://classroom.github.com/a/Z42oEjTh)

# Week 9 Assignment :  Develop and Deploy Javascript MBanking App with its API and Connect it Into Database (https://aldi-mbank.fly.dev/)

This week PT. Revolusi Cita Edukasi gives instruction to the author to develop MBanking App with API and connect it into a database (MySQL with DBeaver Viewer connection). The instruction still incorporates Create Read Update and Delete conception implementation (CRUD).

The Requirements for this app development are : 
Requirements :
- show user info with user's total balance = total income - total expense
- add income / expense transaction
- update income / expense transaction
- delete income / expense transaction

## Development Process

To fullfill the requirements, Author should do some steps below :

1. Create database and tables in MySQL from DBeaver Viewer.

This step includes in creatio of user/client and transaction table. It consists of id and user_id which uses INT as their data types in MySQL. It contains name, address, type(income/expenses) as string data type which will use VARCHAR(100) in MySQL. Last but not the least, amount will be in double data types.

2. Build API endpoints methods in Javascript and Node JS. 

Build process on this simple MBanking app is similar with week 9 day 4 lecture which simulates on how to build mini online order app with Javascript, Node JS, NPM, PNPM, Postman, MySQL & DBeaver Viewer and Redis via powershell/windows terminal. Neverthless, there are some differences in API endpoint methods, database, API endpoints display in postman and codes on Javascript for instance.

Here are some case of differences
#### Calculating total balance, income and expense via GET transaction by id method

```Javascript
app.get('/users/:id', async (req, res) => {
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
    
        const dbData = await query(`select
                u.id,
                u.name, 
                u.address,  
                sum(case when t.type = 'income' then t.amount else 0 end) as total_income,
                sum(case when t.type = 'expense' then t.amount else 0 end) as total_expense
            from 
                revou.client as u
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
```

The differences specifically exist for MySQL syntax to calculate total balance.

```Javascript
            `select
                u.id,
                u.name, 
                u.address,  
                sum(case when t.type = 'income' then t.amount else 0 end) as total_income,
                sum(case when t.type = 'expense' then t.amount else 0 end) as total_expense
            from 
                revou.client as u
                left join revou.transaction as t
                on u.id = t.user_id
            where 
                u.id = ?
            group by 
                u.id`
```
#### PUT method for Update (CRUD)

The other difference from week 9 day 4 lecture example is PUT method for UPDATE

```Javascript
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
```

The other part of codes in Javascript are mostly similar with week 9 day 4 lecture. Nevertheless, those codes need some adjustment for different paths name or tables name in MySQL.

3. Successfully connect Database into Node JS

Author successfully connected Database into Node.js. Not only that, it also connected into postman for testing GET, POST, PUT and DELETE (CRUD) methods. The screenshots will be attached if there is time left to do that.

#### Database to Node JS Connection
![proof](https://github.com/RevoU-FSSE-2/week-9-andalanaldi/blob/main/W9-Assignment-Screenshots/successfully%20connected%20mysql%20and%20nodejs.JPG/?raw=true)

#### GET by id
![proof](https://github.com/RevoU-FSSE-2/week-9-andalanaldi/blob/main/W9-Assignment-Screenshots/GET.JPG/?raw=true)

#### Passed POST
![proof](https://github.com/RevoU-FSSE-2/week-9-andalanaldi/blob/main/W9-Assignment-Screenshots/POST%20pass.JPG/?raw=true)

#### Error POST
![proof](https://github.com/RevoU-FSSE-2/week-9-andalanaldi/blob/main/W9-Assignment-Screenshots/POST%20fail.JPG/?raw=true)

#### PUT by id 
![proof](https://github.com/RevoU-FSSE-2/week-9-andalanaldi/blob/main/W9-Assignment-Screenshots/PUT.JPG/?raw=true)

#### PUT effect on database
![proof](https://github.com/RevoU-FSSE-2/week-9-andalanaldi/blob/main/W9-Assignment-Screenshots/PUT%20effect%20on%20user_id%202.JPG/?raw=true)

#### DELETE by id
![proof](https://github.com/RevoU-FSSE-2/week-9-andalanaldi/blob/main/W9-Assignment-Screenshots/DELETE.JPG/?raw=true)

#### DELETE with unavailable id
![proof](https://github.com/RevoU-FSSE-2/week-9-andalanaldi/blob/main/W9-Assignment-Screenshots/DELETE%20with%20no%20available%20id.JPG/?raw=true)
#### DELETE effect on database
![proof](https://github.com/RevoU-FSSE-2/week-9-andalanaldi/blob/main/W9-Assignment-Screenshots/DELETE%20effect%20on%20user_id%202.JPG/?raw=true)

4. Successfully connect redis into MySQL and Node JS and make cache before MySQL
#### Redis
![proof](https://github.com/RevoU-FSSE-2/week-9-andalanaldi/blob/main/W9-Assignment-Screenshots/Redis.JPG/?raw=true)

#### Get Cache
![proof](https://github.com/RevoU-FSSE-2/week-9-andalanaldi/blob/main/W9-Assignment-Screenshots/get_cache.JPG/?raw=true)

Author successfully connected those things too. Nevertheless, if there is enough time to share the screenshots. Author will do that.
## Deployment Process

SImilar with week 8, First things first make sure to sign up on fly.io and modify billing via dashboard menu and add debit card number, thru date and cvc so that fly.io hobby plan could be used to deploy the Node JS app. Author has Visa Debit Card with IDR first double digits balance used for this because, when Author used a Master Card Debit with lower balance, the fly.io said the balance is insufficent so then it could not be used for deployment. If the fly.io configuration process is done the please do these steps:  

1. open windows terminal or cmd command prompt or both of them coz one of them could be fail to recognized flyctl command
2. open directory folder that has typescript and other code files. for instance :
```
cd "C:\Users\Aldi Andalan\Documents\revou\week-8-andalanaldi\"
```
3. run __winget install --id Microsoft.Powershell --source winget__ if it is not installed yet.
4. install fly.io on laptop if it is not installed yet via run this command:
```
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
```
5. run __flyctl auth__ login to login into fly.io
6. run __flyctl launch__ , enter or give name to app name but **Name may only contain numbers, lowercase letters and dashes** and press enter on Singapore region wait until finished
7. run __flyctl deploy__ to deploy express app into fly.io for Backend hosting
8. While waiting for deployment check if there is warning about **"The app is not listening on the expected address and will not be reachable by fly-proxy."**. If theat warning is founded then please recheck, edit or modify port on typescript codes or env, adjust port to be the same with fly.io port that is shown on warning message on terminal and give const secret fow access token if necessary.
9. If there is no warning and URLs for monitroing and deployment address have been given by fly.io through terminal. Then the deployment is succeeded and the address could be checked thorugh browser app.

On the terminal (command prompt) in windows, fly.io gives monitoring link and deployment link such as:

https://fly.io/apps/aldi-mbank/monitoring
https://aldi-mbank.fly.dev/

## Issues and Troubleshoots

Actually, there are some issues that author found during both development and deployment. The issues are:
1. Windows Script Host disabled in the machine error message when using npm start during local development.
2. Some unfamiliarity on modfiying syntaxes for total balance.
3. Some keys are left in Redis conflicted with connection from Redis into Database and Node JS.
4. Javascript is so messy compare to neat typescript and it also worse in deployment via fly.io which still gives problematic deployment for author.
5. Deployment in fly.io which needs 3 times deployment for main javascript codes and node pacakages, database deployment and redis deployment which complicates the deployment process.
6. Time management cannot be an excuse but still an issue here.

Author's troubleshoots effort for those issues :
1. Author use pnpm run dev instead and it runs seamlessly.
2. Author still ask ChatGPT helps just in term of fixing codes that has written by author before, so its not from the scratch and its limited to PUT methode and MySQL syntax for total balance.
3. Author try to address Redis issues by himself withour chatGPT helps and it turns out that there are some previous databases stored in Redis from Day 3 Week 9 Lecture practice. Hence author just deleted all those databases that conflicted with user/client and transcation tables in MySQL revou database.
4. This part is to address issues with deployment. Sometime in the future, if author has more spare time then hopefully author would like to try write the development in typescript first the try to deploy 3 deployment for node JS, database and redis in fly.io and slow ut sure try to solve time management issues.

Author realized even if author try to push the limit to work till redis assignment. Nevertheless, the other students this week have done the assignment until integration with Front End, Back End and Database along with Redis cache. Hence, author needs to be realistic about presentation in sprint session and learn from others first and author needs to realize that he has work burden these second semester of year.

Here is the end of documentation. If there is any question you can contact author through andalanaldi@gmail.com.