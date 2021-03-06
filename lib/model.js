// This is not a Model in the traditional sense
// this provides functions to control an account
// object. The Account object has state but this
// is only to describe rolodex what kind of behavior
// it should apply to the object that is passed in.
//
// var account = new Model({
//   locals: {},
//   filters: {
//     in     : [],
//     before : [],
//     after  : [],
//     out    : []
//   },
//   validations: {}
// })
//
// account.validate(obj, function(errors, obj){
//   ...
// })
//
// account.validate(id, obj, function(errors, obj){
//   ...
// })
//
// account.create(obj, function(errors, obj){
//   ...
// })
// 
// account.update(id, obj, function(errors, obj){
//   ...
// })
// 
// account.get(id, function(obj){
//   ...
// })
//
// account.get({ property: value }, function(obj){
//   ...
// })
//
// account.destroy(id, function(errors, obj){
//   ...
// })
//

var flow = require("./flow")

module.exports = function(config){
  
  // make locals available  
  for(var local in config.locals)(function(local){
    this[local] = config.locals[local]
  })(local)
  
  var validations = config.validations
  var filters     = config.filters

  var Int = function(local){
    this.local = local
  }
  
  Int.prototype._valid = function(obj, cb){
    var errors = {
      messages: [],
      details: {}
    }
    var count = 0
    var total = Object.keys(validations).length

    // we need to filter first
    flow.filter(obj, filters.before, function(filtered_object){
      // validate!
      for(var field in validations)(function(field){  
        flow.validate(field, filtered_object, validations[field], function(field_errors){
          count ++
          
          if(field_errors && field_errors.length > 0){
            errors.messages.push(field + " " + field_errors[0])
            errors.details[field] = field_errors[0]
          }

          // validations are done
          if(total == count){
            cb(errors.messages.length > 0 ? errors : null, filtered_object) 
          }
          
        })
      })(field)    
    })
    
  }
  
  Int.prototype.valid = function(q, obj, cb){
    if(!cb){
      cb  = obj
      obj = q
      q  = null
    }
    var that = this;
    flow.filter(obj, filters.in, function(filtered_object){
      if(q){
        that.read(q, function(record){
          for(var prop in filtered_object)(function(prop){
            record[prop] = filtered_object[prop]  
          })(prop)
          that._valid(record, cb)
        })
      }else{
        that._valid(obj, cb)
      }
    })
  }
  
  Int.prototype.save = function(q, obj, cb){
    delete obj.id
    var that = this;

    that.valid(q, obj, function(errors, obj){
      if(errors){
        cb(errors, null)        
      }else{
        flow.filter(obj, filters.after, function(record){
          if(that.write){
            that.write(record, function(err, obj){
              if(!err){
                that.out(obj, function(record){
                  cb(null, record)
                })
              }
            })  
          }else{
            console.log("must create a write() method.")
            process.exit()
          }
        })          
      }
    })  
  }

  Int.prototype.with = function(sp){
    return new Int(sp)
  }
  
  Int.prototype.out = function(record, cb){
    if(record){
      flow.filter(record, filters.out, function(filtered_record){
        cb(filtered_record)
      })
    }else{
      cb(null)
    }
  }
  
  Int.prototype.get = function(id, cb){
    var that = this
    that.read(id, function(record){
      that.out(record, function(record){
        cb(record)
      })
    })
  }
  
  Int.prototype.create = function(obj, cb){
    this.save(null, obj, cb)
  }
  
  Int.prototype.update = function(q, obj, cb){
    this.save(q, obj, cb)
  }
  
  return new Int()
}

