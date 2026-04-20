import { FetchRequest } from "../api/client"

const BASE_URL=import.meta.env.VITE_TRANSLATION_API_BASE


export async function translate(text_string, target) {

    if(target==="en"){
        return {translated: text_string}
    }

    return await FetchRequest(
            BASE_URL, `/translate`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text:`${text_string}`, target:`${target}` })
            }
        )
}


export async function MessageArray_translate(messages_Array, target) {
    
    if(!messages_Array || !target || !Array.isArray(messages_Array)){
        return null
    }

    if(target==="en"){
        return messages_Array
    }

    const Combined_MessagesString=messages_Array.map(obj => obj.message).join(" <<>> ")
    
    const translated_str=await translate(Combined_MessagesString, target)

    const translated_arr=translated_str.translated.split(" <<>> ")


    const TranslatedArr=messages_Array.map((obj, indx)=>{
        obj.message=translated_arr[indx]

        return obj
    })

    return TranslatedArr
}