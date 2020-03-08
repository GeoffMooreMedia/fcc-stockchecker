/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const expect = require('chai').expect;
const MongoClient = require('mongodb').MongoClient;
const axios = require('axios');

const MONGODB_CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  let likesCollection;
  
  //initialize the database connection
  const client = new MongoClient(MONGODB_CONNECTION_STRING, { useNewUrlParser: true });
  client.connect(err => {
    if(err) throw err;
    likesCollection = client.db("stockchecker").collection("likes");
    console.log('DB Connected');
  });

  app.route('/api/stock-prices')
    .get(function (req, res){
      //make sure there is at least one stock but less than three
      if(!req.query.stock || (Array.isArray(req.query.stock) && req.query.stock.length > 2)){
        res.status(400).send('At least one stock is required');
      }
      //if there are two stocks
      else if(req.query.stock.length === 2){
        
        //array of stock queries
        const stockQueries = [axios.get(`https://repeated-alpaca.glitch.me/v1/stock/${req.query.stock[0]}/quote`),axios.get(`https://repeated-alpaca.glitch.me/v1/stock/${req.query.stock[1]}/quote`)];
        //when both queries have returned
        Promise.all(stockQueries).then(stocks=>{
          //store stocks for easy access
          const stock1 = stocks[0].data;
          const stock2 = stocks[1].data;
          const updateLikes = [];//empty array for queries to update likes
          //if we need to update tke likes
          if(req.query.like){
            updateLikes.push(likesCollection.findOneAndUpdate({stock:stock1.symbol, ip:req.clientIp},{$set:{likes:1}},{upsert:true}));
            updateLikes.push(likesCollection.findOneAndUpdate({stock:stock2.symbol, ip:req.clientIp},{$set:{likes:1}},{upsert:true}));
          }
          //process the updateLikes
          Promise.all(updateLikes).then(()=>{
            //array of likes queries
            const likesQueries = [likesCollection.find({stock:stock1.symbol}),likesCollection.find({stock:stock2.symbol})];
            Promise.all(likesQueries).then(likes=>{
              let likes1;//likes for stock1
              let likes2;//likes for stock2
              
              
              //get the likes for stock1
              likes[0].toArray((err,results)=>{
                if(err)res.status(400).json({error:err});
                else{
                  likes1 = results.length;

                  //get the likes for stock 2
                  likes[1].toArray((err,results)=>{
                    if(err)res.status(400).json({error:err});
                    else{
                      likes2 = results.length;
                      const resultArr = [
                        //first stock
                        {
                          stock:stock1.symbol,
                          price:stock1.latestPrice,
                          rel_likes:likes1-likes2
                        },
                        //second stock
                        {
                          stock:stock2.symbol,
                          price:stock2.latestPrice,
                          rel_likes:likes2-likes1
                        }
                      ]
                      res.status(200).json(resultArr);
                    }
                  })
                }
              })

              
              
              
            }).catch(err=>res.status(400).json({error:err}));
          }).catch(err=>res.status(400).json({error:err}));
          
        }).catch(err=>res.status(400).json({error:err}));
        
      }
      //if like is true
      else if(req.query.like){
        // Fetch the price and symbol from the API
        axios.get(`https://repeated-alpaca.glitch.me/v1/stock/${req.query.stock}/quote`).then(stockResponse=>{
          //store the stock
          const stock = stockResponse.data;
          //find the likes from the database
          likesCollection.findOneAndUpdate({stock:stock.symbol, ip:req.clientIp},{$set:{likes:1}},{upsert:true}).then(() =>{
            //find all likes for this stock
            likesCollection.find({stock:stock.symbol}).toArray((err,result)=>{
              if(err) res.status(400).json({error:err});
              else{
                res.status(200).json({stock:stock.symbol,price:stock.latestPrice, likes:result.length});
              }
            });
            
          }).catch(err=>res.status(400).json({error:err}));
          
        }).catch(err=>{
          res.status(400).json({error:err});
        }); 
      }
      else{
        // Fetch the price and symbol from the API
        axios.get(`https://repeated-alpaca.glitch.me/v1/stock/${req.query.stock}/quote`).then(stockResponse=>{
          //store the stock
          const stock = stockResponse.data;
          //find the likes from the database
          likesCollection.findOne({stock:stock.symbol}).then(dbResponse =>{
            res.status(200).json({stock:stock.symbol,price:stock.latestPrice,likes:dbResponse ? dbResponse.likes:0});
          }).catch(err=>res.status(400).json({error:err}));
          
        }).catch(err=>{
          res.status(400).json({error:err});
        });
      }
    });
    
};
