var should = require("should")

describe("all", function(){
  var redis = require("redis")
  var client = redis.createClient()
  var rolodex = require("../rolodex")(client)
  var total = 500

  before(function(done){
    var count = 0
    for(var i = 1; i <= total; i++)(function(i){
      rolodex.account.create({
        "email": "user"+ i +"@sintaxi.com",
        "password":"foobar"
        }, function(errors, account){
        count++
        if(count == total){
          done()
        }
      })
    })(i)

  })

  it("should get all accounts", function(done) {
    start_time = new Date().getTime();
    rolodex.account.all(0, -1, function(accounts){
      end_time = new Date().getTime();
      accounts.should.be.an.instanceof(Array)
      accounts.length.should.eql(total)
      done()
    })
  })

  after(function(){
    console.log("\nTests completed in " +  ((end_time - start_time ) / 1000) + " seconds in average\n")
    client.flushall()
    client.quit()
  })

})

