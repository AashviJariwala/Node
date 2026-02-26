class ApiError extends Error
{
    constructor(err,statusCode)
    {
        if(typeof(err)==="object" && err.name)
        {
            const {message,code}=ApiError.sequelizeErrors(err);
            super(message);
            this.statusCode=statusCode||code;
        }
        else{
            super(err);
            this.statusCode=statusCode||ApiError.inferStatusCode(err);
        }
        Error.captureStackTrace(this,this.constructor);
    }
   
    static sequelizeErrors(err){
        if(err.name==="SequelizeValidationError"){
            return {
                code:400,
                message:err.errors.map(e=>e.message).join(","),
            };
        }
        if(err.name==="SequelizeUniqueConstraintError"){
            return{
                code:409,
                message:"Duplicate entry : "+err.errors[0].message,
            }
        }
        if(err.name==="SequelizeForeignKeyConstraintError"){
            return{
                code:400,
                message:"Foreign Key Constraint Validated",
            }
        }
        return {code:500,message:err.message||"Database Error"};
    }
    static inferStatusCode(message)
    {
        if(/notfound/i.test(message)){
            return 404;
        }
        if(/unauthorized|forbidden/i.test(message)){
            return 401;
        }
        if(/validation|invalid|required/i.test(message)){
            return 400;
        }
        if(/duplicate|already exists/i.test(message)){
            return 409;
        }
        return 500;
    }
}

module.exports=ApiError;