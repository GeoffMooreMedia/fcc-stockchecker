/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

//store count of likes for later comparison
let likes = 0;

suite('Functional Tests', function() {
    
    suite('GET /api/stock-prices => stockData object', function() {
      
      test('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog'})
        .end(function(err, res){

          //make sure there were no errors
          assert.isNull(err);
          //make sure the request was OK
          assert.isOk(res);
          //make sure the symbol is GOOG
          assert.equal(res.body.stock,'GOOG');
          //make sure the price is a decimal
          assert.isNumber(res.body.price);
          //make sure the likes is an int
          assert.isNumber(res.body.likes);
          done();
        });
      });
      
      test('1 stock with like', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog', like:true})
        .end(function(err, res){
          
          //should be no errors
          assert.isNull(err);
          assert.isOk(res);
          //make sure the symbol is GOOG
          assert.equal(res.body.stock,'GOOG');
          //make sure the price is a decimal
          assert.isNumber(res.body.price);
          //make sure the likes is an int
          assert.isNumber(res.body.likes);
          //likes should be at least one
          assert.isAtLeast(res.body.likes,1);
          //store the likes count
          likes = res.body.likes;
          done();
        });
      });
      
      test('1 stock with like again (ensure likes arent double counted)', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog', like:true})
        .end(function(err, res){
          //should be no errors
          assert.isNull(err);
          assert.isOk(res);
          //make sure the symbol is GOOG
          assert.equal(res.body.stock,'GOOG');
          //make sure the price is a decimal
          assert.isNumber(res.body.price);
          //make sure the likes is an int
          assert.isNumber(res.body.likes);
          //likes should be unchanged
          assert.equal(res.body.likes,likes);
          done();
        });
      });
      
      test('2 stocks', function(done) {
        chai.request(server)
        .get('/api/stock-prices?stock=goog&stock=msft')
        .end(function(err, res){          
          //should be no errors
          assert.isNull(err);
          assert.isOk(res);
          //should be an array
          assert.isTrue(Array.isArray(res.body));
          //make sure the required properties exist
          assert.property(res.body[0],'stock');
          assert.property(res.body[0],'price');
          assert.property(res.body[0],'rel_likes');
          assert.property(res.body[1],'stock');
          assert.property(res.body[1],'price');
          assert.property(res.body[1],'rel_likes');
          done();
        });
      });
      
      test('2 stocks with like', function(done) {
        chai.request(server)
        .get('/api/stock-prices?stock=goog&stock=msft&like=true')
        .end(function(err, res){          
          //should be no errors
          assert.isNull(err);
          assert.isOk(res);
          //should be an array
          assert.isTrue(Array.isArray(res.body));
          //make sure the required properties exist
          assert.property(res.body[0],'stock');
          assert.property(res.body[0],'price');
          assert.property(res.body[0],'rel_likes');
          assert.property(res.body[1],'stock');
          assert.property(res.body[1],'price');
          assert.property(res.body[1],'rel_likes');
          done();
        });
      });
      
    });

});
