class ApiResponse{
    constructor(statuscode,meassage="success",data){
        this.statuscode=statuscode;
        this.message=meassage;
        this.data=data;
        this.success=statuscode<400;  

    }
}
export {ApiResponse}