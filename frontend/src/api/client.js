import { ApiError } from "./ApiError"




async function throw_api_error(response){
    let errorData=null;
    const text = await response.text();
    try{
        errorData=JSON.parse(text);
    }catch{
        errorData=text;
    }

    throw new ApiError({
            message: errorData?.detail || "Request Failed",
            status: response.status,
            data: errorData
        });
}




function attach_AccessToken(request_options){

    if( !request_options.credentials ){
        request_options.credentials="include"
    }

    if( !request_options.headers ){
        request_options.headers={
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token? access_token: "" }`
        }
    }
    request_options.headers.Authorization=`Bearer ${access_token? access_token: "" }`

}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


async function NullAccessTokenCheck(BASE_URL, endpoint) {

    if(endpoint=="/auth/login"){
        return
    }

    if(!access_token){
        try{
            const refresh_result=await SendRefreshRequest(BASE_URL)
            access_token=refresh_result.new_AccessToken
        }catch(e){
            access_token=null
            if(endpoint=="/auth/auto_login"){
                console.log("Error While Auto Login")
                throw e
            }else{
                window.location.href="/login"
                throw e
            }
        }
    }
}

async function SendRefreshRequest(BASE_URL){

    if(!refreshPromise){
        refreshPromise=(async ()=>{
            console.log(`${!access_token?"Access Token null":"Access Token Exipred/Invalid"}, sending refresh request`)
            const refresh_response= await fetch(
                                                `${BASE_URL}/auth/refresh`, 
                                                {
                                                    method: "POST", credentials: "include",
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                    }
                                                } 
                                               );

            if(!refresh_response.ok){
                await throw_api_error(refresh_response)
            }

            const refresh_result = await refresh_response.json();
            return refresh_result
            
        })().finally(()=>{
            refreshPromise=null
        })
    
    }

    return refreshPromise
}




export async function SendFetchRequest(
    BASE_URL,
    endpoint,
    options,
) {
    const some_url = `${BASE_URL}${endpoint}`;

    attach_AccessToken(options)
    // console.log(`sending request to ${BASE_URL}${endpoint} with options:`,"\n", options)

    const response = await fetch(some_url, {...options});

    if (!response.ok) {
        await throw_api_error(response)
    }

    const result = await response.json();

    // console.log("Server Response:","\n",JSON.stringify(result, null, 2))
    return result
    
}



let access_token=null
let refreshPromise=null


export async function FetchRequest(
    BASE_URL,
    endpoint,
    options,
) {

    if(refreshPromise ){
        await refreshPromise
    }

    await NullAccessTokenCheck(BASE_URL, endpoint)

    try{

        const result=await SendFetchRequest(BASE_URL, endpoint, options)
        return result
    }catch(e){
        if(e.status==401){

            if(endpoint=="/auth/login"){
                console.log("Error while login")
                throw e
            }

            try{
                
                const refresh_result=await SendRefreshRequest(BASE_URL)
                access_token=refresh_result.new_AccessToken

                const retry_result=await SendFetchRequest(BASE_URL, endpoint, options)
                return retry_result

            }catch(e){
                access_token=null
                if(endpoint=="/auth/auto_login"){
                    console.log("Error While Auto Login")
                    throw e
                }else{
                    console.log("...Redirecting User")
                    window.location.href="/login"
                    throw e
                }
            }
        }

        throw e
    }
}




