class ApiError extends Error{
    constructor(
        statuscode,
        message="something went wrong",
        errors=[],
        stack=""//error stack
    ){
            super(message);
            this.statuscode=statuscode;
            this.errors=errors;
            this.message=message;
            this.data=null;
            this.success=false;



            if(stack){
                this.stack=stack;
            }else{
                    Error.capturestacktrace(this,this.constructor);
            }
    }
}
export{ApiError}