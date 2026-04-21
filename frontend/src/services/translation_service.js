import { FetchRequest } from "../api/client"

const BASE_URL=import.meta.env.VITE_TRANSLATION_API_BASE


export async function translate(text_string, target) {

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

    const translatedMessages = await Promise.all(messages_Array.map(async (obj) => {
        try {
            const res = await translate(obj.message, target);
            return {
                ...obj,
                message: res.translated
            };
        } catch (e) {
            console.error("Single message translation error:", e);
            return obj;
        }
    }));

    return translatedMessages;
}